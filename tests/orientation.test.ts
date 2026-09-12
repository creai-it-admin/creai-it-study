import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {validOtPath,DECK_CSP} from '../lib/storage';
import {studyAccessWhere} from '../lib/study-access';
const require=createRequire(import.meta.url);
function load(file:string,deps:Record<string,unknown>){
 const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const module={exports:{} as Record<string,(...args:any[])=>Promise<Response>>};
 runInNewContext(source,{module,exports:module.exports,Response,require:(name:string)=>name in deps?deps[name]:require(name)});return module.exports;
}
const path='studies/zero/orientation/decks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.html';
const ctx={params:Promise.resolve({id:'zero'})};
test('OT upload is admin-only and cannot attach another study or session file',async()=>{
 let admin=false,writes=0,invalid=false;
 const api=load('app/api/admin/studies/[id]/ot/route.ts',{'@/lib/auth':{requireAdmin:async()=>admin?{}:null},'@/lib/storage':{validOtPath,confirmDeck:async()=>{if(invalid)throw Error('Invalid HTML');}},'@/lib/prisma':{prisma:{study:{findUnique:async()=>({id:'zero'}),update:async({where,data}:any)=>{assert.equal(where.id,'zero');assert.equal(data.otPath,path);writes++;}}}}});
 const post=(p=path)=>api.POST(new Request('http://localhost/api',{method:'POST',body:JSON.stringify({path:p})}),ctx);
 assert.equal((await post()).status,403);admin=true;
 assert.equal((await post(path.replace('/zero/','/other/'))).status,400);
 assert.equal((await post('zero/decks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.html')).status,400);
 invalid=true;assert.equal((await post()).status,400);assert.equal(writes,0);
 invalid=false;assert.equal((await post()).status,200);assert.equal(writes,1);
});
test('OT reader requires membership, keeps HTML sandboxed and refuses missing material',async()=>{
 let user:any=null,found=true,downloads=0;
 const api=load('app/api/studies/[id]/ot/route.ts',{'@/lib/auth':{requireUser:async()=>user},'@/lib/study-access':{studyAccessWhere},'@/lib/storage':{validOtPath,DECK_CSP,downloadMedia:async()=>{downloads++;return new Blob(['<html>Orientation</html>']);}},'@/lib/prisma':{prisma:{study:{findFirst:async({where}:any)=>{assert.equal(where.id,'zero');assert.equal(where.members.some.userId,'member');return found?{otPath:path}:null;}}}}});
 const get=()=>api.GET(new Request('http://localhost/api'),ctx);
 assert.equal((await get()).status,401);user={id:'member',roles:['participant']};found=false;
 assert.equal((await get()).status,404);assert.equal(downloads,0);found=true;
 const res=await get();assert.equal(res.status,200);assert.equal(res.headers.get('Content-Security-Policy'),DECK_CSP);assert.equal(res.headers.get('Cache-Control'),'private, no-store');assert.equal(await res.text(),'<html>Orientation</html>');
});
