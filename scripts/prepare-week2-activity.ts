import {prisma} from '../lib/prisma';
import {formLockedReason} from '../lib/form-editor';
export const week2Activity={
  "topicMd": "이번 인클래스는 각자가 AI에게 실제로 맡겨본 일을 함께 돌아보는 토론입니다. 새 작업을 수행하거나 재실행할 필요는 없습니다.\n\n사례 정리 3분 → 돌아가며 공유 12분(6명 기준 1인 2분) → 두 사례 집중 토론 8분 → 다음에 바꿀 기준 기록 2분. 토론을 5분 더하면 총 30분입니다.\n\n공유 전 세 질문에 짧게 답하고, 사례·첫 결과 칸에 실제 요청·결과 일부나 짧은 사례 요약을 남겨주세요. 잘된 점과 막힌 점 모두 좋습니다. 민감한 정보는 가려주세요.\n함께 어느 지점에서 결과가 달라졌는지, 사람이 개입할 곳과 더 맡겨볼 곳은 어디인지 논의합니다. 토론 후에는 다음에 바꿔볼 기준 하나를 남깁니다. 마무리 기록 칸에는 토론 메모를 남기면 됩니다. 새 결과물을 만들 필요는 없습니다.\n맡겨본 사례가 없다면 맡기려다 망설인 일, 망설인 이유와 기대하는 결과를 공유해 주세요.",
  "fields": [
    {
      "question": "무슨 일을 AI에게 어디까지 맡겼나요? 실제 요청을 짧게 보여주세요. (사례가 없다면 맡기려던 일)",
      "stage": "before"
    },
    {
      "question": "받은 결과에서 쓸 만했던 부분과 기대와 달랐던 부분은 무엇인가요? (사례가 없다면 망설인 이유와 기대하는 결과)",
      "stage": "before"
    },
    {
      "question": "내가 어디에 개입했나요? 함께 논의하고 싶은 지점은 무엇인가요?",
      "stage": "before"
    },
    {
      "question": "토론에서 얻은 기준 하나는 무엇인가요? 다음에는 무엇을 다르게 맡기고, 어떤 결과로 확인해볼 건가요?",
      "stage": "after"
    }
  ]
};
async function main(){const id='cmtrehjb0001axufjmbpsajam';await prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${id},0))`;const s=await tx.studySession.findUniqueOrThrow({where:{id},include:{formDef:{include:{_count:{select:{submissions:true}}}}}});if(s.studyId!=='study-zero'||s.weekNo!==2)throw Error('Wrong session');const reason=formLockedReason(s.status,s.formDef?._count.submissions??0,s.activityStatus);if(reason)throw Error(reason);if(s.formDef){console.log('Existing form preserved; no changes');return;}await tx.formDef.create({data:{sessionId:id,topicMd:week2Activity.topicMd,fields:{create:week2Activity.fields.map((f,i)=>({...f,order:i+1}))}}});console.log('Week 2 activity prepared; remains locked until operator opens it.');});}
if(process.argv.includes('--apply'))main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>prisma.$disconnect());
