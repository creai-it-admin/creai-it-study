import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
test('sub-100ms recording tails do not block transcription; longer or larger failed audio still fails',async()=>{
 let requests=0;
 const mod={exports:{} as {transcribeAudio:(blob:Blob,mime:string,durationMs?:number)=>Promise<string>}};
 const code=ts.transpileModule(readFileSync('lib/recording-processing.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 runInNewContext(code,{module:mod,exports:mod.exports,require:()=>({}),process:{env:{OPENAI_API_KEY:'test'}},FormData,AbortSignal,fetch:async()=>{requests++;return {ok:false,status:400};}});
 assert.equal(await mod.exports.transcribeAudio(new Blob([new Uint8Array(175)]),'audio/webm',75),'');
 assert.equal(requests,0);
 await assert.rejects(mod.exports.transcribeAudio(new Blob([new Uint8Array(175)]),'audio/webm',100),/400/);
 await assert.rejects(mod.exports.transcribeAudio(new Blob([new Uint8Array(1025)]),'audio/webm',75),/400/);
 await assert.rejects(mod.exports.transcribeAudio(new Blob([new Uint8Array(175)]),'audio/webm'),/400/);
 assert.equal(requests,3);
});
