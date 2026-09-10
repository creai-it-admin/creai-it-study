import {prisma} from './prisma';
export class SessionError extends Error {
  constructor(message:string,public status=409){super(message);}
}
export function validRecorderKey(key:unknown): key is string {
  return typeof key === 'string' && /^[a-f0-9-]{36}$/.test(key);
}
export async function controlSession(id:string,body:{action?:unknown;recorderKey?:unknown},userId:string){
  return prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(731204)`;
    const session=await tx.studySession.findUnique({where:{id}});
    if(!session)throw new SessionError('회차를 찾을 수 없습니다.',404);
    const {action,recorderKey}=body;
    if(action==='openSharing'||action==='closeSharing'){
      if(session.status!=='running')throw new SessionError('진행 중인 세션에서만 공유를 변경할 수 있습니다.');
      return tx.studySession.update({where:{id},data:{sharingOpen:action==='openSharing'}});
    }
    if(!['start','pause','resume','end'].includes(String(action)))throw new SessionError('지원하지 않는 세션 제어입니다.',400);
    if(!validRecorderKey(recorderKey))throw new SessionError('녹음 기기 정보가 필요합니다.',400);
    if(session.recorderKey && (session.recorderKey!==recorderKey || session.recorderUserId!==userId))throw new SessionError('녹음을 시작한 기기와 계정에서 제어해 주세요.');
    if(action==='end' && session.recordingState==='ended')return session;
    if(session.status==='closed')throw new SessionError('종료된 세션은 다시 녹음할 수 없습니다.');
    if(action==='start'){
      const other=await tx.studySession.findFirst({where:{status:'running',id:{not:id}}});
      if(other)throw new SessionError('다른 세션이 진행 중입니다. 먼저 해당 세션을 종료해 주세요.');
      if(session.recorderKey)return session;
      return tx.studySession.update({where:{id},data:{status:'running',startedAt:session.startedAt??new Date(),recordingState:'recording',recorderKey,recorderUserId:userId}});
    }
    // Legacy running sessions have no microphone owner; allow their explicit closure only.
    if(action==='end'){
      if(session.status!=='running')throw new SessionError('진행 중인 세션만 종료할 수 있습니다.');
      const pending=await tx.recordingPart.count({where:{sessionId:id,uploadedAt:null}});
      if(pending)throw new SessionError('아직 저장하지 못한 녹음이 있습니다. 저장을 완료한 뒤 종료해 주세요.');
      return tx.studySession.update({where:{id},data:{status:'closed',recordingState:'ended',endedAt:new Date(),sharingOpen:false}});
    }
    if(session.status!=='running'||!session.recorderKey)throw new SessionError('먼저 녹음을 시작해 주세요.');
    return tx.studySession.update({where:{id},data:{recordingState:action==='pause'?'paused':'recording'}});
  });
}
