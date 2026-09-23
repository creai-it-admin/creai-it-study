import {randomUUID} from 'node:crypto';
import {prisma} from './prisma';
import {confirmDeck,downloadMedia,mediaBucket,storageClient,validDeckPath} from './storage';
export const librarySlot=(weekNo:number)=>weekNo===0?'OT':`${weekNo}주차`;
export const isUuid=(id:unknown):id is string=>typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
export const libraryPath=(assetId:string,versionId:string)=>`library/${assetId}/decks/${versionId}.html`;
export function parseLibraryInput(value:unknown){
 const b=value as Record<string,unknown>|null;
 if(!b||!isUuid(b.assetId)||!isUuid(b.versionId)||typeof b.title!=='string'||!b.title.trim()||b.title.trim().length>100||!Number.isInteger(b.weekNo)||Number(b.weekNo)<0||Number(b.weekNo)>4||typeof b.note!=='string'||b.note.length>500)throw Error('제목·자료 구분·버전 설명을 확인해 주세요.');
 return {assetId:b.assetId,versionId:b.versionId,title:b.title.trim(),weekNo:Number(b.weekNo),note:b.note.trim()};
}
export async function publishLibraryVersion(input:ReturnType<typeof parseLibraryInput>){
 const path=libraryPath(input.assetId,input.versionId);
 await confirmDeck(path);
 return prisma.$transaction(async tx=>{
  // Serializes initial creation and version allocation, including request retries.
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${input.assetId}, 0))`;
  const previous=await tx.libraryVersion.findUnique({where:{id:input.versionId}});
  if(previous){if(previous.assetId!==input.assetId)throw Error('다른 자료의 버전입니다.');return previous;}
  const asset=await tx.libraryAsset.upsert({where:{id:input.assetId},create:{id:input.assetId,title:input.title,weekNo:input.weekNo},update:{}});
  if(asset.weekNo!==input.weekNo)throw Error('기존 자료의 주차 구분은 변경할 수 없습니다.');
  const updated=await tx.libraryAsset.update({where:{id:asset.id},data:{versionCount:{increment:1}}});
  return tx.libraryVersion.create({data:{id:input.versionId,assetId:asset.id,number:updated.versionCount,path,note:input.note}});
 });
}
export async function applyLibraryVersion(versionId:string,studyId:string,expectedOtPath:string|null){
 const version=await prisma.libraryVersion.findUnique({where:{id:versionId},include:{asset:true}});
 if(!version||!validDeckPath(version.path,`library/${version.assetId}`))throw Error('자료 버전을 찾을 수 없습니다.');
 const study=await prisma.study.findUnique({where:{id:studyId},include:{sessions:{where:{weekNo:version.asset.weekNo}}}});
 if(!study)throw Error('스터디를 찾을 수 없습니다.');
 const session=study.sessions[0];
 if(version.asset.weekNo!==0&&(!session||session.status!=='scheduled'))throw Error('해당 주차가 준비 중인 스터디에만 추가할 수 있습니다.');
 const scope=version.asset.weekNo===0?`studies/${studyId}/orientation`:session.id;
 const path=`${scope}/decks/${randomUUID()}.html`;
 const blob=await downloadMedia(version.path);
 const {error}=await storageClient().storage.from(mediaBucket()).upload(path,Buffer.from(await blob.arrayBuffer()),{contentType:'text/html',upsert:false});
 if(error)throw Error('기수에 자료를 복사하지 못했습니다. 다시 시도해 주세요.');
 let used=false,committed=false;
 try{
  const result=await prisma.$transaction(async tx=>{
   await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${studyId}, 0))`;
   if(version.asset.weekNo===0){
    const current=await tx.study.findUniqueOrThrow({where:{id:studyId}});
    if(current.otSourceVersionId===versionId)return {url:`/routes/studies/${studyId}/ot`};
    const result=await tx.study.updateMany({where:{id:studyId,otPath:expectedOtPath},data:{otPath:path,otSourceVersionId:versionId}});
    if(!result.count)throw Error('OT 자료가 변경되었습니다. 새로고침 후 다시 선택해 주세요.');
    used=true;return {url:`/routes/studies/${studyId}/ot`};
   }
   // Lock the target row so starting a session cannot race an attachment.
   await tx.$queryRaw`SELECT id FROM "StudySession" WHERE id=${session.id} FOR UPDATE`;
   const current=await tx.studySession.findUniqueOrThrow({where:{id:session.id}});
   if(current.status!=='scheduled')throw Error('진행 중이거나 종료된 회차에는 추가할 수 없습니다.');
   const existing=await tx.sessionMaterial.findFirst({where:{sessionId:session.id,sourceVersionId:versionId}});
   if(existing)return {url:`/routes/deck?session=${session.id}&material=${existing.id}`};
   const material=await tx.sessionMaterial.create({data:{sessionId:session.id,kind:'education',title:version.asset.title,path,sourceVersionId:versionId}});
   used=true;return {url:`/routes/deck?session=${session.id}&material=${material.id}`};
  });
  committed=true;return result;
 }finally{if(!used||!committed)await storageClient().storage.from(mediaBucket()).remove([path]);}
}
