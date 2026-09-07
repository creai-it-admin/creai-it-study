// FR-201, FR-202. PDF를 올리면 저장소에 넣고 deck_url에 기록한다. 10MB를 넘으면 거부한다.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_DECK_BYTES, uploadDeck } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDF 파일이 없습니다" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "PDF만 올릴 수 있습니다" }, { status: 400 });
  }
  if (file.size > MAX_DECK_BYTES) {
    return NextResponse.json({ error: "10MB를 넘는 파일은 올릴 수 없습니다" }, { status: 400 });
  }

  try {
    const url = await uploadDeck(id, file);
    await prisma.studySession.update({ where: { id }, data: { deckUrl: url } });
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
