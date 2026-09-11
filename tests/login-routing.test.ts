import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const require=createRequire(import.meta.url);
function page(file:string,user:unknown){
 const module={exports:{} as {default:(props:any)=>Promise<unknown>}};
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 runInNewContext(code,{module,exports:module.exports,require:(name:string)=>{
  if(name==='@/lib/auth')return {auth:async()=>user?{user}:null};
  if(name==='next/navigation')return {redirect:(path:string)=>{throw new Error(`redirect:${path}`);}};
  if(name==='./LoginForm')return {LoginForm:()=>null};
  if(name==='@/components/Header')return {Logo:()=>null};
  return require(name);
 }});
 return ()=>module.exports.default({searchParams:Promise.resolve({})});
}
for(const [roles,destination] of [[['admin','participant'],'/routes/admin'],[['participant'],'/routes/home']] as const){
 for(const file of ['app/routes/page.tsx','app/routes/login/page.tsx']){
  test(`${file} sends ${roles[0]} directly to ${destination}`,async()=>{
   await assert.rejects(page(file,{roles,consented:true}),{message:`redirect:${destination}`});
  });
 }
}
test('entry still requires login and consent',async()=>{
 await assert.rejects(page('app/routes/page.tsx',null),{message:'redirect:/routes/login'});
 await assert.rejects(page('app/routes/page.tsx',{roles:['admin'],consented:false}),{message:'redirect:/routes/login?consent=1'});
 assert.ok(await page('app/routes/login/page.tsx',null)());
 assert.ok(await page('app/routes/login/page.tsx',{roles:['admin'],consented:false})());
});
