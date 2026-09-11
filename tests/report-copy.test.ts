import assert from 'node:assert/strict';
import {test} from 'node:test';
import {copyReportHtml} from '../lib/report-copy';
const html='<!doctype html><html><body><h1>세션 리포트</h1><p>제안 · 합의</p></body></html>';
test('copies the complete HTML source as plain text',async()=>{
 const originalFetch=global.fetch;const descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');let copied='';
 try{
  global.fetch=async()=>new Response(html,{headers:{'Content-Type':'text/html'}});
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async(value:string)=>{copied=value;}}}});
  assert.deepEqual(await copyReportHtml('/routes/sessions/test/report'),{copied:true,html});assert.equal(copied,html);
 }finally{global.fetch=originalFetch;if(descriptor)Object.defineProperty(globalThis,'navigator',descriptor);else Reflect.deleteProperty(globalThis,'navigator');}
});
test('clipboard rejection returns selectable HTML, but failed authorization never offers error content to copy',async()=>{
 const originalFetch=global.fetch;const descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');let attempts=0;
 try{
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async()=>{attempts++;throw Error('denied');}}}});
  global.fetch=async()=>new Response(html,{headers:{'Content-Type':'text/html'}});
  assert.deepEqual(await copyReportHtml('/routes/sessions/test/report'),{copied:false,html});
  global.fetch=async()=>new Response('로그인이 필요합니다.',{status:401});
  await assert.rejects(copyReportHtml('/routes/sessions/test/report'),/로그인/);assert.equal(attempts,1);
 }finally{global.fetch=originalFetch;if(descriptor)Object.defineProperty(globalThis,'navigator',descriptor);else Reflect.deleteProperty(globalThis,'navigator');}
});
