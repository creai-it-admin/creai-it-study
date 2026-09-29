import {requireAdmin} from '@/lib/auth';
import {ActivityError} from '@/lib/activity/service';
import {prepareCommentary,readCommentary} from '@/lib/practice/commentary';
export const dynamic='force-dynamic';
export const maxDuration=300;
type Context={params:Promise<{id:string}>};
function failure(e:unknown){return Response.json({error:e instanceof ActivityError?e.message:'연결을 확인하고 다시 시도해 주세요.'},{status:e instanceof ActivityError?e.status:500});}
export async function GET(_:Request,ctx:Context){
 if(!await requireAdmin())return Response.json({error:'운영진만 볼 수 있습니다.'},{status:403});
 try{return Response.json(await readCommentary((await ctx.params).id))}catch(e){return failure(e)}
}
export async function POST(_:Request,ctx:Context){
 if(!await requireAdmin())return Response.json({error:'운영진만 해설을 준비할 수 있습니다.'},{status:403});
 try{const id=(await ctx.params).id;return Response.json(await readCommentary(id,await prepareCommentary(id)))}catch(e){return failure(e)}
}
