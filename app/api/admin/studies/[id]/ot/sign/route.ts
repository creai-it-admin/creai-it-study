// FR-201. 브라우저가 Supabase로 바로 올릴 수 있게 일회용 주소를 발급한다.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createOtUploadUrl, MAX_DECK_BYTES } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const { size, name } = ((await req.json().catch(() => null)) ?? {}) as { size?: number; name?: string };

  if (typeof name !== "string" || !/\.html?$/i.test(name)) {
    return NextResponse.json({ error: "HTML 파일만 올릴 수 있습니다" }, { status: 400 });
  }
  // FR-202. 상한을 넘으면 주소를 아예 안 준다.
  if (!Number.isInteger(size) || !size || size < 0 || size > MAX_DECK_BYTES) {
    return NextResponse.json({ error: "20MB를 넘는 파일은 올릴 수 없습니다" }, { status: 400 });
  }

  if (!await prisma.study.findUnique({where:{id}})) return NextResponse.json({error:"not found"},{status:404});
  try {
    return NextResponse.json(await createOtUploadUrl(id));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
