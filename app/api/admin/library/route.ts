import {requireAdmin} from '@/lib/auth';
import {parseLibraryInput,publishLibraryVersion} from '@/lib/library';
export async function POST(req:Request){
 if(!await requireAdmin())return Response.json({error:'forbidden'},{status:403});
 try{const version=await publishLibraryVersion(parseLibraryInput(await req.json()));return Response.json({id:version.assetId,versionId:version.id});}
 catch(e){return Response.json({error:e instanceof Error&&!('code' in e)?e.message:'자료를 저장하지 못했습니다. 다시 시도해 주세요.'},{status:400});}
}
