// 참가자 화면이 3초마다 부른다. FR-303, FR-304, FR-601.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLiveState } from "@/lib/session-state";
import { isOnRoster } from "@/lib/roster";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const state = await getLiveState();

  // FR-601. 그 회차에 처음 화면을 열면 first_seen_at을 기록하고 present로 둔다.
  // 명단 밖 계정은 안 찍는다. 운영진이 장표를 보러 들어와도 출석이 오염되면 안 된다.
  if (state.sessionId && isOnRoster(session.user.email)) {
    await prisma.attendance.upsert({
      where: { sessionId_userId: { sessionId: state.sessionId, userId: session.user.id } },
      create: {
        sessionId: state.sessionId,
        userId: session.user.id,
        state: "present",
        firstSeenAt: new Date(),
      },
      update: {},
    });
  }

  return NextResponse.json(state);
}
