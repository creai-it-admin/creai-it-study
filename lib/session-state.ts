import {sessionAccessWhere,type StudyViewer} from './study-access';
import {prisma} from '@/lib/prisma';
export async function getRunningSession(user:StudyViewer){
  return prisma.studySession.findFirst({where:{status:'running',...sessionAccessWhere(user)},orderBy:{date:'asc'},include:{study:true}});
}
export async function getLiveState(user:StudyViewer){
  const session=await getRunningSession(user);
  return {
    serverTime:new Date().toISOString(),sessionId:session?.id??null,weekNo:session?.weekNo??null,
    studyName:session?.study.name??null,
    recordingState:session?.recordingState??'idle',sharingOpen:session?.sharingOpen??false,
    route:'/routes/home',
  };
}
