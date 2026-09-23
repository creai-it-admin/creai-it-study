import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
async function main(){
 const {readFile}=await import('node:fs/promises');
 const {prisma}=await import('../lib/prisma');
 const {storageClient,mediaBucket,validateHtml}=await import('../lib/storage');
 const {libraryPath,publishLibraryVersion}=await import('../lib/library');
 const assetId='a311f5f7-7198-44ff-af70-5eeeaa32d7e3',versionId='bc6effa9-f4ad-466d-b36b-f60f7b5e9f4c';
 try{
  const previous=await prisma.libraryVersion.findUnique({where:{id:versionId}});
  if(!previous){
   const html=await readFile('docs/education/week2/index.html','utf8');validateHtml(html);
   const path=libraryPath(assetId,versionId);
   const {data:exists}=await storageClient().storage.from(mediaBucket()).info(path);
   if(!exists){const {error}=await storageClient().storage.from(mediaBucket()).upload(path,Buffer.from(html),{contentType:'text/html',upsert:false});if(error)throw Error('Week 2 upload failed');}
   await publishLibraryVersion({assetId,versionId,title:'Foundation 2주차 · AI와 함께 일하기 #2',weekNo:2,note:'강의안 초안 v1 · 16장 · PRD, 운영 규칙, 실행·검증·수정 루프 · 참가 신청 업무 예시 및 발표 노트 포함'});
  }
  console.log(`Registered: /routes/admin/library/${assetId}`);
 }finally{await prisma.$disconnect();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
