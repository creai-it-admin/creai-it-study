import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
async function main(){
 const {readFile}=await import('node:fs/promises');
 const {prisma}=await import('../lib/prisma');
 const {storageClient,mediaBucket,validateHtml}=await import('../lib/storage');
 const {libraryPath,publishLibraryVersion}=await import('../lib/library');
 const assetId='e7c6380b-4307-428b-878f-43da7b1cf7a3',versionId='8cdb2db8-d8d8-4b57-8f4a-5db1089605b6';
 try{
  const previous=await prisma.libraryVersion.findUnique({where:{id:versionId}});
  if(!previous){
   const html=await readFile('docs/education/week4/index.html','utf8');validateHtml(html);
   const path=libraryPath(assetId,versionId);
   const {data:exists}=await storageClient().storage.from(mediaBucket()).info(path);
   if(!exists){const {error}=await storageClient().storage.from(mediaBucket()).upload(path,Buffer.from(html),{contentType:'text/html',upsert:false});if(error)throw Error('Week 4 upload failed');}
   await publishLibraryVersion({assetId,versionId,title:'Foundation 4주차 · AI 산업을 이해하기',weekNo:4,note:'개념 설명 개정 v2 · 30장 · 핵심 개념 15개를 정의·본질적 의미·멘탈모델로 설명 · 밸류체인·협상력 연결 · 공식 출처 및 발표 노트 포함'});
  }
  console.log(`Registered: /routes/admin/library/${assetId}`);
 }finally{await prisma.$disconnect();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
