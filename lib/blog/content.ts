import sanitizeHtml from 'sanitize-html';

export type BlogContent = {title:string; excerpt:string; html:string; author:string; category:string; coverUrl:string; coverAlt:string};
export const EMPTY_CONTENT:BlogContent = {title:'',excerpt:'',html:'',author:'CREAI+IT',category:'인사이트',coverUrl:'',coverAlt:''};
export const SITE_URL = process.env.SITE_URL || 'https://creai-it-study.vercel.app';
export function imageUrl(value:string) {
  if (!value) return true;
  if (/^\/landing\/[a-zA-Z0-9/_\.\-]+$/.test(value) && !value.includes('..')) return true;
  try {const url=new URL(value);return url.protocol==='https:' && !url.username && !url.password;} catch {return false;}
}
export function cleanHtml(html:string) {
  return sanitizeHtml(html, {
    allowedTags:['p','h2','h3','h4','strong','em','b','i','s','a','ul','ol','li','blockquote','pre','code','hr','br','figure','figcaption','img','table','thead','tbody','tr','th','td','caption','sup','sub'],
    allowedAttributes:{a:['href','title'],img:['src','alt','width','height','loading'],th:['scope'],ol:['start']},
    allowedSchemes:['https','http','mailto'],allowProtocolRelative:false,
    nonTextTags:['script','style','textarea','option','head'],
    transformTags:{img:(_tag,attrs)=>({tagName:'img',attribs:{...attrs,loading:'lazy'}})},
    exclusiveFilter:frame=>frame.tag==='img' && !imageUrl(frame.attribs.src||'') || frame.tag==='img' && !frame.attribs.src,
  });
}
export function parseContent(input:unknown):BlogContent {
  if(!input || typeof input!=='object')throw Error('글 내용을 확인해 주세요.');
  const result={...EMPTY_CONTENT};
  const limits={title:120,excerpt:300,html:200000,author:60,category:30,coverUrl:2048,coverAlt:200};
  for(const key of Object.keys(limits) as (keyof BlogContent)[]){
    const value=(input as Record<string,unknown>)[key];
    if(typeof value!=='string'||value.length>limits[key])throw Error(`${key} 입력 길이나 형식을 확인해 주세요.`);
    result[key]=value.trim();
  }
  if(!result.title)throw Error('제목을 입력해 주세요.');
  if(!imageUrl(result.coverUrl))throw Error('표지 이미지는 HTTPS 주소를 사용해 주세요.');
  result.html=cleanHtml(result.html);
  return result;
}
export function validatePublication(content:BlogContent){
  if(!content.excerpt||!content.author||!content.category||!sanitizeHtml(content.html,{allowedTags:[],allowedAttributes:{}}).trim())throw Error('발행 전에 요약, 작성자, 분류, 본문을 채워 주세요.');
  if(content.coverUrl&&!content.coverAlt)throw Error('표지 이미지 설명을 입력해 주세요.');
}
export function parseSlug(value:unknown):string {
 if(typeof value!=='string'||value.length>100||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))throw Error('글 주소는 영문 소문자·숫자·하이픈으로 입력해 주세요.');
 return value;
}
