import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
async function main(){
 const {readFile}=await import('node:fs/promises');
 const {prisma}=await import('../lib/prisma');
 const {storageClient,mediaBucket,validateHtml}=await import('../lib/storage');
 const {libraryPath,publishLibraryVersion}=await import('../lib/library');
 const assetId='19000c3e-1c0e-4c9c-9404-a4f39192068b',versionId='3ac59725-defe-41f1-be8a-153ff1ed7b6e';
 try{
  const previous=await prisma.libraryVersion.findUnique({where:{id:versionId}});
  if(!previous){
   const html=await readFile('docs/education/week3/index.html','utf8');validateHtml(html);
   const path=libraryPath(assetId,versionId);
   const {data:exists}=await storageClient().storage.from(mediaBucket()).info(path);
   if(!exists){const {error}=await storageClient().storage.from(mediaBucket()).upload(path,Buffer.from(html),{contentType:'text/html',upsert:false});if(error)throw Error('Week 3 upload failed');}
   await publishLibraryVersion({assetId,versionId,title:'Foundation 3주차 · AI와 함께 일하기 #3',weekNo:3,note:'강의안 초안 v1 · 17장 · 상방·하방의 발전, 담대한 위임, 실패에서 배우기와 스킬 축적 · AS-IS/TO-BE 토론 및 발표 노트 포함'});
  }
  console.log(`Registered: /routes/admin/library/${assetId}`);
 }finally{await prisma.$disconnect();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
