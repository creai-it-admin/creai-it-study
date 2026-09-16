import {requireUser} from '@/lib/auth';
import {ActivityError,readActivity,mutateActivity} from '@/lib/activity/service';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
function failure(e:unknown){return Response.json({error:e instanceof ActivityError?e.message:'연결을 확인하고 다시 시도해 주세요.',...(e instanceof ActivityError&&e.version?{version:e.version}:{})},{status:e instanceof ActivityError?e.status:500});}
export async function GET(_:Request,ctx:Context){const user=await requireUser();if(!user)return Response.json({error:'로그인이 필요합니다.'},{status:401});try{return Response.json(await readActivity((await ctx.params).id,user))}catch(e){return failure(e)}}
export async function POST(req:Request,ctx:Context){const user=await requireUser();if(!user)return Response.json({error:'로그인이 필요합니다.'},{status:401});try{return Response.json(await mutateActivity((await ctx.params).id,user,await req.json().catch(()=>null)))}catch(e){return failure(e)}}
