import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
async function main(){
 const {readFile}=await import('node:fs/promises');
 const {prisma}=await import('../lib/prisma');
 const {storageClient,mediaBucket,validateHtml}=await import('../lib/storage');
 const {libraryPath,publishLibraryVersion}=await import('../lib/library');
 const assetId='211cc024-1c22-4e1d-9c55-a9bd55f662a1',versionId='72c9bb61-3c03-4639-bc21-85170084fbdf';
 try{
  const previous=await prisma.libraryVersion.findUnique({where:{id:versionId}});
  if(!previous){
   const html=await readFile('docs/education/ot/index.html','utf8');validateHtml(html);
   const path=libraryPath(assetId,versionId);
   const {data:exists}=await storageClient().storage.from(mediaBucket()).info(path);
   if(!exists){const {error}=await storageClient().storage.from(mediaBucket()).upload(path,Buffer.from(html),{contentType:'text/html',upsert:false});if(error)throw Error('OT upload failed');}
   await publishLibraryVersion({assetId,versionId,title:'Foundation OT',weekNo:0,note:'공통 OT v2 · 8장 · 3–4주차 개인 프로젝트와 튜터링 반영 · 교육 방향, 커리큘럼, After Study 커뮤니티'});
  }
  console.log(`Registered: /routes/admin/library/${assetId}`);
 }finally{await prisma.$disconnect();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
