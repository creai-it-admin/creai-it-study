// 회차 다섯 줄. 리허설과 4회차. 1주차 폼은 시드로 들어간다.
// 퍼블릭 레포라 참가자 계정은 넣지 않는다.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SESSIONS = [
  { weekNo: 0, date: "2026-09-11" },
  { weekNo: 1, date: "2026-09-12" },
  { weekNo: 2, date: "2026-09-19" },
  { weekNo: 3, date: "2026-10-03" },
  { weekNo: 4, date: "2026-10-10" },
];

const WEEK1_TOPIC =
  "내 일에서 AI에게 맡기는 작업 하나를 골라, 어디까지 맡기고 어디를 내가 직접 보는지 선을 그어 보고 공유하기";

const WEEK1_FIELDS = [
  "고른 작업이 무엇인지",
  "AI에게 무엇을 맡길 것인지",
  "어떤 판단은 내가 직접 할 것인지",
  "어디에서 개입할 것인지",
  "무엇으로 의도 정렬을 확인할 것인지",
  "선을 어디에 그어야 할지 모르겠는 지점 하나",
];

const SEGMENTS = [
  { kind: "part1" as const, plannedMin: 40 },
  { kind: "part2" as const, plannedMin: 40 },
  { kind: "break_" as const, plannedMin: 10 },
  { kind: "part3" as const, plannedMin: 30 },
];

async function main() {
  for (const s of SESSIONS) {
    const existing = await prisma.studySession.findFirst({ where: { weekNo: s.weekNo } });
    const session =
      existing ??
      (await prisma.studySession.create({ data: { weekNo: s.weekNo, date: new Date(s.date) } }));

    for (const seg of SEGMENTS) {
      await prisma.segment.upsert({
        where: { sessionId_kind: { sessionId: session.id, kind: seg.kind } },
        create: { sessionId: session.id, kind: seg.kind, plannedMin: seg.plannedMin },
        update: { plannedMin: seg.plannedMin },
      });
    }

    // 1주차와 리허설에만 폼을 넣는다. 나머지 회차 폼은 비어 있다.
    if (s.weekNo === 1 || s.weekNo === 0) {
      // 재실행해도 운영진이 편집한 주제·질문과 답변 관계를 덮어쓰지 않는다.
      const existingForm = await prisma.formDef.findUnique({ where: { sessionId: session.id } });
      if (!existingForm) {
        await prisma.formDef.create({ data: {
          sessionId: session.id, topicMd: WEEK1_TOPIC,
          fields: { create: WEEK1_FIELDS.map((question, index) => ({ order: index + 1, question })) },
        } });
      }
    }
  }
  console.log("시드 완료");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
