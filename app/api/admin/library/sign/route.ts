import {requireAdmin} from '@/lib/auth';
import {createPrivateUpload,MAX_DECK_BYTES} from '@/lib/storage';
import {isUuid,libraryPath} from '@/lib/library';
export async function POST(req:Request){
 if(!await requireAdmin())return Response.json({error:'forbidden'},{status:403});
 const b=await req.json().catch(()=>null);
 if(!b||!isUuid(b.assetId)||!isUuid(b.versionId)||typeof b.name!=='string'||! /\.html?$/i.test(b.name)||!Number.isInteger(b.size)||b.size<=0||b.size>MAX_DECK_BYTES)return Response.json({error:'20MB 이하의 단일 HTML 파일을 선택해 주세요.'},{status:400});
 try{return Response.json(await createPrivateUpload(libraryPath(b.assetId,b.versionId)));}catch{return Response.json({error:'업로드를 시작하지 못했습니다.'},{status:503});}
}
