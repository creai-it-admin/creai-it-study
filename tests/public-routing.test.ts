import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function middleware(token:unknown){const mod={exports:{} as any};const code=ts.transpileModule(readFileSync('middleware.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;runInNewContext(code,{module:mod,exports:mod.exports,URL,process:{env:{}},require:(name:string)=>name==='next-auth/jwt'?{getToken:async()=>token}:require(name)});return (path:string)=>mod.exports.middleware({nextUrl:new URL(`http://localhost${path}`),url:`http://localhost${path}`});}
test('public root and nested login work without authentication; study routes remain protected',async()=>{
 const request=middleware(null);
 for(const path of ['/','/routes/login','/routes/login/password','/api/auth/session','/landing/guide.svg'])assert.equal((await request(path)).status,200,path);
 for(const path of ['/routes','/routes/home','/routes/sessions/example/report','/routes/login-private']){
  const response=await request(path);assert.equal(response.status,307,path);assert.equal(response.headers.get('location'),'http://localhost/routes/login');
 }
 assert.equal((await request('/api/state')).status,401);
});
test('nested admin pages and admin APIs still reject members',async()=>{
 const request=middleware({authMethod:'password',consented:true,roles:['participant']});
 for(const path of ['/routes/admin','/routes/admin/studies/example','/api/admin/state'])assert.equal((await request(path)).status,403,path);
 assert.equal((await request('/routes/home')).status,200);
});
