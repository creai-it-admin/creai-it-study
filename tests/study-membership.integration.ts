import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {prisma} from '../lib/prisma';
import {studyAccessWhere,sessionAccessWhere} from '../lib/study-access';
if(process.env.DATABASE_URL!=='postgresql://study_local@127.0.0.1:55439/study_test')throw Error('Isolated DB required');
after(()=>prisma.$disconnect());
test('membership scopes study and session access; removal takes effect without re-login',async()=>{
 const user=await prisma.user.create({data:{email:`membership-${crypto.randomUUID()}@test.invalid`}});
 const studies:{id:string}[]=[];
 try{
  for(const name of ['Member study','Another study'])studies.push(await prisma.study.create({data:{name,sessions:{create:[{weekNo:0,date:new Date()},{weekNo:1,date:new Date()}]}}}));
  const viewer={id:user.id,roles:['participant']};
  const visible=()=>prisma.studySession.count({where:{studyId:{in:studies.map(s=>s.id)},...sessionAccessWhere(viewer)}});
  assert.equal(await visible(),0);
  await prisma.studyMembership.create({data:{studyId:studies[0].id,userId:user.id}});
  assert.equal(await visible(),1);
  const memberSessions=await prisma.studySession.findMany({where:{studyId:studies[0].id,...sessionAccessWhere(viewer)}});
  assert.deepEqual(memberSessions.map(s=>s.weekNo),[1]);
  assert.equal(await prisma.study.count({where:{id:{in:studies.map(s=>s.id)},...studyAccessWhere(viewer)}}),1);
  assert.equal(await prisma.studySession.count({where:{studyId:{in:studies.map(s=>s.id)},...sessionAccessWhere({id:user.id,roles:['admin']})}}),4);
  await prisma.studyMembership.delete({where:{studyId_userId:{studyId:studies[0].id,userId:user.id}}});
  assert.equal(await visible(),0);
 }finally{await prisma.studySession.deleteMany({where:{studyId:{in:studies.map(s=>s.id)}}});await prisma.study.deleteMany({where:{id:{in:studies.map(s=>s.id)}}});await prisma.user.delete({where:{id:user.id}});}
});
