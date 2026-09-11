import {prisma} from './prisma';
import {downloadMedia,uploadReport} from './storage';
import {randomUUID} from 'node:crypto';
import {generateReport,REPORT_MODEL,REPORT_REASONING} from './reports/generate';
import {REPORT_PROMPT_VERSION} from './reports/prompt';
import {parseReport} from './reports/schema';
import {renderReport} from './reports/render';
import {SessionError} from './session-control';
export async function transcribeAudio(blob:Blob,mime:string,durationMs?:number){
 // Stopping during a recorder rollover can produce a tiny, sub-100ms tail
 // that the transcription API rejects. Keep its audio, but add no transcript.
 if(durationMs!==undefined&&durationMs>=0&&durationMs<100&&blob.size<=1024)return '';
 const file=new FormData();
 file.set('model',process.env.OPENAI_TRANSCRIBE_MODEL||'gpt-4o-mini-transcribe');
 file.set('language','ko');
 file.set('file',blob,`recording.${mime==='audio/mp4'?'mp4':mime==='audio/ogg'?'ogg':mime==='audio/wav'?'wav':'webm'}`);
 const response=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:file,signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw Error(`음성 전사 요청이 실패했습니다 (${response.status}). 키·사용 한도와 파일을 확인해 주세요.`);
 const result=await response.json();
 if(typeof result.text!=='string')throw Error('음성 전사 결과가 올바르지 않습니다.');
 return result.text;
}
// Each step has a database lease. A persistent worker advances it independently of browsers.
export async function processRecording(sessionId:string){
 const token=randomUUID();
 const session=await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(731204)`;
  const row=await tx.studySession.findUnique({where:{id:sessionId},include:{study:true,formDef:{include:{fields:{orderBy:{order:'asc'}}}}}});
  if(!row||row.status!=='closed')throw new SessionError('녹음을 종료한 뒤 리포트를 만들 수 있습니다.');
  if(row.processingState==='ready'&&row.reportPath)return row;
  if(row.processingLeaseUntil&&row.processingLeaseUntil>new Date())throw new SessionError('전사·리포트를 처리 중입니다.');
  await tx.studySession.update({where:{id:sessionId},data:{processingState:'processing',processingError:null,processingToken:token,processingLeaseUntil:new Date(Date.now()+300000),processingAttempts:{increment:1}}});
  return row;
 });
 if(session.processingState==='ready'&&session.reportPath)return {done:true};
 const owned={id:sessionId,processingToken:token};
 const release={processingLeaseUntil:null,processingToken:null,processingNextAttemptAt:null,processingAttempts:0};
 try{
  const part=await prisma.recordingPart.findFirst({where:{sessionId,uploadedAt:{not:null},transcript:null},orderBy:[{recordedAt:'asc'},{id:'asc'}]});
  if(part){
   if(!process.env.OPENAI_API_KEY)throw Error('서버에 OPENAI_API_KEY를 설정해 주세요.');
   const text=await transcribeAudio(await downloadMedia(part.path),part.mimeType,part.durationMs);
   await prisma.$transaction(async tx=>{
    const updated=await tx.studySession.updateMany({where:owned,data:{processingState:'pending',...release}});
    if(!updated.count)throw new SessionError('다른 작업이 처리를 이어받았습니다.');
    await tx.recordingPart.update({where:{id:part.id},data:{transcript:text}});
   });
   return {done:false};
  }
  const parts=await prisma.recordingPart.findMany({where:{sessionId,uploadedAt:{not:null}},orderBy:[{recordedAt:'asc'},{id:'asc'}]});
  if(!parts.length)throw Error('저장된 녹음이 없습니다.');
  const input=parts.map(p=>({id:p.id,transcript:p.transcript??''}));
  if(input.reduce((sum,p)=>sum+p.transcript.length,0)>600000)throw Error('한 번에 요약할 수 있는 분량을 넘었습니다. 전사본에서 내용을 확인해 주세요.');
  // Checkpoint the expensive model result before storage. An upload retry never re-summarizes it.
  const report=session.reportData?parseReport(session.reportData,input):await generateReport(input,{topic:session.formDef?.topicMd??'',questions:session.formDef?.fields.map(f=>f.question)??[]});
  const generatedAt=session.reportGeneratedAt??new Date();
  const checkpoint=await prisma.studySession.updateMany({where:owned,data:{reportData:report,summary:report.overview,reportGeneratedAt:generatedAt,reportModel:REPORT_MODEL,reportReasoning:REPORT_REASONING,reportPromptVersion:REPORT_PROMPT_VERSION}});
  if(!checkpoint.count)throw new SessionError('다른 작업이 처리를 이어받았습니다.');
  const html=renderReport(report,{studyName:session.study.name,weekNo:session.weekNo,date:session.date,generatedAt,parts:input});
  const path=await uploadReport(sessionId,html);
  const saved=await prisma.studySession.updateMany({where:owned,data:{reportPath:path,processingState:'ready',processingError:null,...release}});
  if(!saved.count)throw new SessionError('다른 작업이 처리를 이어받았습니다.');
  return {done:true};
 }catch(error){
  const message=error instanceof Error?error.message:'전사·리포트를 완료하지 못했습니다.';
  await prisma.studySession.updateMany({where:owned,data:{processingState:'error',processingError:message,processingToken:null,processingLeaseUntil:null,processingNextAttemptAt:new Date(Date.now()+30000*Math.max(1,session.processingAttempts+1))}});
  throw new SessionError(message,502);
 }
}
export async function enqueueRecording(sessionId:string){
 return prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(731204)`;
  const row=await tx.studySession.findUnique({where:{id:sessionId}});
  if(!row||row.status!=='closed')throw new SessionError('종료된 세션만 처리할 수 있습니다.');
  if(row.processingState==='ready'&&row.reportPath)return {done:true};
  if(!await tx.recordingPart.count({where:{sessionId,uploadedAt:{not:null}}}))throw new SessionError('저장된 녹음이 없습니다.');
  if(!row.processingLeaseUntil||row.processingLeaseUntil<=new Date())await tx.studySession.update({where:{id:sessionId},data:{processingState:'pending',processingAttempts:0,processingError:null,processingNextAttemptAt:null,processingLeaseUntil:null,processingToken:null}});
  return {done:false};
 });
}
export async function nextRecordingJob(){
 const now=new Date();
 await prisma.studySession.updateMany({where:{status:'closed',processingState:'processing',processingAttempts:{gte:3},processingLeaseUntil:{lte:now}},data:{processingState:'error',processingToken:null,processingLeaseUntil:null,processingError:'처리가 반복 중단되었습니다. 다시 시도해 주세요.'}});
 return prisma.studySession.findFirst({where:{status:'closed',processingState:{in:['pending','processing','error']},processingAttempts:{lt:3},recordingParts:{some:{uploadedAt:{not:null}}},AND:[{OR:[{processingLeaseUntil:null},{processingLeaseUntil:{lte:now}}]},{OR:[{processingNextAttemptAt:null},{processingNextAttemptAt:{lte:now}}]}]},orderBy:{endedAt:'asc'},select:{id:true}});
}
