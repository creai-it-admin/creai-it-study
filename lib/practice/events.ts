import type {Prisma,PracticeEvent as Row} from '@prisma/client';
import type {PracticeEvent} from './types';
// One lock per participant keeps seq gap-free across chat turns and result submissions.
export async function appendEvent(tx:Prisma.TransactionClient,sessionId:string,userId:string,kind:PracticeEvent['kind'],text:string,meta?:Prisma.InputJsonValue){
 await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`practice:${sessionId}:${userId}`}, 0))`;
 const last=await tx.practiceEvent.findFirst({where:{sessionId,userId},orderBy:{seq:'desc'},select:{seq:true}});
 return tx.practiceEvent.create({data:{sessionId,userId,seq:(last?.seq??0)+1,kind,text,meta}});
}
export function eventView(e:Row):PracticeEvent{
 const m=(e.meta??{}) as {sources?:PracticeEvent['sources'];searches?:string[];target?:PracticeEvent['target']};
 return {seq:e.seq,kind:e.kind as PracticeEvent['kind'],text:e.text,createdAt:e.createdAt.toISOString(),...(m.sources?.length?{sources:m.sources}:{}),...(m.searches?.length?{searches:m.searches}:{}),...(m.target?{target:m.target}:{})};
}
