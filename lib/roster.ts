// 그 기수의 참가자 명단. 결석 처리와 "여섯 명 중 몇 명"을 세는 기준이다.
// 퍼블릭 레포라 이메일을 코드에 박지 않고 환경 변수로 받는다.
import { prisma } from "@/lib/prisma";

export function rosterEmails(): string[] {
  return (process.env.PARTICIPANT_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function rosterSize(): number {
  const n = rosterEmails().length;
  return n > 0 ? n : 6; // 명단을 안 넣었으면 스펙 기본값 6으로 센다
}

/** 명단에 있는 계정만 돌려준다. 명단이 비어 있으면 participant 전원을 돌려준다. */
export async function rosterUsers() {
  const emails = rosterEmails();
  if (emails.length === 0) {
    return prisma.user.findMany({
      where: { roles: { has: "participant" } },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    });
  }
  return prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: "asc" },
  });
}
