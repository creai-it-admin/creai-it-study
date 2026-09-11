import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {validDeckPath,DECK_CSP} from '../lib/storage';
import {sessionAccessWhere} from '../lib/study-access';
const require=createRequire(import.meta.url);
function load(file:string,deps:Record<string,unknown>){
 const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const module={exports:{} as Record<string,(...args:any[])=>Promise<Response>>};
 runInNewContext(source,{module,exports:module.exports,Response,URL,require:(name:string)=>name in deps?deps[name]:require(name)});return module.exports;
}
const path='week1/decks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.html';
function harness(admin=true){
 const rows:any[]=[{id:'edu',sessionId:'week1',kind:'education',title:'Original',path:'original'}];let confirmed=0,legacyWrites=0;
 const db={studySession:{findUnique:async()=>({deckPath:'original'}),update:async()=>{legacyWrites++;}},sessionMaterial:{
  findFirst:async({where}:any)=>rows.find(r=>r.id===where.id&&r.sessionId===where.sessionId&&r.kind===where.kind),
  update:async({where,data}:any)=>Object.assign(rows.find(r=>r.id===where.id),data),
  upsert:async({where,create}:any)=>{const found=rows.find(r=>r.path===where.path);if(found)return found;const saved={id:`material-${rows.length}`, ...create};rows.push(saved);return saved;},
 }};
 const api=load('app/api/admin/session/[id]/deck/route.ts',{'@/lib/auth':{requireAdmin:async()=>admin?{}:null},'@/lib/prisma':{prisma:{...db,$transaction:(fn:any)=>fn(db)}},'@/lib/storage':{validDeckPath,confirmDeck:async()=>{confirmed++;}}});
 return {rows,confirmed:()=>confirmed,legacyWrites:()=>legacyWrites,post:(body:any)=>api.POST(new Request('http://localhost/api',{method:'POST',body:JSON.stringify(body)}),{params:Promise.resolve({id:'week1'})})};
}
test('presentation upload and retry preserve education and do not duplicate materials',async()=>{
 const h=harness();const body={path,kind:'presentation',title:'Member talk'};
 assert.equal((await h.post(body)).status,200);assert.equal((await h.post(body)).status,200);
 assert.equal(h.rows.length,2);assert.equal(h.rows[0].path,'original');assert.equal(h.legacyWrites(),0);
 assert.equal((await h.post({...body,materialId:h.rows[1].id,title:'Updated talk'})).status,200);
 assert.equal(h.rows[1].title,'Updated talk');assert.equal(h.rows[0].title,'Original');
});
test('only admins can register materials; invalid categories and cross-session replacements are rejected',async()=>{
 const member=harness(false);assert.equal((await member.post({path,kind:'presentation',title:'Talk'})).status,403);assert.equal(member.confirmed(),0);
 const h=harness();
 for(const body of [{path,kind:'other',title:'Talk'},{path,kind:'presentation',title:' '},{path:path.replace('week1','week2'),kind:'presentation',title:'Talk'}])assert.equal((await h.post(body)).status,400);
 assert.equal((await h.post({path,kind:'presentation',title:'Talk',materialId:'edu'})).status,404);
 h.rows.push({id:'other',sessionId:'week2',kind:'presentation'});
 assert.equal((await h.post({path,kind:'presentation',title:'Talk',materialId:'other'})).status,404);assert.equal(h.confirmed(),0);
});
test('material reader scopes IDs to accessible sessions and serves sandboxed HTML',async()=>{
 const user={id:'member',roles:['participant']};let downloads=0;
 const api=load('app/api/sessions/[id]/deck/route.ts',{'@/lib/auth':{requireUser:async()=>user},'@/lib/study-access':{sessionAccessWhere},'@/lib/prisma':{prisma:{studySession:{findFirst:async({where,select}:any)=>{
  assert.equal(where.id,'week1');assert.equal(where.study.members.some.userId,'member');assert.equal(where.weekNo.gt,0);
  return {deckPath:path,materials:select.materials.where.id==='talk'?[{path}]:[]};
 }}}},'@/lib/storage':{validDeckPath,DECK_CSP,downloadMedia:async()=>{downloads++;return new Blob(['<html>Talk</html>']);}}});
 const get=(id:string)=>api.GET(new Request(`http://localhost/api?material=${id}`),{params:Promise.resolve({id:'week1'})});
 assert.equal((await get('another-session-material')).status,404);assert.equal(downloads,0);
 const result=await get('talk');assert.equal(result.status,200);assert.equal(await result.text(),'<html>Talk</html>');assert.equal(result.headers.get('Cache-Control'),'private, no-store');assert.equal(result.headers.get('Content-Security-Policy'),DECK_CSP);
});
