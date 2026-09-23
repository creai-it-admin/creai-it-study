import {prisma} from '../lib/prisma';
import {formLockedReason} from '../lib/form-editor';
export const week2Activity={
  "topicMd": "논의 주제: 나의 AI 활용 AS-IS(현재 방식)와 TO-BE(앞으로 바꿔볼 방식)\n\n① 각자 5분: 실제로 AI에게 맡겨본 일과 현재 방식, 바꿔보고 싶은 방식을 생각합니다.\n② 2인 1조로 5분: 서로의 AS-IS와 TO-BE를 이야기하고, 팀별로 공유할 사례 하나를 고릅니다.\n③ 팀당 2분: 선택한 사례의 현재 방식과 앞으로 바꿔볼 방식을 함께 공유합니다.\n④ 전체 토론 9–14분: 다른 팀의 이야기를 듣고, 무엇을 더 맡기고 어디에 개입할지 함께 논의합니다.\n6명·3팀 기준 총 25–30분입니다.\n\n공유 전 세 질문은 개인 정리와 짝 대화의 메모로 사용합니다. 사례·첫 결과 칸에는 실제 요청·결과 일부 또는 사례 요약을 남겨주세요. 토론 후에는 자신의 TO-BE와 확인 기준을 정리하고, 마무리 기록 칸에는 토론 메모를 남깁니다. 새 작업 수행이나 결과물 제작은 필요하지 않습니다.\nAI를 맡겨본 경험이 없다면 현재 AI를 쓰지 않는 일과 그 이유를 이야기해도 됩니다. 공유 자료의 민감한 정보는 가려주세요.",
  "fields": [
    {
      "question": "AS-IS: 지금 어떤 일에 AI를 쓰고 있나요? 실제로 맡겨본 사례 하나를 적어 주세요.",
      "stage": "before"
    },
    {
      "question": "AS-IS: 그 일에서 AI가 한 일과 내가 직접 한 일은 무엇인가요? 잘된 점과 아쉬운 점도 적어 주세요.",
      "stage": "before"
    },
    {
      "question": "TO-BE 초안: 앞으로 무엇을 더 맡기고, 나는 어디에 개입하는 방식으로 바꿔보고 싶나요?",
      "stage": "before"
    },
    {
      "question": "짝 대화와 전체 토론 후 나의 TO-BE를 정리해 주세요. 다음에 어떤 방식을 시도하고, 더 나아졌는지 무엇으로 확인할까요?",
      "stage": "after"
    }
  ]
};
async function main(){const id='cmtrehjb0001axufjmbpsajam';await prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${id},0))`;const s=await tx.studySession.findUniqueOrThrow({where:{id},include:{formDef:{include:{_count:{select:{submissions:true}}}}}});if(s.studyId!=='study-zero'||s.weekNo!==2)throw Error('Wrong session');const reason=formLockedReason(s.status,s.formDef?._count.submissions??0,s.activityStatus);if(reason)throw Error(reason);if(s.formDef){console.log('Existing form preserved; no changes');return;}await tx.formDef.create({data:{sessionId:id,topicMd:week2Activity.topicMd,fields:{create:week2Activity.fields.map((f,i)=>({...f,order:i+1}))}}});console.log('Week 2 activity prepared; remains locked until operator opens it.');});}
if(process.argv.includes('--apply'))main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>prisma.$disconnect());
