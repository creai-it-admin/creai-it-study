import {Prisma} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {sessionAccessWhere,type StudyViewer} from '@/lib/study-access';
import {activityProgress,FIRST_RESULT,REVISED_RESULT,type ActivityData,type ActivitySnapshot} from './types';
import {appendEvent,eventView} from '@/lib/practice/events';
import type {Spotlight} from '@/lib/practice/types';
export class ActivityError extends Error {constructor(message:string,public status=400,public version?:string){super(message)}}
const admin=(u:StudyViewer)=>!!u.roles?.includes('admin');
const answersOf=(s:{answers:{formFieldId:string;text:string}[];firstResult:string;revisedResult:string}|null)=>Object.fromEntries([...(s?.answers??[]).map(a=>[a.formFieldId,a.text]),[FIRST_RESULT,s?.firstResult??''],[REVISED_RESULT,s?.revisedResult??'']]);
export async function readActivity(id:string,user:StudyViewer):Promise<ActivityData>{
 const session=await prisma.studySession.findFirst({where:{id,...sessionAccessWhere(user)},include:{attendances:{select:{userId:true,state:true}},study:{include:{members:{include:{user:{select:{id:true,name:true}}}}}},formDef:{include:{fields:{orderBy:{order:'asc'}}}}}});
 if(!session)throw new ActivityError('이 회차에 접근할 수 없습니다.',404);
 const subs=session.formDef?await prisma.submission.findMany({where:{formDefId:session.formDef.id,...(!admin(user)?{OR:[{userId:user.id},...(session.sharingOpen?[{firstSharedAt:{not:null}}]:[])]}:{})},include:{answers:true,user:{select:{id:true,name:true}},feedback:{include:{author:{select:{id:true,name:true}}},orderBy:{updatedAt:'asc'}}}}):[];
 const mine=subs.find(s=>s.userId===user.id)??null;
 const feedback=(s:typeof subs[number],all=false)=>s.feedback.filter(f=>all||f.authorId===user.id).map(f=>({id:f.id,authorId:f.authorId,name:f.author.name??'참가자',text:f.text,updatedAt:f.updatedAt.toISOString()}));
 const spot=session.spotlight as Spotlight|null,agent=!!session.formDef?.agentMd.trim();
 const [spotEvents,turns]=await Promise.all([
  spot?prisma.practiceEvent.findMany({where:{sessionId:id,userId:spot.userId,seq:{gte:spot.from,lte:spot.to}},orderBy:{seq:'asc'},include:{user:{select:{name:true}}}}):[],
  admin(user)&&agent?prisma.practiceEvent.groupBy({by:['userId'],where:{sessionId:id,kind:'request'},_count:{_all:true}}):[],
 ]);
 const roster=new Map(session.study.members.map(m=>[m.userId,m.user]));
 if(admin(user))for(const s of subs)roster.set(s.userId,s.user);
 return {
  session:{id:session.id,studyName:session.study.name,weekNo:session.weekNo,status:session.status,activityStatus:session.activityStatus,sharingOpen:session.sharingOpen},viewer:{id:user.id,admin:admin(user)},
  form:session.formDef?{topicMd:session.formDef.topicMd,fields:session.formDef.fields,agent}:null,
  spotlight:spotEvents.length?{name:spotEvents[0].user.name??'참가자',events:spotEvents.map(eventView)}:null,
  mine:{id:mine?.id??null,version:mine?.updatedAt.toISOString()??'new',answers:answersOf(mine),firstSnapshot:(mine?.firstSnapshot??null) as ActivitySnapshot|null,firstSharedAt:mine?.firstSharedAt?.toISOString()??null,completedAt:mine?.completedAt?.toISOString()??null,feedback:mine?feedback(mine,true):[]},
  peers:session.sharingOpen?subs.filter(s=>s.userId!==user.id&&s.firstSnapshot&&s.firstSharedAt).map(s=>({id:s.id,userId:s.userId,name:s.user.name??'참가자',snapshot:s.firstSnapshot as ActivitySnapshot,completedAt:s.completedAt?.toISOString()??null,revisedResult:s.completedAt?s.revisedResult:'',reflection:s.completedAt?Object.fromEntries(s.answers.filter(a=>session.formDef?.fields.some(f=>f.id===a.formFieldId&&f.stage==='after')).map(a=>[a.formFieldId,a.text])):{},feedback:feedback(s,admin(user))})):[],
  people:admin(user)?[...roster.values()].map(u=>{const s=subs.find(s=>s.userId===u.id);return{id:u.id,name:u.name??'참가자',progress:activityProgress(s),attendance:session.attendances.find(a=>a.userId===u.id)?.state??'미접속',filled:s?.answers.filter(a=>a.text.trim()).length??0,total:session.formDef?.fields.length??0,answers:answersOf(s??null),firstSnapshot:(s?.firstSnapshot??null) as ActivitySnapshot|null,feedback:s?feedback(s,true):[],turns:turns.find(t=>t.userId===u.id)?._count._all??0}}):[],
 };
}
export async function mutateActivity(id:string,user:StudyViewer,body:unknown){
 if(!body||typeof body!=='object')throw new ActivityError('잘못된 요청입니다.');
 const b=body as Record<string,unknown>;
 return prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
  const session=await tx.studySession.findFirst({where:{id,...sessionAccessWhere(user)},include:{formDef:{include:{fields:{orderBy:{order:'asc'}}}}}});
  if(!session)throw new ActivityError('이 회차에 접근할 수 없습니다.',404);
  if(['open','close','reopen','sharing','spotlight'].includes(String(b.action))){
   if(!admin(user))throw new ActivityError('운영진만 활동을 관리할 수 있습니다.',403);
   if(!session.formDef?.fields.some(f=>f.stage==='before'))throw new ActivityError('먼저 활동 주제와 피드백 전 질문을 등록해 주세요.');
   if(b.action==='spotlight'){
    if(b.clear===true){await tx.studySession.update({where:{id},data:{spotlight:Prisma.DbNull}});return {ok:true};}
    const {userId,from,to}=b;
    if(typeof userId!=='string'||typeof from!=='number'||typeof to!=='number'||!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<from||to-from>=20)throw new ActivityError('띄울 기록을 1~20개 선택해 주세요.');
    if(!await tx.practiceEvent.count({where:{sessionId:id,userId,seq:{gte:from,lte:to}}}))throw new ActivityError('선택한 기록을 찾을 수 없습니다.',404);
    await tx.studySession.update({where:{id},data:{spotlight:{userId,from,to} as Prisma.InputJsonValue}});
    return {ok:true};
   }
   if(b.action==='sharing'){
    if(typeof b.open!=='boolean')throw new ActivityError('공유 여부를 확인해 주세요.');
    await tx.studySession.update({where:{id},data:{sharingOpen:b.open}});
   }else await tx.studySession.update({where:{id},data:{activityStatus:b.action==='close'?'closed':'open',...(b.action==='open'?{sharingOpen:true}:{})}});
   return {ok:true};
  }
  if(session.activityStatus!=='open')throw new ActivityError('지금은 작성할 수 없습니다. 입력한 내용은 이 브라우저에 보관됩니다.',409);
  const form=session.formDef;if(!form)throw new ActivityError('활동 질문이 아직 준비되지 않았습니다.',409);
  if(b.action==='feedback'){
   if(typeof b.target!=='string'||typeof b.text!=='string'||!b.text.trim()||b.text.length>5000)throw new ActivityError('피드백을 1~5,000자로 작성해 주세요.');
   const target=await tx.submission.findFirst({where:{id:b.target,formDefId:form.id,firstSharedAt:{not:null}}});
   if(!session.sharingOpen||!target)throw new ActivityError('공유 중인 제출물을 찾을 수 없습니다.',404);
   if(target.userId===user.id)throw new ActivityError('다른 참가자의 결과를 선택해 주세요.');
   await tx.activityFeedback.upsert({where:{submissionId_authorId:{submissionId:target.id,authorId:user.id}},create:{submissionId:target.id,authorId:user.id,text:b.text.trim()},update:{text:b.text.trim()}});
   return {ok:true};
  }
  if(!['save','share','complete'].includes(String(b.action))||typeof b.version!=='string'||!b.answers||typeof b.answers!=='object'||Array.isArray(b.answers))throw new ActivityError('잘못된 저장 요청입니다.');
  const values=b.answers as Record<string,string>;
  const ids=new Set([...form.fields.map(f=>f.id),FIRST_RESULT,REVISED_RESULT]);
  if(Object.keys(values).length!==ids.size||Object.entries(values).some(([k,v])=>!ids.has(k)||typeof v!=='string'||v.length>30000))throw new ActivityError('질문 구성이 바뀌었거나 답변이 너무 깁니다. 입력 내용을 복사한 뒤 새로고침해 주세요.');
  let sub=await tx.submission.findUnique({where:{formDefId_userId:{formDefId:form.id,userId:user.id}},include:{answers:true}});
  const version=sub?.updatedAt.toISOString()??'new';
  const same=sub&&Object.entries(values).every(([k,v])=>answersOf(sub)[k]===v);
  if(b.version!==version){
   if(same&&(b.action==='save'||(b.action==='share'&&sub?.firstSharedAt)||(b.action==='complete'&&sub?.completedAt)))return {ok:true,version,submitted:b.action!=='save',firstSharedAt:sub?.firstSharedAt,completedAt:sub?.completedAt};
   throw new ActivityError('다른 탭의 저장 내용과 충돌했습니다. 글을 확인한 뒤 다시 저장해 주세요.',409,version);
  }
  if(sub?.firstSnapshot){
   const snapshot=sub.firstSnapshot as ActivitySnapshot;
   if(form.fields.some(f=>f.stage==='before'&&values[f.id]!==snapshot.answers[f.id])||values[FIRST_RESULT]!==snapshot.result)throw new ActivityError('첫 공유본은 보존됩니다. 수정 내용은 아래의 수정 결과에 남겨 주세요.',409);
  }
  if(b.action==='share'&&!sub?.firstSharedAt){
   if(form.fields.some(f=>f.stage==='before'&&!values[f.id].trim())||!values[FIRST_RESULT].trim())throw new ActivityError('공유 전 질문과 사례·첫 결과를 모두 작성해 주세요.');
  }
  if(b.action==='complete'){
   if(!sub?.firstSharedAt)throw new ActivityError('먼저 첫 결과를 공유해 주세요.');
   if(form.fields.some(f=>f.stage==='after'&&!values[f.id].trim())||!values[REVISED_RESULT].trim())throw new ActivityError('토론 메모 또는 다시 받은 결과와 피드백 후 답변을 작성해 주세요.');
  }
  if(!sub)sub=await tx.submission.create({data:{formDefId:form.id,userId:user.id},include:{answers:true}});
  for(const f of form.fields)await tx.answer.upsert({where:{submissionId_formFieldId:{submissionId:sub.id,formFieldId:f.id}},create:{submissionId:sub.id,formFieldId:f.id,text:values[f.id]},update:{text:values[f.id]}});
  const stamp=new Date(Math.max(Date.now(),sub.updatedAt.getTime()+1));
  const first=b.action==='share'&&!sub.firstSharedAt;
  const row=await tx.submission.update({where:{id:sub.id},data:{firstResult:values[FIRST_RESULT],revisedResult:values[REVISED_RESULT],updatedAt:stamp,
   ...(first?{firstSharedAt:stamp,firstSnapshot:{answers:Object.fromEntries(form.fields.filter(f=>f.stage==='before').map(f=>[f.id,values[f.id]])),result:values[FIRST_RESULT]} as Prisma.InputJsonValue}:{}),
   ...(b.action==='complete'?{completedAt:stamp,submittedAt:stamp,status:'submitted'}:{}),
   ...(b.action==='save'&&sub.completedAt&&!same?{completedAt:null,status:'draft'}:{})}});
  // Shared and submitted results are milestones in the practice record, ordered with the AI conversation.
  if(form.agentMd.trim()&&(first||b.action==='complete'))await appendEvent(tx,id,user.id,'result',b.action==='complete'?values[REVISED_RESULT]:values[FIRST_RESULT],{target:b.action==='complete'?'revised':'first'});
  await tx.attendance.upsert({where:{sessionId_userId:{sessionId:id,userId:user.id}},create:{sessionId:id,userId:user.id,firstSeenAt:new Date()},update:{}});
  return {ok:true,version:row.updatedAt.toISOString(),submitted:b.action!=='save',firstSharedAt:row.firstSharedAt,completedAt:row.completedAt};
 },{maxWait:10000,timeout:20000});
}
