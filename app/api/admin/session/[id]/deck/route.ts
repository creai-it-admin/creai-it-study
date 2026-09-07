// FR-201. 브라우저가 올리기를 끝내면 경로만 받아 deck_url에 기록한다.
// 파일 본체는 서버를 안 거친다. Vercel 요청 본문 상한을 피하기 위해서다.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmDeck } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const { path } = (await req.json()) as { path?: string };

  if (!path || !path.startsWith(`${id}/`)) {
    return NextResponse.json({ error: "잘못된 경로입니다" }, { status: 400 });
  }

  try {
    const url = await confirmDeck(path);
    await prisma.studySession.update({ where: { id }, data: { deckUrl: url } });
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
