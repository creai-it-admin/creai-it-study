import { AccountError, register, completePasswordSetup } from '@/lib/password-auth';

export async function POST(request: Request) {
  const origin = new URL(process.env.NEXTAUTH_URL || request.url).origin;
  if (request.headers.get('origin') !== origin || !request.headers.get('content-type')?.startsWith('application/json')) {
    return Response.json({error:'허용되지 않은 요청입니다.'},{status:403});
  }
  let data;
  try {
    const body = await request.text();
    if (body.length > 8192) return Response.json({error:'입력 내용이 너무 깁니다.'},{status:413});
    data = JSON.parse(body);
  } catch {
    return Response.json({error:'입력 내용을 확인해 주세요.'},{status:400});
  }
  try {
    if (data?.action === 'register') await register(data);
    else if (data?.action === 'setup') await completePasswordSetup(data);
    else return Response.json({error:'잘못된 요청입니다.'},{status:400});
    return Response.json({ok:true},{status:data.action === 'register' ? 201 : 200});
  } catch(error) {
    if (error instanceof AccountError) return Response.json({error:error.message},{status:error.status});
    return Response.json({error:'요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.'},{status:503});
  }
}
