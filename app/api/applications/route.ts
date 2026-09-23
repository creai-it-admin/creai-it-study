import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { consumeAttempt } from '@/lib/auth-rate-limit';
import { ApplicationInputError, parseApplication } from '@/lib/education-applications';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin || !request.headers.get('content-type')?.startsWith('application/json')) {
    return Response.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 });
  }
  try {
    const body = await request.text();
    if (body.length > 4096) return Response.json({ error: '입력 내용이 너무 깁니다.' }, { status: 413 });
    let input;
    try { input = JSON.parse(body); } catch { return Response.json({ error: '입력 내용을 확인해 주세요.' }, { status: 400 }); }
    const data = parseApplication(input);
    if (!await consumeAttempt(`education-application:${data.phone}`, 5)) return Response.json({ error: '신청 요청이 많습니다. 15분 후 다시 시도해 주세요.' }, { status: 429 });
    try { await prisma.educationApplication.create({ data }); }
    catch (error) {
      // A retry after a lost response must not create another application.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ApplicationInputError) return Response.json({ error: error.message, field: error.field }, { status: 400 });
    return Response.json({ error: '신청을 저장하지 못했습니다. 입력 내용은 유지되어 있으니 잠시 후 다시 시도해 주세요.' }, { status: 503 });
  }
}
