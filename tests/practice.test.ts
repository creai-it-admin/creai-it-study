import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseCommentary,parseSummary} from '../lib/practice/schema';
import {readOutput} from '../lib/practice/agent';
import {formVersion,parseFormInput} from '../lib/form-editor';
const events=[{seq:1,text:'출처 없이 시장 규모를 정리해 줘'},{seq:2,text:'시장 규모는 약 3조 원입니다.\n다만 출처는 확인이 필요합니다.'},{seq:3,text:'근거 자료를 붙여서 다시 써 줘'}];
const summary={goal:'시장 규모 정리',approach:'결과를 받은 뒤 근거를 요구했다.',turningPoints:[{seq:3,observed:'근거를 요구했다.',quote:'근거 자료를 붙여서'},{seq:2,observed:'줄바꿈이 달라도 원문이다.',quote:'약 3조 원입니다. 다만 출처는'},{seq:1,observed:'만든 인용',quote:'출처를 반드시 달아 줘'},{seq:9,observed:'없는 기록',quote:'근거'}],resultState:'수정 중',interpretation:'검증 요청이 전환점이다.',askParticipant:['왜 근거를 요구했나요?']};
test('summary keeps only turning points whose quote exists in that event, tolerating whitespace',()=>{
 const parsed=parseSummary(summary,events);
 assert.deepEqual(parsed.turningPoints.map(t=>t.seq),[3,2]);
 assert.throws(()=>parseSummary({...summary,score:10},events),/형식/);
 assert.throws(()=>parseSummary({...summary,turningPoints:[{seq:'3',observed:'x',quote:'근거'}]},events),/형식/);
});
test('commentary maps pseudonymous keys to users and drops unverifiable cases',()=>{
 const people=new Map([['p1',{userId:'u1',throughSeq:5}],['p2',{userId:'u2',throughSeq:3}]]);
 const parsed=parseCommentary({
  commonBlockers:[{text:'근거 없이 시작했다.',cases:[{participant:'p1',seq:2,note:'출처 없는 첫 요청'},{participant:'p3',seq:1,note:'없는 참가자'}]},{text:'범위 밖 기록',cases:[{participant:'p2',seq:4,note:'아직 없는 기록'}]}],
  contrasts:[{text:'한 사람만 남은 대조',cases:[{participant:'p1',seq:1,note:'a'},{participant:'p1',seq:3,note:'b'}]},{text:'서로 다른 접근',cases:[{participant:'p1',seq:1,note:'a'},{participant:'p2',seq:3,note:'b'}]}],
  verification:[],discussion:[{question:'언제 근거를 요구해야 할까요?',why:'두 사람의 시점이 달랐다.',cases:[{participant:'p2',seq:3,note:'기준 추가'}]}],
 },people);
 assert.deepEqual(parsed.commonBlockers,[{text:'근거 없이 시작했다.',cases:[{userId:'u1',seq:2,note:'출처 없는 첫 요청'}]}]);
 assert.deepEqual(parsed.contrasts.map(c=>c.text),['서로 다른 접근']);
 assert.equal(parsed.discussion[0].cases[0].userId,'u2');
 assert.throws(()=>parseCommentary({commonBlockers:[],contrasts:[],verification:[]},people),/형식/);
});
test('model output yields answer text, unique cited sources and search queries',()=>{
 const out=readOutput({id:'r',model:'gpt-6-luna',output:[
  {type:'reasoning'},{type:'web_search_call',action:{query:'국내 시장 규모 2026'}},
  {type:'message',content:[{type:'output_text',text:'첫 문단 ',annotations:[{type:'url_citation',url:'https://a.example',title:'A'},{type:'url_citation',url:'https://a.example',title:'A'}]},{type:'output_text',text:'둘째 문단',annotations:[{type:'url_citation',url:'https://b.example',title:''}]}]},
 ]});
 assert.equal(out.text,'첫 문단 둘째 문단');
 assert.deepEqual(out.sources,[{url:'https://a.example',title:'A'},{url:'https://b.example',title:'https://b.example'}]);
 assert.deepEqual(out.searches,['국내 시장 규모 2026']);
 assert.equal(readOutput({id:'r',model:'m',output:[{type:'message',content:[{type:'refusal'}]}]}).text,'');
});
test('agent settings join the form version only when set, and are validated',()=>{
 const base={topicMd:'주제',fields:[{id:'a',order:1,question:'목표'}]};
 assert.equal(formVersion({...base,agentMd:'',agentWebSearch:false}),formVersion(base),'forms without an agent keep their version');
 assert.notEqual(formVersion({...base,agentMd:'과제'}),formVersion(base));
 assert.notEqual(formVersion({...base,agentMd:'과제',agentWebSearch:true}),formVersion({...base,agentMd:'과제'}));
 assert.deepEqual(parseFormInput({version:'v',topicMd:'주제',fields:[]}),{version:'v',topicMd:'주제',agentMd:'',agentWebSearch:false,fields:[]});
 assert.equal(parseFormInput({version:'v',topicMd:'주제',agentMd:' 과제 ',agentWebSearch:true,fields:[]})?.agentMd,'과제');
 assert.equal(parseFormInput({version:'v',topicMd:'주제',agentMd:1,fields:[]}),null);
 assert.equal(parseFormInput({version:'v',topicMd:'주제',agentWebSearch:'yes',fields:[]}),null);
 assert.equal(parseFormInput({version:'v',topicMd:'주제',agentMd:'x'.repeat(20001),fields:[]}),null);
});
