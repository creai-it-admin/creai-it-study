import {prisma} from './prisma';
import {SessionError} from './session-control';
import {createPrivateUpload,objectInfo,MAX_AUDIO_BYTES} from './storage';
const MIME_EXT:Record<string,string>={'audio/webm':'webm','audio/mp4':'mp4','audio/ogg':'ogg','audio/wav':'wav'};
export function audioExtension(mime:unknown){return typeof mime==='string'?MIME_EXT[mime.split(';')[0]]:undefined;}
export async function reserveRecordingPart(sessionId:string,userId:string,body:Record<string,unknown>){
 const {recorderKey,id,mimeType,bytes,durationMs,recordedAt}=body;
 const ext=audioExtension(mimeType);
 if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id)||!ext||!Number.isInteger(bytes)||Number(bytes)<=0||Number(bytes)>MAX_AUDIO_BYTES||!Number.isInteger(durationMs)||Number(durationMs)<0||Number(durationMs)>24*60*60*1000||typeof recordedAt!=='string'||!Number.isFinite(Date.parse(recordedAt)))throw new SessionError('녹음 파일 정보를 확인해 주세요.',400);
 const part=await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(731204)`;
  const session=await tx.studySession.findUnique({where:{id:sessionId}});
  if(!session||session.recorderKey!==recorderKey||session.recorderUserId!==userId)throw new SessionError('녹음을 시작한 기기에서 저장해 주세요.',403);
  const existing=await tx.recordingPart.findUnique({where:{id}});
  if(existing){if(existing.sessionId!==sessionId||existing.bytes!==bytes||existing.mimeType!==String(mimeType).split(';')[0])throw new SessionError('녹음 파일이 기존 기록과 다릅니다.');return existing;}
  if(session.status!=='running')throw new SessionError('종료된 세션에는 새 녹음을 추가할 수 없습니다.');
  return tx.recordingPart.create({data:{id,sessionId,path:`${sessionId}/audio/${id}.${ext}`,mimeType:String(mimeType).split(';')[0],bytes:Number(bytes),durationMs:Number(durationMs),recordedAt:new Date(recordedAt)}});
 });
 if(part.uploadedAt)return {uploaded:true,path:part.path};
 const existing=await objectInfo(part.path);
 if(existing)return {exists:true,path:part.path};
 return createPrivateUpload(part.path);
}
export async function confirmRecordingPart(sessionId:string,userId:string,body:Record<string,unknown>){
 const part=await prisma.recordingPart.findFirst({where:{id:String(body.id),sessionId},include:{session:true}});
 if(!part||part.session.recorderKey!==body.recorderKey||part.session.recorderUserId!==userId)throw new SessionError('녹음 저장 권한이 없습니다.',403);
 if(part.uploadedAt)return;
 const info=await objectInfo(part.path);
 if(!info||info.size!==part.bytes)throw new SessionError('녹음 업로드가 완료되지 않았습니다. 다시 저장해 주세요.');
 await prisma.recordingPart.update({where:{id:part.id},data:{uploadedAt:new Date()}});
}
