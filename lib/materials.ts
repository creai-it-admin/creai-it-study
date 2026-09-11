export type MaterialKind = 'education' | 'presentation';
export type MaterialItem = {id:string;kind:MaterialKind;title:string};
export const materialLabels = {education:'교육 자료',presentation:'구성원 발표'};
export const materialSelect = {id:true,kind:true,title:true} as const;
export function materialHref(sessionId:string,materialId?:string){
 return `/routes/deck?session=${encodeURIComponent(sessionId)}${materialId?`&material=${encodeURIComponent(materialId)}`:''}`;
}
