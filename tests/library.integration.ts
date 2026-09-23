// Explicit opt-in: uses only namespaced, temporary rows and removes its uploads.
import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {encode} from 'next-auth/jwt';
import {prisma} from '../lib/prisma';
import {hashPassword} from '../lib/passwords';
import {libraryPath} from '../lib/library';
import {storageClient,mediaBucket,downloadMedia} from '../lib/storage';
if(process.env.RUN_LIBRARY_QA!=='1')throw Error('Set RUN_LIBRARY_QA=1 to run disposable library integration checks.');
const base='http://localhost:3010';
test('library authorization, append-only versions, snapshot isolation and session attachment',async()=>{
 const prefix=`qa-library-${randomUUID()}`,assetId=randomUUID(),weekAssetId=randomUUID(),studyId=prefix;
 const paths=new Set<string>();const users:string[]=[];
 const bucket=storageClient().storage.from(mediaBucket());
 async function cookie(role:'admin'|'participant'){
  const u=await prisma.user.create({data:{email:`${prefix}-${role}@example.test`,passwordHash:await hashPassword(randomUUID()),roles:[role],consentedAt:new Date()}});users.push(u.id);
  const token=await encode({secret:process.env.NEXTAUTH_SECRET!,salt:'authjs.session-token',token:{uid:u.id,authVersion:0,authMethod:'password',roles:[role],consented:true},maxAge:3600});
  return `authjs.session-token=${token}`;
 }
 async function call(path:string,cookie:string,body?:unknown){return fetch(base+path,{method:body===undefined?'GET':'POST',redirect:'manual',headers:{cookie,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});}
 try{
  const admin=await cookie('admin'),member=await cookie('participant');
  const study=await prisma.study.create({data:{id:studyId,name:prefix,sessions:{create:{weekNo:1,date:new Date()}}},include:{sessions:true}});
  async function upload(a:string,weekNo:number,label:string){
   const id=randomUUID(),html=`<!doctype html><html><body><h1>${label}</h1></body></html>`;
   const signed=await call('/api/admin/library/sign',admin,{assetId:a,versionId:id,name:'test.html',size:Buffer.byteLength(html)});assert.equal(signed.status,200);const sign=await signed.json();paths.add(sign.path);
   const put=await fetch(sign.signedUrl,{method:'PUT',headers:{'Content-Type':'text/html'},body:html});assert.equal(put.ok,true);
   const body={assetId:a,versionId:id,title:'QA asset',weekNo,note:label};
   const saved=await call('/api/admin/library',admin,body);assert.equal(saved.status,200,await saved.clone().text());
   return {id,html,body};
  }
  await prisma.studyMembership.create({data:{studyId,userId:users[1]}});
  const v1=await upload(assetId,0,'v1');
  assert.equal((await call(`/api/admin/library/${v1.id}/html`,member)).status,403);
  assert.equal((await call('/api/admin/library/sign',member,{})).status,403);
  assert.equal((await call('/api/admin/library',member,v1.body)).status,403);
  assert.equal((await call(`/api/admin/library/${v1.id}/apply`,member,{studyId,expectedOtPath:null})).status,403);
  assert.equal((await call('/api/admin/library/sign','',{})).status,401);
  assert.equal((await call('/api/admin/library/sign',admin,{assetId:'../escape',versionId:v1.id,name:'x.html',size:10})).status,400);
  const preview=await call(`/api/admin/library/${v1.id}/html`,admin);assert.equal(await preview.text(),v1.html);assert.match(preview.headers.get('content-security-policy')!,/sandbox allow-scripts/);
  let applied=await call(`/api/admin/library/${v1.id}/apply`,admin,{studyId,expectedOtPath:null});assert.equal(applied.status,200,await applied.clone().text());
  const snapshot=await prisma.study.findUniqueOrThrow({where:{id:studyId}});paths.add(snapshot.otPath!);assert.equal(await(await downloadMedia(snapshot.otPath!)).text(),v1.html);
  assert.equal(await(await call(`/api/studies/${studyId}/ot`,member)).text(),v1.html);
  const v2=await upload(assetId,0,'v2');
  await Promise.all([call('/api/admin/library',admin,v2.body),call('/api/admin/library',admin,v2.body)]);
  assert.equal(await prisma.libraryVersion.count({where:{assetId}}),2);
  assert.equal((await prisma.libraryAsset.findUniqueOrThrow({where:{id:assetId}})).versionCount,2);
  assert.equal((await prisma.study.findUniqueOrThrow({where:{id:studyId}})).otSourceVersionId,v1.id);
  assert.equal(await(await downloadMedia(snapshot.otPath!)).text(),v1.html);
  applied=await call(`/api/admin/library/${v2.id}/apply`,admin,{studyId,expectedOtPath:null});assert.equal(applied.status,409);
  applied=await call(`/api/admin/library/${v2.id}/apply`,admin,{studyId,expectedOtPath:snapshot.otPath});assert.equal(applied.status,200);
  const updated=await prisma.study.findUniqueOrThrow({where:{id:studyId}});paths.add(updated.otPath!);assert.equal(updated.otSourceVersionId,v2.id);
  assert.equal(await(await downloadMedia(updated.otPath!)).text(),v2.html);
  const week=await upload(weekAssetId,1,'week1');
  for(let i=0;i<2;i++)assert.equal((await call(`/api/admin/library/${week.id}/apply`,admin,{studyId,expectedOtPath:null})).status,200);
  assert.equal(await prisma.sessionMaterial.count({where:{sessionId:study.sessions[0].id}}),1);
  assert.equal(await(await call(`/api/sessions/${study.sessions[0].id}/deck`,member)).text(),week.html);
  await prisma.studySession.update({where:{id:study.sessions[0].id},data:{status:'running'}});
  assert.equal((await call(`/api/admin/library/${week.id}/apply`,admin,{studyId,expectedOtPath:null})).status,409);
  console.log('Verified admin/member boundaries, private HTML, v1→v2 isolation, stale OT protection, retry deduplication and week attachment.');
 }finally{
  const mats=await prisma.sessionMaterial.findMany({where:{session:{studyId}},select:{path:true}});mats.forEach(m=>paths.add(m.path));
  await prisma.studySession.deleteMany({where:{studyId}});await prisma.study.deleteMany({where:{id:studyId}});
  await prisma.libraryVersion.deleteMany({where:{assetId:{in:[assetId,weekAssetId]}}});await prisma.libraryAsset.deleteMany({where:{id:{in:[assetId,weekAssetId]}}});
  await prisma.user.deleteMany({where:{id:{in:users}}});
  if(paths.size)await bucket.remove([...paths]);await prisma.$disconnect();
 }
});
