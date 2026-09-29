import {arr,matches,obj,str,type Schema} from '@/lib/reports/schema';
import type {CaseRef,Commentary,PracticeSummary} from './types';
const int:Schema={type:'integer'};
export const SUMMARY_SCHEMA=obj({
 goal:str(300),approach:str(700),
 turningPoints:arr(obj({seq:int,observed:str(300),quote:str(200)}),5),
 resultState:str(500),interpretation:str(600),askParticipant:arr(str(200),3),
});
const cases=(minItems:number)=>arr(obj({participant:str(20),seq:int,note:str(200)}),4,minItems);
export const COMMENTARY_SCHEMA=obj({
 commonBlockers:arr(obj({text:str(400),cases:cases(1)}),4),
 contrasts:arr(obj({text:str(400),cases:cases(2)}),3),
 verification:arr(obj({text:str(400),cases:cases(1)}),3),
 discussion:arr(obj({question:str(300),why:str(300),cases:cases(1)}),4),
});
const flat=(s:string)=>s.replace(/\s+/g,' ').trim();
// Unverifiable evidence is dropped rather than failing the run: a retry would stall the class.
export function parseSummary(value:unknown,events:{seq:number;text:string}[]):PracticeSummary{
 if(!matches(value,SUMMARY_SCHEMA))throw Error('요약 응답 형식이 올바르지 않습니다.');
 const summary=value as PracticeSummary,texts=new Map(events.map(e=>[e.seq,flat(e.text)]));
 return {...summary,turningPoints:summary.turningPoints.filter(t=>texts.get(t.seq)?.includes(flat(t.quote)))};
}
export function parseCommentary(value:unknown,people:Map<string,{userId:string;throughSeq:number}>):Commentary{
 if(!matches(value,COMMENTARY_SCHEMA))throw Error('해설 응답 형식이 올바르지 않습니다.');
 type Raw={participant:string;seq:number;note:string};
 const refs=(list:Raw[])=>list.flatMap(c=>{const p=people.get(c.participant);return p&&c.seq>=1&&c.seq<=p.throughSeq?[{userId:p.userId,seq:c.seq,note:c.note} satisfies CaseRef]:[]});
 const keep=<T extends {cases:Raw[]}>(items:T[],min=1)=>items.flatMap(i=>{const cases=refs(i.cases);return new Set(cases.map(c=>c.userId)).size>=min?[{...i,cases}]:[]});
 const raw=value as {[K in keyof Commentary]:(Omit<Commentary[K][number],'cases'>&{cases:Raw[]})[]};
 return {commonBlockers:keep(raw.commonBlockers),contrasts:keep(raw.contrasts,2),verification:keep(raw.verification),discussion:keep(raw.discussion)};
}
