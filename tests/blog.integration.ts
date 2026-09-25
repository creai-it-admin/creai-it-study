// Opt-in HTTP checks against the local app; all QA records are removed in finally.
import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {encode} from 'next-auth/jwt';
import {prisma} from '../lib/prisma';
import {hashPassword} from '../lib/passwords';
if(process.env.RUN_BLOG_QA!=='1')throw Error('Set RUN_BLOG_QA=1 to run temporary blog integration checks.');
const base='http://localhost:3010';
test('draft privacy, role boundaries, publication snapshots and unpublish',async()=>{
 const slug=`qa-blog-${randomUUID()}`,users:string[]=[];
 async function cookie(role:'admin'|'participant'){const u=await prisma.user.create({data:{email:`${slug}-${role}@example.test`,roles:[role],passwordHash:await hashPassword(randomUUID()),consentedAt:new Date()}});users.push(u.id);return 'authjs.session-token='+await encode({secret:process.env.NEXTAUTH_SECRET!,salt:'authjs.session-token',token:{uid:u.id,authVersion:0,authMethod:'password',roles:[role],consented:true},maxAge:600});}
 async function send(cookie:string,body:unknown,origin=base){return fetch(`${base}/api/admin/blog`,{method:'POST',headers:{cookie,origin,'content-type':'application/json'},body:JSON.stringify(body)});}
 async function page(path:string,cookie=''){return fetch(base+path,{headers:{cookie},redirect:'manual'});}
 const content={title:'QA publication check',excerpt:'Temporary verification',author:'QA',category:'QA',coverUrl:'',coverAlt:'',html:'<h2>Original published content</h2><p>Only this test record is used.</p>'};
 try{
  const admin=await cookie('admin'),member=await cookie('participant');
  assert.equal((await send('',{action:'save',slug,content})).status,401);
  assert.equal((await send(member,{action:'save',slug,content})).status,403);
  assert.equal((await send(admin,{action:'save',slug,content},'https://other.test')).status,403);
  const created=await send(admin,{action:'save',slug,content});assert.equal(created.status,200,await created.clone().text());let state=await created.json();
  assert.equal((await page(`/blog/${slug}`)).status,404);
  assert.equal((await page(`/routes/admin/blog/${state.id}/preview`)).status,307);
  assert.equal((await page(`/routes/admin/blog/${state.id}/preview`,member)).status,403);
  assert.equal((await page(`/routes/admin/blog/${state.id}/preview`,admin)).status,200);
  assert.ok(!(await(await page('/sitemap.xml')).text()).includes(slug));
  let result=await send(admin,{...state,action:'publish',slug,content});assert.equal(result.status,200,await result.clone().text());state=await result.json();
  let html=await(await page(`/blog/${slug}`)).text();assert.ok(html.includes('Original published content'));assert.ok(html.includes('application/ld+json'));
  assert.ok((await(await page('/sitemap.xml')).text()).includes(slug));
  const revised={...content,html:'<p>Private revised version</p>'};const stale={...state};
  result=await send(admin,{...state,action:'save',slug,content:revised});assert.equal(result.status,200);state=await result.json();
  html=await(await page(`/blog/${slug}`)).text();assert.ok(html.includes('Original published content'));assert.ok(!html.includes('Private revised version'));
  assert.equal((await send(admin,{...stale,action:'publish',slug,content:revised})).status,400);
  assert.equal((await send(admin,{...state,action:'save',slug:`${slug}-renamed`,content:revised})).status,400);
  result=await send(admin,{...state,action:'publish',slug,content:revised});assert.equal(result.status,200);state=await result.json();
  assert.ok((await(await page(`/blog/${slug}`)).text()).includes('Private revised version'));
  result=await send(admin,{...state,action:'unpublish',slug,content:revised});assert.equal(result.status,200);
  assert.equal((await page(`/blog/${slug}`)).status,404);
  assert.ok(!(await(await page('/sitemap.xml')).text()).includes(slug));
 }finally{await prisma.blogPost.deleteMany({where:{slug}});await prisma.user.deleteMany({where:{id:{in:users}}});await prisma.$disconnect();}
});
