import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {prisma} from '../lib/prisma';
import {createStudy} from '../lib/studies';
if(process.env.DATABASE_URL!=='postgresql://study_local@127.0.0.1:55439/study_test')throw Error('Isolated local DB required');
after(()=>prisma.$disconnect());
test('each study owns four independent weeks; duplicate weeks and parent deletion are blocked',async()=>{
 const ids:string[]=[];
 try{
  for(const name of ['First test study','Second test study'])ids.push((await createStudy({name,dates:['2026-09-12','2026-09-19','2026-10-03','2026-10-10']})).id);
  for(const studyId of ids){
   const sessions=await prisma.studySession.findMany({where:{studyId},orderBy:{weekNo:'asc'}});
   assert.deepEqual(sessions.map(s=>s.weekNo),[1,2,3,4]);
   await assert.rejects(prisma.studySession.create({data:{studyId,weekNo:1,date:new Date()}}));
   await assert.rejects(prisma.study.delete({where:{id:studyId}}));
  }
  const before=await prisma.study.count();
  await assert.rejects(createStudy({name:'Invalid study',dates:['invalid']}));
  assert.equal(await prisma.study.count(),before);
  assert.equal(await prisma.studySession.count({where:{studyId:{in:ids}}}),8);
 }finally{await prisma.studySession.deleteMany({where:{studyId:{in:ids}}});await prisma.study.deleteMany({where:{id:{in:ids}}});}
});
