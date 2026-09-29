import {requireUser} from '@/lib/auth';
import {ActivityError} from '@/lib/activity/service';
import {listEvents,practiceTurn} from '@/lib/practice/agent';
export const dynamic='force-dynamic';
export const maxDuration=300;
type Context={params:Promise<{id:string}>};
function failure(e:unknown){return Response.json({error:e instanceof ActivityError?e.message:'연결을 확인하고 다시 시도해 주세요.'},{status:e instanceof ActivityError?e.status:500});}
export async function GET(req:Request,ctx:Context){
 const user=await requireUser();if(!user)return Response.json({error:'로그인이 필요합니다.'},{status:401});
 try{return Response.json(await listEvents((await ctx.params).id,user,new URL(req.url).searchParams.get('user')??user.id))}catch(e){return failure(e)}
}
export async function POST(req:Request,ctx:Context){
 const user=await requireUser();if(!user)return Response.json({error:'로그인이 필요합니다.'},{status:401});
 try{return new Response(await practiceTurn((await ctx.params).id,user,await req.json().catch(()=>null)),{headers:{'content-type':'application/x-ndjson; charset=utf-8','cache-control':'no-store'}})}catch(e){return failure(e)}
}
