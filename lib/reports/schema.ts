export type Evidence = {partId:string;quote:string};
export type Report = {
 version:'1';title:string;subtitle:string;overview:string;overviewEvidence:Evidence[];
 learning:{title:string;body:string;evidence:Evidence[]}[];
 activity:{title:string;body:string;evidence:Evidence[]}|null;
 discussions:{title:string;context:string;proposals:{text:string;evidence:Evidence[]}[];outcome:string|null;openQuestion:string|null;evidence:Evidence[]}[];
 actions:{text:string;status:'agreed'|'proposed';owner:string|null;due:string|null;evidence:Evidence[]}[];
 openQuestions:{text:string;evidence:Evidence[]}[];
 limitations:string[];
};
type Schema={type?:string;enum?:string[];maxLength?:number;minLength?:number;properties?:Record<string,Schema>;required?:string[];additionalProperties?:false;items?:Schema;minItems?:number;maxItems?:number;anyOf?:Schema[]};
const str=(maxLength:number):Schema=>({type:'string',minLength:1,maxLength});
const obj=(properties:Record<string,Schema>):Schema=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const arr=(items:Schema,maxItems:number,minItems=0):Schema=>({type:'array',items,minItems,maxItems});
const nullable=(schema:Schema):Schema=>({anyOf:[schema,{type:'null'}]});
const evidence=arr(obj({partId:str(100),quote:str(300)}),4,1);
export const REPORT_SCHEMA=obj({
 version:{type:'string',enum:['1']},title:str(100),subtitle:str(180),overview:str(1200),overviewEvidence:arr(obj({partId:str(100),quote:str(300)}),6),
 learning:arr(obj({title:str(120),body:str(700),evidence}),6),
 activity:nullable(obj({title:str(120),body:str(800),evidence})),
 discussions:arr(obj({title:str(150),context:str(700),proposals:arr(obj({text:str(700),evidence}),4),outcome:nullable(str(600)),openQuestion:nullable(str(300)),evidence}),8),
 actions:arr(obj({text:str(600),status:{type:'string',enum:['agreed','proposed']},owner:nullable(str(100)),due:nullable(str(100)),evidence}),6),
 openQuestions:arr(obj({text:str(300),evidence}),6),limitations:arr(str(400),6),
});
// Validate against the same bounded schema used for Structured Outputs, including cached data.
function matches(v:unknown,s:Schema):boolean{
 if(s.anyOf)return s.anyOf.some(x=>matches(v,x));
 if(s.type==='null')return v===null;
 if(s.type==='string')return typeof v==='string'&&v.trim().length>=(s.minLength??0)&&v.length<=(s.maxLength??Infinity)&&(!s.enum||s.enum.includes(v));
 if(s.type==='array')return Array.isArray(v)&&v.length>=(s.minItems??0)&&v.length<=(s.maxItems??Infinity)&&v.every(x=>matches(x,s.items!));
 if(s.type==='object')return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===s.required!.length&&s.required!.every(k=>Object.hasOwn(v,k)&&matches((v as Record<string,unknown>)[k],s.properties![k]));
 return false;
}
export type TranscriptPart={id:string;transcript:string};
export function parseReport(value:unknown,parts:TranscriptPart[]):Report{
 if(!matches(value,REPORT_SCHEMA))throw Error('리포트 응답 형식이 올바르지 않습니다.');
 const report=value as Report;
 const sources=new Map(parts.map(p=>[p.id,p.transcript]));
 function check(v:unknown){
  if(Array.isArray(v)){v.forEach(check);return;}
  if(v&&typeof v==='object'){
   const o=v as Record<string,unknown>;
   if('partId' in o&&'quote' in o){
    if(!sources.get(o.partId as string)?.includes(o.quote as string))throw Error('리포트의 근거를 전사본에서 확인하지 못했습니다.');
   }else Object.values(o).forEach(check);
  }
 }
 check(report);
 if(!report.overviewEvidence.length&&!report.limitations.length)throw Error('요약 근거 또는 기록 한계가 필요합니다.');
 return report;
}
