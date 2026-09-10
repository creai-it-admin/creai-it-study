import {sessionAccessWhere} from '@/lib/study-access';
import {requireUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {playbackUrl} from '@/lib/storage';
export async function GET(_req:Request,ctx:{params:Promise<{id:string;partId:string}>}){
 const user=await requireUser();if(!user)return new Response('unauthorized',{status:401});
 const {id,partId}=await ctx.params;
 const part=await prisma.recordingPart.findFirst({where:{id:partId,sessionId:id,session:sessionAccessWhere(user),uploadedAt:{not:null}}});
 if(!part)return new Response('not found',{status:404});
 return Response.redirect(await playbackUrl(part.path),307);
}
