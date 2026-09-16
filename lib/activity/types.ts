export type ActivityField = {id:string; question:string; order:number; stage:string};
export type ActivitySnapshot = {answers:Record<string,string>; result:string};
export type Feedback = {id:string; authorId:string; name:string; text:string; updatedAt:string};
export type ActivityData = {
 session:{id:string;studyName:string;weekNo:number;status:string;activityStatus:string;sharingOpen:boolean};
 viewer:{id:string;admin:boolean};
 form:{topicMd:string;fields:ActivityField[]}|null;
 mine:{id:string|null;version:string;answers:Record<string,string>;firstSnapshot:ActivitySnapshot|null;firstSharedAt:string|null;completedAt:string|null;feedback:Feedback[]};
 peers:{id:string;userId:string;name:string;snapshot:ActivitySnapshot;completedAt:string|null;revisedResult:string;reflection:Record<string,string>;feedback:Feedback[]}[];
 people:{id:string;name:string;progress:string;attendance:string;filled:number;total:number;answers:Record<string,string>;firstSnapshot:ActivitySnapshot|null;feedback:Feedback[]}[];
};
export const FIRST_RESULT='$firstResult', REVISED_RESULT='$revisedResult';
export function activityProgress(sub:{firstSharedAt?:unknown;completedAt?:unknown;answers?:{text:string}[];firstResult?:string}|null|undefined){
 return sub?.completedAt?'수정 완료':sub?.firstSharedAt?'첫 결과 공유':sub?.answers?.some(a=>a.text.trim())||sub?.firstResult?.trim()?'작성 중':'미시작';
}
