import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
async function main(){
 const {readFile}=await import('node:fs/promises');
 const {prisma}=await import('../lib/prisma');
 const {storageClient,mediaBucket,validateHtml}=await import('../lib/storage');
 const {libraryPath,publishLibraryVersion}=await import('../lib/library');
 const assetId='19000c3e-1c0e-4c9c-9404-a4f39192068b',versionId='a840956b-89d8-4dfa-a703-43c077bfae7f';
 try{
  const previous=await prisma.libraryVersion.findUnique({where:{id:versionId}});
  if(!previous){
   const html=await readFile('docs/education/week3/index.html','utf8');validateHtml(html);
   const path=libraryPath(assetId,versionId);
   const {data:exists}=await storageClient().storage.from(mediaBucket()).info(path);
   if(!exists){const {error}=await storageClient().storage.from(mediaBucket()).upload(path,Buffer.from(html),{contentType:'text/html',upsert:false});if(error)throw Error('Week 3 upload failed');}
   await publishLibraryVersion({assetId,versionId,title:'Foundation 3주차 · AI와 함께 일하기 #3',weekNo:3,note:'강의안 v2 · 18장 · 2–3장 사이에 모델 발전과 사용자의 과업 난도를 비교하는 그래프 추가'});
  }
  console.log(`Registered: /routes/admin/library/${assetId}`);
 }finally{await prisma.$disconnect();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
