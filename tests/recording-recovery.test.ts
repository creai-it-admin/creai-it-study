import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import type {LocalTake} from '../lib/recording-queue';
function compile(path:string){return ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;}
test('failed browser storage stops capture, retains final audio and can retry',async()=>{
 let full=true,trackStopped=false,saved=0;
 const takes=new Map<string,LocalTake>();
 class Recorder{
  static current:Recorder;static isTypeSupported(){return true;}
  state='inactive';ondataavailable!:(e:{data:Blob})=>void;onstop!:()=>void;
  constructor(){Recorder.current=this;}
  start(){this.state='recording';}
  stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable({data:new Blob(['final'])});this.onstop();});}
 }
 const mod={exports:{} as {AudioCapture:typeof import('../lib/audio-capture').AudioCapture}};
 runInNewContext(compile('lib/audio-capture.ts'),{module:mod,exports:mod.exports,Blob,Date,crypto,MediaRecorder:Recorder,setTimeout:()=>1,clearTimeout(){},require:()=>({saveTake:async(take:LocalTake)=>{if(full)throw Error('QuotaExceeded');takes.set(take.id,take);}})});
 const capture=new mod.exports.AudioCapture('test','key',{saved:()=>saved++,error(){}});
 await capture.start({getTracks:()=>[{stop:()=>{trackStopped=true;}}]} as unknown as MediaStream);
 Recorder.current.ondataavailable({data:new Blob(['first'])});
 await new Promise(resolve=>setImmediate(resolve));
 await assert.rejects(capture.stop());assert.equal(Recorder.current.state,'inactive');assert.ok(trackStopped);
 assert.equal(await capture.lastBlob?.text(),'firstfinal');
 full=false;await capture.retryPersistence();await capture.stop();
 assert.equal(takes.size,1);assert.equal([...takes.values()][0].complete,true);assert.equal(await [...takes.values()][0].blob.text(),'firstfinal');assert.equal(saved,1);
});
test('failed confirmation preserves local audio; retry confirms existing object before removal',async()=>{
 const events:string[]=[];let fail=true;
 const take={id:'take',sessionId:'session',recorderKey:'key',mimeType:'audio/webm',recordedAt:new Date().toISOString(),durationMs:1000,blob:new Blob(['audio']),complete:true};
 const db={close(){},transaction(){const tx:any={};tx.objectStore=()=>({delete(){events.push('delete');queueMicrotask(()=>tx.oncomplete());return {result:undefined};}});return tx;}};
 const mod={exports:{} as {sendTake:(take:LocalTake)=>Promise<void>}};
 runInNewContext(compile('lib/recording-queue.ts'),{module:mod,exports:mod.exports,AbortSignal,JSON,indexedDB:{open(){const req:any={result:db};queueMicrotask(()=>req.onsuccess());return req;}},fetch:async(_url:string,opts:{body:string})=>{const {action}=JSON.parse(opts.body);events.push(action);return {ok:action==='reserve'||!fail,json:async()=>action==='reserve'?{exists:true}:{error:'try again'}};}});
 await assert.rejects(mod.exports.sendTake(take));assert.deepEqual(events,['reserve','confirm']);
 fail=false;await mod.exports.sendTake(take);assert.deepEqual(events,['reserve','confirm','reserve','confirm','delete']);
});
