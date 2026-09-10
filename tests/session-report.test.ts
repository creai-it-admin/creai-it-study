import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseReport,type Report} from '../lib/reports/schema';
import {renderReport} from '../lib/reports/render';
import {generateReport} from '../lib/reports/generate';
const parts=[{id:'p1',transcript:'목표를 먼저 정합시다. 출처 표를 만들어보면 어떨까요? 아직 합의하지 않았습니다.'}];
const evidence=[{partId:'p1',quote:'목표를 먼저 정합시다.'}];
export const fixture:Report={version:'1',title:'의도와 위임',subtitle:'목표부터 정하기',overview:'목표를 먼저 정하는 방법을 논의했다.',overviewEvidence:evidence,learning:[{title:'목표',body:'원하는 결과를 정한다.',evidence}],activity:null,discussions:[],actions:[{text:'출처 표를 만들어본다.',status:'proposed',owner:null,due:null,evidence:[{partId:'p1',quote:'출처 표를 만들어보면 어떨까요?'}]}],openQuestions:[],limitations:[]};
test('report validates exact evidence and rejects invented sources or extra fields',()=>{
 assert.deepEqual(parseReport(fixture,parts),fixture);
 assert.throws(()=>parseReport({...fixture,html:'<script/>'},parts));
 assert.throws(()=>parseReport({...fixture,overviewEvidence:[{partId:'missing',quote:'목표'}]},parts),/근거/);
 assert.throws(()=>parseReport({...fixture,overviewEvidence:[{partId:'p1',quote:'모두 합의했다'}]},parts),/근거/);
 assert.throws(()=>parseReport({...fixture,actions:[{...fixture.actions[0],status:'done'}]},parts));
});
test('editorial renderer escapes model text, preserves proposal status, and omits empty sections',()=>{
 const html=renderReport({...fixture,title:'<script>alert(1)</script>',overview:'<img src=x onerror=alert(1)>'},{studyName:'<b>Study</b>',weekNo:1,date:new Date(),generatedAt:new Date(),parts});
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));
 assert.ok(html.includes('시도 제안 · 합의 아님'));assert.ok(!html.includes('함께 진행한 활동'));assert.ok(!html.includes('대화에서 더 선명해진 것'));
 assert.ok(html.includes('The study journal'));assert.ok(html.includes('전사 근거'));
});
test('no usable speech produces a limited report with no fabricated activity',()=>{
 const empty={...fixture,overview:'학습 내용을 확인할 수 없습니다.',overviewEvidence:[],learning:[],actions:[],limitations:['녹음에 인사만 포함되어 있습니다.']};
 assert.equal(parseReport(empty,[{id:'p1',transcript:'안녕하세요.'}]).learning.length,0);
});
test('report generation requests Sol medium with strict schema and handles refusal/incomplete output',async()=>{
 const originalFetch=global.fetch,originalKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test';
 try{
  global.fetch=async(_url,init)=>{
   const body=JSON.parse(String(init?.body));assert.equal(body.model,'gpt-5.6-sol');assert.equal(body.reasoning.effort,'medium');assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.equal(body.text.format.type,'json_schema');assert.ok(!body.instructions.includes('<style>'));
   return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(fixture)}]}]});
  };
  assert.equal((await generateReport(parts,{topic:'',questions:[]})).version,'1');
  global.fetch=async()=>Response.json({status:'completed',output:[{content:[{type:'refusal'}]}]});
  await assert.rejects(generateReport(parts,{topic:'',questions:[]}),/완료하지/);
  global.fetch=async()=>Response.json({status:'incomplete',output:[]});
  await assert.rejects(generateReport(parts,{topic:'',questions:[]}),/완료되지/);
 }finally{global.fetch=originalFetch;if(originalKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=originalKey;}
});
