import type {Prisma} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {sessionAccessWhere,type StudyViewer} from '@/lib/study-access';
import {ActivityError} from '@/lib/activity/service';
import {appendEvent,eventView} from './events';
import {PRACTICE_PROMPT_VERSION,PRACTICE_SYSTEM_PROMPT} from './prompt';
import type {PracticeSource} from './types';
export const PRACTICE_MODEL='gpt-6-luna',PRACTICE_REASONING='high',PRACTICE_TURN_LIMIT=60;
const admin=(u:StudyViewer)=>!!u.roles?.includes('admin');
export async function listEvents(id:string,viewer:StudyViewer,userId=viewer.id){
 if(userId!==viewer.id&&!admin(viewer))throw new ActivityError('다른 참가자의 실습 기록은 운영진만 볼 수 있습니다.',403);
 if(!await prisma.studySession.findFirst({where:{id,...sessionAccessWhere(viewer)},select:{id:true}}))throw new ActivityError('이 회차에 접근할 수 없습니다.',404);
 const rows=await prisma.practiceEvent.findMany({where:{sessionId:id,userId},orderBy:{seq:'asc'}});
 return {events:rows.map(eventView),remaining:Math.max(0,PRACTICE_TURN_LIMIT-rows.filter(r=>r.kind==='request').length)};
}
type Output={id:string;model:string;usage?:unknown;output?:{type:string;action?:{query?:unknown};content?:{type:string;text?:string;annotations?:{type:string;url?:string;title?:string}[]}[]}[]};
export function readOutput(r:Output){
 const content=(r.output??[]).filter(o=>o.type==='message').flatMap(o=>o.content??[]).filter(c=>c.type==='output_text');
 const sources=new Map<string,PracticeSource>();
 for(const a of content.flatMap(c=>c.annotations??[]))if(a.type==='url_citation'&&a.url)sources.set(a.url,{url:a.url,title:a.title||a.url});
 const searches=(r.output??[]).flatMap(o=>o.type==='web_search_call'&&typeof o.action?.query==='string'?[o.action.query]:[]);
 return {text:content.map(c=>c.text??'').join(''),sources:[...sources.values()],searches};
}
// Validation fails before streaming so the route can answer with a status code. Model failures arrive as an NDJSON error line.
export async function practiceTurn(id:string,user:StudyViewer,input:unknown){
 const text=typeof (input as {text?:unknown})?.text==='string'?((input as {text:string}).text).trim():'';
 if(!text||text.length>8000)throw new ActivityError('요청을 1~8,000자로 작성해 주세요.');
 const session=await prisma.studySession.findFirst({where:{id,...sessionAccessWhere(user)},include:{formDef:{include:{fields:{orderBy:{order:'asc'}}}}}});
 if(!session)throw new ActivityError('이 회차에 접근할 수 없습니다.',404);
 const form=session.formDef;
 if(!form?.agentMd.trim())throw new ActivityError('이 회차에는 AI 실습이 준비되지 않았습니다.',409);
 if(session.activityStatus!=='open')throw new ActivityError('활동이 열려 있을 때 AI와 작업할 수 있습니다.',409);
 if(!process.env.OPENAI_API_KEY)throw new ActivityError('서버에 OPENAI_API_KEY를 설정해 주세요.',503);
 if(await prisma.practiceEvent.count({where:{sessionId:id,userId:user.id,kind:'request'}})>=PRACTICE_TURN_LIMIT)throw new ActivityError(`이번 회차의 AI 요청 ${PRACTICE_TURN_LIMIT}회를 모두 사용했습니다.`,429);
 const request=await prisma.$transaction(tx=>appendEvent(tx,id,user.id,'request',text));
 const [history,sub]=await Promise.all([
  prisma.practiceEvent.findMany({where:{sessionId:id,userId:user.id,kind:{in:['request','response']}},orderBy:{seq:'asc'},select:{kind:true,text:true}}),
  prisma.submission.findUnique({where:{formDefId_userId:{formDefId:form.id,userId:user.id}},include:{answers:true}}),
 ]);
 const written=form.fields.filter(f=>f.stage==='before').flatMap(f=>{const a=sub?.answers.find(a=>a.formFieldId===f.id)?.text.trim();return a?[`${f.question}\n${a}`]:[]});
 const instructions=`${PRACTICE_SYSTEM_PROMPT}\n\n[실습 준비]\n주제: ${form.topicMd}\n\n${form.agentMd}${written.length?`\n\n[참가자가 적은 목표·기준]\n${written.join('\n\n')}`:''}`;
 const body={model:PRACTICE_MODEL,reasoning:{effort:PRACTICE_REASONING},store:false,stream:true,max_output_tokens:32000,instructions,
  input:history.map(e=>({role:e.kind==='request'?'user':'assistant',content:e.text})),...(form.agentWebSearch?{tools:[{type:'web_search'}]}:{})};
 const encoder=new TextEncoder();
 return new ReadableStream<Uint8Array>({async start(controller){
  // Keep reading upstream after a client disconnect so a finished answer is still recorded.
  const send=(v:object)=>{try{controller.enqueue(encoder.encode(JSON.stringify(v)+'\n'))}catch{}};
  try{
   const res=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(280000)});
   if(!res.ok||!res.body)throw Error(`AI 응답 요청이 실패했습니다 (${res.status}). 잠시 뒤 다시 보내 주세요.`);
   let buffer='',done:Output|null=null;const reader=res.body.pipeThrough(new TextDecoderStream()).getReader();
   for(let chunk=await reader.read();!chunk.done;chunk=await reader.read()){
    buffer+=chunk.value;let i:number;
    while((i=buffer.indexOf('\n\n'))>=0){
     const data=buffer.slice(0,i).split('\n').filter(l=>l.startsWith('data: ')).map(l=>l.slice(6)).join('');buffer=buffer.slice(i+2);
     if(!data)continue;const e=JSON.parse(data);
     if(e.type==='response.output_text.delta')send({t:'delta',v:e.delta});
     else if(e.type==='response.web_search_call.searching')send({t:'status',v:'search'});
     else if(e.type==='response.completed')done=e.response;
     else if(e.type==='response.incomplete')throw Error('응답이 너무 길어 중단됐습니다. 범위를 나눠 다시 요청해 주세요.');
     else if(e.type==='response.failed'||e.type==='error')throw Error('AI 응답을 완료하지 못했습니다. 다시 보내 주세요.');
    }
   }
   if(!done)throw Error('AI 응답이 완료되지 않았습니다. 다시 보내 주세요.');
   const out=readOutput(done);
   if(!out.text.trim())throw Error('AI가 이 요청에 답하지 못했습니다. 요청을 바꿔 다시 보내 주세요.');
   const response=await prisma.$transaction(tx=>appendEvent(tx,id,user.id,'response',out.text,{sources:out.sources,searches:out.searches,responseId:done.id,model:done.model,reasoning:PRACTICE_REASONING,promptVersion:PRACTICE_PROMPT_VERSION,usage:done.usage??null} as Prisma.InputJsonValue));
   send({t:'done',request:eventView(request),response:eventView(response)});
  }catch(e){
   // A request without an answer is not part of the process record; the client restores the text.
   await prisma.practiceEvent.deleteMany({where:{id:request.id}}).catch(()=>{});
   send({t:'error',message:e instanceof Error&&e.name!=='TimeoutError'?e.message:'AI 응답 시간이 초과됐습니다. 다시 보내 주세요.'});
  }finally{try{controller.close()}catch{}}
 }});
}
