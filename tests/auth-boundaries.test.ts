import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function load(file:string,dependencies:Record<string,unknown>) {
  const module={exports:{} as any};
  const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  runInNewContext(source,{module,exports:module.exports,URL,Response,process:{env:{}},require:(name:string)=>name in dependencies?dependencies[name]:require(name)});
  return module.exports;
}
test('password reset invalidates old sessions; role and consent use current database state',async()=>{
  let config:any;
  const current={id:'member',email:'member@example.invalid',name:'Member',roles:['participant'],consentedAt:new Date(),authVersion:2,passwordHash:'hashed'};
  load('lib/auth.ts',{
    'next-auth':{default:(value:any)=>{config=value;return {};}},
    'next-auth/providers/credentials':{default:(value:any)=>value},
    './password-auth':{authenticate:async()=>null},
    '@/lib/prisma':{prisma:{user:{findUnique:async()=>current}}},
  });
  assert.equal(await config.callbacks.jwt({token:{uid:'member',authMethod:'password',authVersion:1}}),null);
  assert.equal(await config.callbacks.jwt({token:{uid:'member',roles:['admin'],consented:true}}),null);
  const token=await config.callbacks.jwt({token:{uid:'member',authMethod:'password',authVersion:2,roles:['admin']}});
  assert.equal(token.roles.join(','),'participant');
  assert.equal(token.passwordHash,undefined);
  assert.equal(token.consented,true);
});
test('old Google session cannot pass middleware',async()=>{
  const api=load('middleware.ts',{'next-auth/jwt':{getToken:async()=>({uid:'legacy',roles:['admin'],consented:true})}});
  const result=await api.middleware({nextUrl:new URL('http://localhost/api/admin/state'),url:'http://localhost/api/admin/state'});
  assert.equal(result.status,401);
});
test('account endpoint rejects cross-origin and malformed input before account writes',async()=>{
  let writes=0;
  const route=load('app/api/auth/account/route.ts',{'@/lib/password-auth':{register:async()=>{writes++;},completePasswordSetup:async()=>{writes++;},AccountError:class extends Error{}}});
  const post=(body:string,origin='http://localhost')=>route.POST(new Request('http://localhost/api/auth/account',{method:'POST',headers:{origin,'content-type':'application/json'},body}));
  assert.equal((await post('{"action":"register"}','https://evil.invalid')).status,403);
  assert.equal((await post('{')).status,400);
  assert.equal((await post('null')).status,400);
  assert.equal((await post('{"action":"grant-admin"}')).status,400);
  assert.equal(writes,0);
});
