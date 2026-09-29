import type {Prisma} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {ActivityError} from '@/lib/activity/service';
import type {Schema} from '@/lib/reports/schema';
import {COMMENTARY_PROMPT_VERSION,COMMENTARY_SYSTEM_PROMPT,SUMMARY_PROMPT_VERSION,SUMMARY_SYSTEM_PROMPT} from './prompt';
import {COMMENTARY_SCHEMA,SUMMARY_SCHEMA,parseCommentary,parseSummary} from './schema';
import type {Commentary,CommentaryView,PracticeSummary,Spotlight} from './types';
export const COMMENTARY_MODEL='gpt-6-luna',COMMENTARY_REASONING='high';
type Stored={data:Commentary;inputs:Record<string,number>;generatedAt:string};
const clip=(s:string)=>s.length>6000?`${s.slice(0,6000)}…`:s;
async function structured(name:string,schema:Schema,instructions:string,input:unknown):Promise<unknown>{
 if(!process.env.OPENAI_API_KEY)throw new ActivityError('서버에 OPENAI_API_KEY를 설정해 주세요.',503);
 let result:{status?:string;output?:{content?:{type:string;text?:string}[]}[]};
 try{
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
   body:JSON.stringify({model:COMMENTARY_MODEL,reasoning:{effort:COMMENTARY_REASONING},store:false,max_output_tokens:32000,instructions,input:JSON.stringify(input),text:{format:{type:'json_schema',name,strict:true,schema}}}),
   signal:AbortSignal.timeout(120000)});
  if(!response.ok)throw new ActivityError(`해설 요청이 실패했습니다 (${response.status}). 모델 접근 권한과 사용 한도를 확인해 주세요.`,502);
  result=await response.json();
 }catch(e){throw e instanceof ActivityError?e:new ActivityError(e instanceof Error&&e.name==='TimeoutError'?'해설 생성 시간이 초과됐습니다. 다시 시도해 주세요.':'해설 요청에 연결하지 못했습니다.',502)}
 const content=(result.output??[]).flatMap(o=>o.content??[]);
 if(result.status!=='completed'||content.some(c=>c.type==='refusal'))throw new ActivityError('해설을 완료하지 못했습니다. 다시 시도해 주세요.',502);
 try{return JSON.parse(content.filter(c=>c.type==='output_text').map(c=>c.text).join(''))}catch{throw new ActivityError('해설 응답을 읽지 못했습니다.',502)}
}
export async function summarizeParticipant(sessionId:string,userId:string){
 const [form,rows,sub,current]=await Promise.all([
  prisma.formDef.findUnique({where:{sessionId},include:{fields:{orderBy:{order:'asc'}}}}),
  prisma.practiceEvent.findMany({where:{sessionId,userId},orderBy:{seq:'asc'}}),
  prisma.submission.findFirst({where:{formDef:{sessionId},userId},include:{answers:true}}),
  prisma.practiceSummary.findUnique({where:{sessionId_userId:{sessionId,userId}}}),
 ]);
 if(!form||!rows.some(r=>r.kind==='request'))return null;
 const throughSeq=rows[rows.length-1].seq;
 if(current&&current.throughSeq>=throughSeq&&current.promptVersion===SUMMARY_PROMPT_VERSION)return current;
 const events=rows.map(r=>({seq:r.seq,kind:r.kind,text:clip(r.text),...(r.kind==='result'?{target:(r.meta as {target?:string}|null)?.target}:{})}));
 const written=form.fields.flatMap(f=>{const text=sub?.answers.find(a=>a.formFieldId===f.id)?.text.trim();return text?[{question:f.question,stage:f.stage,text}]:[]});
 const data:PracticeSummary=parseSummary(await structured('practice_summary',SUMMARY_SCHEMA,SUMMARY_SYSTEM_PROMPT,{context:{topic:form.topicMd,task:form.agentMd},written,events}),events);
 return prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`summary:${sessionId}:${userId}`}, 0))`;
  // Refreshes can overlap (result submission and the instructor's button). A summary of older records never replaces a newer one.
  const latest=await tx.practiceSummary.findUnique({where:{sessionId_userId:{sessionId,userId}}});
  if(latest&&latest.throughSeq>throughSeq&&latest.promptVersion===SUMMARY_PROMPT_VERSION)return latest;
  const row={throughSeq,data:data as Prisma.InputJsonValue,model:COMMENTARY_MODEL,reasoning:COMMENTARY_REASONING,promptVersion:SUMMARY_PROMPT_VERSION,generatedAt:new Date()};
  return tx.practiceSummary.upsert({where:{sessionId_userId:{sessionId,userId}},create:{sessionId,userId,...row},update:row});
 });
}
// Refresh stale personal summaries in parallel, then compare summaries only, so the in-class wait stays at two model calls.
export async function prepareCommentary(sessionId:string){
 const session=await prisma.studySession.findUnique({where:{id:sessionId},include:{formDef:true}});
 if(!session)throw new ActivityError('회차를 찾을 수 없습니다.',404);
 if(!session.formDef?.agentMd.trim())throw new ActivityError('이 회차에는 AI 실습이 준비되지 않았습니다.',409);
 const people=await prisma.practiceEvent.groupBy({by:['userId'],where:{sessionId,kind:'request'}});
 if(!people.length)throw new ActivityError('아직 AI 실습 기록이 없습니다.',409);
 const failed=(await Promise.allSettled(people.map(p=>summarizeParticipant(sessionId,p.userId)))).filter(r=>r.status==='rejected').length;
 const summaries=await prisma.practiceSummary.findMany({where:{sessionId,promptVersion:SUMMARY_PROMPT_VERSION},orderBy:{userId:'asc'}});
 if(!summaries.length)throw new ActivityError('개인 요약을 만들지 못했습니다. 잠시 뒤 다시 시도해 주세요.',502);
 // Pseudonymous keys keep names out of the model input.
 const keyed=summaries.map((s,i)=>({key:`p${i+1}`,s}));
 const raw=await structured('practice_commentary',COMMENTARY_SCHEMA,COMMENTARY_SYSTEM_PROMPT,{context:{topic:session.formDef.topicMd,task:session.formDef.agentMd},participants:keyed.map(({key,s})=>({key,summary:s.data}))});
 let data:Commentary;
 try{data=parseCommentary(raw,new Map(keyed.map(({key,s})=>[key,{userId:s.userId,throughSeq:s.throughSeq}])))}catch(e){throw new ActivityError(e instanceof Error?e.message:'해설 응답 형식이 올바르지 않습니다.',502)}
 const stored:Stored={data,inputs:Object.fromEntries(summaries.map(s=>[s.userId,s.throughSeq])),generatedAt:new Date().toISOString()};
 await prisma.studySession.update({where:{id:sessionId},data:{commentary:{...stored,model:COMMENTARY_MODEL,reasoning:COMMENTARY_REASONING,promptVersion:COMMENTARY_PROMPT_VERSION} as Prisma.InputJsonValue}});
 return failed;
}
export async function readCommentary(sessionId:string,failed=0):Promise<CommentaryView>{
 const session=await prisma.studySession.findUnique({where:{id:sessionId},select:{commentary:true,spotlight:true,formDef:{select:{agentMd:true}}}});
 if(!session)throw new ActivityError('회차를 찾을 수 없습니다.',404);
 const [latest,turns,summaries]=await Promise.all([
  prisma.practiceEvent.groupBy({by:['userId'],where:{sessionId},_max:{seq:true}}),
  prisma.practiceEvent.groupBy({by:['userId'],where:{sessionId,kind:'request'},_count:{_all:true}}),
  prisma.practiceSummary.findMany({where:{sessionId}}),
 ]);
 const names=new Map((await prisma.user.findMany({where:{id:{in:latest.map(l=>l.userId)}},select:{id:true,name:true}})).map(u=>[u.id,u.name??'참가자']));
 const stored=session.commentary as Stored|null;
 const people=latest.map(l=>{const s=summaries.find(s=>s.userId===l.userId);return {id:l.userId,name:names.get(l.userId)??'참가자',turns:turns.find(t=>t.userId===l.userId)?._count._all??0,latestSeq:l._max.seq??0,summary:s?{data:s.data as PracticeSummary,throughSeq:s.throughSeq,generatedAt:s.generatedAt.toISOString()}:null}}).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
 return {enabled:!!session.formDef?.agentMd.trim(),commentary:stored?{data:stored.data,generatedAt:stored.generatedAt,stale:people.some(p=>p.latestSeq>(stored.inputs[p.id]??0))}:null,people,spotlight:session.spotlight as Spotlight|null,...(failed?{failed}:{})};
}
