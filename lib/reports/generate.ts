import {REPORT_SCHEMA,parseReport,type TranscriptPart} from './schema';
import {REPORT_SYSTEM_PROMPT} from './prompt';
export const REPORT_MODEL='gpt-5.6-sol';
export const REPORT_REASONING='medium';
export async function generateReport(parts:TranscriptPart[],sessionContext:{topic:string;questions:string[]}){
 if(!process.env.OPENAI_API_KEY)throw Error('서버에 OPENAI_API_KEY를 설정해 주세요.');
 const response=await fetch('https://api.openai.com/v1/responses',{
  method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
  body:JSON.stringify({model:REPORT_MODEL,reasoning:{effort:REPORT_REASONING},store:false,max_output_tokens:16000,
   instructions:REPORT_SYSTEM_PROMPT,input:JSON.stringify({sessionContext,transcriptParts:parts}),
   text:{format:{type:'json_schema',name:'study_session_report',strict:true,schema:REPORT_SCHEMA}},
  }),signal:AbortSignal.timeout(240000),
 });
 if(!response.ok)throw Error(`리포트 요약 요청이 실패했습니다 (${response.status}). 모델 접근 권한과 API 사용 한도를 확인해 주세요.`);
 const result=await response.json();
 const content=(result.output??[]).flatMap((item:{content?:{type:string;text?:string}[]})=>item.content??[]);
 if(content.some((item:{type:string})=>item.type==='refusal'))throw Error('모델이 이 기록의 요약을 완료하지 못했습니다.');
 if(result.status!=='completed')throw Error('리포트 요약이 완료되지 않았습니다. 다시 시도해 주세요.');
 const text=content.filter((item:{type:string})=>item.type==='output_text').map((item:{text:string})=>item.text).join('');
 let value:unknown;try{value=JSON.parse(text);}catch{throw Error('리포트 응답을 읽지 못했습니다.');}
 return parseReport(value,parts);
}
