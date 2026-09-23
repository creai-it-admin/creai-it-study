import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
async function main(){
 const {readFile}=await import('node:fs/promises');
 const {prisma}=await import('../lib/prisma');
 const {storageClient,mediaBucket,validateHtml}=await import('../lib/storage');
 const {libraryPath,publishLibraryVersion}=await import('../lib/library');
 const assetId='e7c6380b-4307-428b-878f-43da7b1cf7a3',versionId='95378356-6a02-4e7a-bf4c-5c93ad42981d';
 try{
  const previous=await prisma.libraryVersion.findUnique({where:{id:versionId}});
  if(!previous){
   const html=await readFile('docs/education/week4/index.html','utf8');validateHtml(html);
   const path=libraryPath(assetId,versionId);
   const {data:exists}=await storageClient().storage.from(mediaBucket()).info(path);
   if(!exists){const {error}=await storageClient().storage.from(mediaBucket()).upload(path,Buffer.from(html),{contentType:'text/html',upsert:false});if(error)throw Error('Week 4 upload failed');}
   await publishLibraryVersion({assetId,versionId,title:'Foundation 4주차 · AI 산업을 이해하기',weekNo:4,note:'커버 추가 v3 · 31장 · AI 시대를 관통하는 개념과 산업의 본질 · 핵심 개념에서 밸류체인·협상력으로 이어지는 교육'});
  }
  console.log(`Registered: /routes/admin/library/${assetId}`);
 }finally{await prisma.$disconnect();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
