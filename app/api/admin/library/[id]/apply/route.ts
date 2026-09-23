import {requireAdmin} from '@/lib/auth';
import {applyLibraryVersion} from '@/lib/library';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!await requireAdmin())return Response.json({error:'forbidden'},{status:403});
 const {id}=await params,b=await req.json().catch(()=>null);
 if(!b||typeof b.studyId!=='string'||!b.studyId||!(b.expectedOtPath===null||typeof b.expectedOtPath==='string'))return Response.json({error:'적용할 스터디를 선택해 주세요.'},{status:400});
 try{return Response.json(await applyLibraryVersion(id,b.studyId,b.expectedOtPath));}catch(e){return Response.json({error:e instanceof Error&&!('code' in e)?e.message:'자료를 적용하지 못했습니다.'},{status:409});}
}
