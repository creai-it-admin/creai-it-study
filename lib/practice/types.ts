export type PracticeSource={url:string;title:string};
export type PracticeEvent={seq:number;kind:'request'|'response'|'result';text:string;createdAt:string;sources?:PracticeSource[];searches?:string[];target?:'first'|'revised'};
export type PracticeSummary={goal:string;approach:string;turningPoints:{seq:number;observed:string;quote:string}[];resultState:string;interpretation:string;askParticipant:string[]};
export type CaseRef={userId:string;seq:number;note:string};
export type Commentary={
 commonBlockers:{text:string;cases:CaseRef[]}[];
 contrasts:{text:string;cases:CaseRef[]}[];
 verification:{text:string;cases:CaseRef[]}[];
 discussion:{question:string;why:string;cases:CaseRef[]}[];
};
export type Spotlight={userId:string;from:number;to:number};
export type CommentaryView={
 enabled:boolean;
 commentary:{data:Commentary;generatedAt:string;stale:boolean}|null;
 people:{id:string;name:string;turns:number;latestSeq:number;summary:{data:PracticeSummary;throughSeq:number;generatedAt:string}|null}[];
 spotlight:Spotlight|null;
 failed?:number;
};
