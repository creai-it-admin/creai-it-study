import {requireAdmin} from '@/lib/auth';
import {controlSession,SessionError} from '@/lib/session-control';
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){
 const user=await requireAdmin();if(!user)return Response.json({error:'forbidden'},{status:403});
 const body=await req.json().catch(()=>null);
 if(!body||typeof body.action!=='string')return Response.json({error:'잘못된 요청입니다.'},{status:400});
 try{await controlSession((await ctx.params).id,body,user.id);return Response.json({ok:true});}
 catch(error){return Response.json({error:error instanceof SessionError?error.message:'세션 상태를 변경하지 못했습니다.'},{status:error instanceof SessionError?error.status:500});}
}
