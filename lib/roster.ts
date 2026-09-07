// 그 기수의 참가자 명단. 결석 처리와 "몇 명 중 몇 명"을 세는 기준이다.
// 퍼블릭 레포라 이메일을 코드에 박지 않고 환경 변수로 받는다.
import { prisma } from "@/lib/prisma";

export type RosterEntry = {
  email: string;
  user: { id: string; name: string | null; email: string } | null;
};

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

export function isOnRoster(email?: string | null): boolean {
  const list = rosterEmails();
  if (list.length === 0) return true; // 명단이 없으면 아무도 걸러내지 않는다
  return !!email && list.includes(email.toLowerCase());
}

/**
 * 명단을 계정과 짝지어 돌려준다.
 * 아직 한 번도 로그인 안 한 사람은 user가 null이다. 그 사람도 줄은 나와야
 * 진행자가 "누가 아직 안 왔나"를 볼 수 있다.
 */
export async function rosterEntries(): Promise<RosterEntry[]> {
  const emails = rosterEmails();

  if (emails.length === 0) {
    const users = await prisma.user.findMany({
      where: { roles: { has: "participant" } },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    });
    return users.map((u) => ({ email: u.email, user: u }));
  }

  const users = await prisma.user.findMany({
    where: { email: { in: emails, mode: "insensitive" } },
    select: { id: true, name: true, email: true },
  });
  const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
  return emails.map((e) => ({ email: e, user: byEmail.get(e) ?? null }));
}

/** 결석 행을 만들 수 있는 사람. 계정이 있어야 한다. */
export async function rosterUsersWithAccount() {
  const entries = await rosterEntries();
  return entries.flatMap((e) => (e.user ? [e.user] : []));
}
