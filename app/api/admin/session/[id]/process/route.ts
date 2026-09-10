import {requireAdmin} from '@/lib/auth';
import {enqueueRecording} from '@/lib/recording-processing';
import {SessionError} from '@/lib/session-control';
export const maxDuration=180;
export async function POST(_req:Request,ctx:{params:Promise<{id:string}>}){
 if(!await requireAdmin())return Response.json({error:'forbidden'},{status:403});
 try{return Response.json(await enqueueRecording((await ctx.params).id));}
 catch(error){return Response.json({error:error instanceof SessionError?error.message:'전사·리포트을 처리하지 못했습니다.'},{status:error instanceof SessionError?error.status:500});}
}
