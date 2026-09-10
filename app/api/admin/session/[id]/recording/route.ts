import {requireAdmin} from '@/lib/auth';
import {reserveRecordingPart,confirmRecordingPart} from '@/lib/recording-parts';
import {SessionError} from '@/lib/session-control';
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){
 const user=await requireAdmin();if(!user)return Response.json({error:'forbidden'},{status:403});
 const body=await req.json().catch(()=>null);if(!body)return Response.json({error:'잘못된 요청입니다.'},{status:400});
 try{
  const {id}=await ctx.params;
  if(body.action==='reserve')return Response.json(await reserveRecordingPart(id,user.id,body));
  if(body.action==='confirm'){await confirmRecordingPart(id,user.id,body);return Response.json({ok:true});}
  return Response.json({error:'잘못된 요청입니다.'},{status:400});
 }catch(error){return Response.json({error:error instanceof SessionError?error.message:'녹음을 저장하지 못했습니다. 다시 시도해 주세요.'},{status:error instanceof SessionError?error.status:502});}
}
