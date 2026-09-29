import {after} from 'next/server';
import {requireUser} from '@/lib/auth';
import {ActivityError,readActivity,mutateActivity} from '@/lib/activity/service';
import {summarizeParticipant} from '@/lib/practice/commentary';
export const dynamic='force-dynamic';
export const maxDuration=300;
type Context={params:Promise<{id:string}>};
function failure(e:unknown){return Response.json({error:e instanceof ActivityError?e.message:'연결을 확인하고 다시 시도해 주세요.',...(e instanceof ActivityError&&e.version?{version:e.version}:{})},{status:e instanceof ActivityError?e.status:500});}
export async function GET(_:Request,ctx:Context){const user=await requireUser();if(!user)return Response.json({error:'로그인이 필요합니다.'},{status:401});try{return Response.json(await readActivity((await ctx.params).id,user))}catch(e){return failure(e)}}
export async function POST(req:Request,ctx:Context){
 const user=await requireUser();if(!user)return Response.json({error:'로그인이 필요합니다.'},{status:401});
 try{
  const id=(await ctx.params).id,body=await req.json().catch(()=>null),result=await mutateActivity(id,user,body);
  // Shared and submitted results are what the instructor debriefs, so the summary refreshes then, off the request path.
  if(['share','complete'].includes(String((body as {action?:unknown}|null)?.action)))after(()=>summarizeParticipant(id,user.id).catch(e=>console.error('practice summary refresh failed',e instanceof Error?e.message:e)));
  return Response.json(result);
 }catch(e){return failure(e)}
}
