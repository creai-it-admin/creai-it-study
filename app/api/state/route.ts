// 참가자 화면이 3초마다 부른다. FR-303, FR-304, FR-601.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLiveState } from "@/lib/session-state";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const state = await getLiveState();

  // FR-601. 그 회차에 처음 로그인하면 first_seen_at을 기록하고 present로 둔다.
  if (state.sessionId) {
    await prisma.attendance.upsert({
      where: { sessionId_userId: { sessionId: state.sessionId, userId: session.user.id } },
      create: { sessionId: state.sessionId, userId: session.user.id, state: "present" },
      update: {},
    });
  }

  return NextResponse.json(state);
}
