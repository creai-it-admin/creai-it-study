import {prisma} from '../lib/prisma';
import {formLockedReason} from '../lib/form-editor';
export const week2Activity={
 topicMd:'내 일 하나를 골라 AI와 함께 기획하고, 첫 결과를 받은 뒤 피드백을 반영해 한 번 수정합니다.\n\n기획 5분 → 실행·기록 10분 → 짝 피드백 5분 → 수정·재실행 5분. 시간이 남으면 전체 공유 5분을 더합니다.\n발표 첫 장 구성안, 영업 후보 세 곳, 짧은 제안문처럼 수업 안에 결과를 받을 수 있는 작업을 고르세요. 질문에는 한두 문장으로 답해도 충분합니다.',
 fields:[{question:'어떤 일을 하려고 했고, AI는 어떤 초안을 제안했나요?',stage:'before'},{question:'초안의 무엇을 고쳤고, AI에게 어떤 작업을 맡겼나요?',stage:'before'},{question:'첫 결과는 실제 업무에 쓸 만한가요? 확인한 기준과 아쉬운 점을 적어 주세요.',stage:'before'},{question:'어떤 피드백을 반영해 무엇을 조정했나요? 다시 받은 결과가 어떻게 달라졌는지 적어 주세요.',stage:'after'}]
};
async function main(){const id='cmtrehjb0001axufjmbpsajam';await prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${id},0))`;const s=await tx.studySession.findUniqueOrThrow({where:{id},include:{formDef:{include:{_count:{select:{submissions:true}}}}}});if(s.studyId!=='study-zero'||s.weekNo!==2)throw Error('Wrong session');const reason=formLockedReason(s.status,s.formDef?._count.submissions??0,s.activityStatus);if(reason)throw Error(reason);if(s.formDef){console.log('Existing form preserved; no changes');return;}await tx.formDef.create({data:{sessionId:id,topicMd:week2Activity.topicMd,fields:{create:week2Activity.fields.map((f,i)=>({...f,order:i+1}))}}});console.log('Week 2 activity prepared; remains locked until operator opens it.');});}
if(process.argv.includes('--apply'))main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>prisma.$disconnect());
