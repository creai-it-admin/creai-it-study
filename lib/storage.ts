import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
export const MAX_DECK_BYTES=20*1024*1024;
export const MAX_AUDIO_BYTES=20*1024*1024;
export function storageClient(){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('저장소 설정을 확인해 주세요.');
 return createClient(url,key,{auth:{persistSession:false}});
}
export const mediaBucket=()=>process.env.SUPABASE_MEDIA_BUCKET?.trim()||'study-media';
export async function createPrivateUpload(path:string){
 const {data,error}=await storageClient().storage.from(mediaBucket()).createSignedUploadUrl(path);
 if(error)throw Error('업로드 주소를 만들지 못했습니다. 저장소 설정을 확인해 주세요.');
 return {signedUrl:data.signedUrl,path};
}
export async function objectInfo(path:string){
 const {data,error}=await storageClient().storage.from(mediaBucket()).info(path);
 if(error)return null;
 return data;
}
export async function downloadMedia(path:string){
 const {data,error}=await storageClient().storage.from(mediaBucket()).download(path);
 if(error||!data)throw Error('저장된 자료를 읽지 못했습니다.');
 return data;
}
export async function playbackUrl(path:string){
 const {data,error}=await storageClient().storage.from(mediaBucket()).createSignedUrl(path,60*60);
 if(error)throw Error('재생 주소를 만들지 못했습니다.');
 return data.signedUrl;
}
export const validDeckPath=(path:unknown,id:string):path is string=>typeof path==='string'&&new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}/decks/[a-f0-9-]{36}\\.html$`).test(path);
export async function createDeckUploadUrl(sessionId:string){return createPrivateUpload(`${sessionId}/decks/${randomUUID()}.html`);}
export function validateHtml(html:string){
 if(!/<(?:!doctype\s+html|html|head|body)[\s>]/i.test(html)||html.includes('\0'))throw Error('HTML 문서 파일을 올려 주세요.');
 // A single file must include its own local scripts, images and styles.
 const refs=[...html.matchAll(/(?<![\w:-])(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1]);
 if(refs.some(ref=>!ref.startsWith('#')&&!/^(?:https?:|data:|blob:|mailto:|tel:|about:)/i.test(ref)))throw Error('이미지·스크립트·스타일을 포함한 단일 HTML 파일을 올려 주세요. 상대 경로 파일은 함께 업로드되지 않습니다.');
}
export async function confirmDeck(path:string){
 const blob=await downloadMedia(path);
 if(!blob.size||blob.size>MAX_DECK_BYTES)throw Error('HTML 장표는 20MB 이하로 올려 주세요.');
 validateHtml(await blob.text());
 return path;
}
export const DECK_CSP="sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline' https: blob:; style-src 'unsafe-inline' https:; img-src https: data: blob:; font-src https: data:; media-src https: data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";

export const reportStoragePath=(sessionId:string)=>`${sessionId}/reports/editorial-v1.html`;
export async function uploadReport(sessionId:string,html:string){
 const path=reportStoragePath(sessionId);
 const {error}=await storageClient().storage.from(mediaBucket()).upload(path,Buffer.from(html,'utf8'),{contentType:'text/html',upsert:true,cacheControl:'0'});
 if(error)throw Error('리포트를 저장소에 올리지 못했습니다. 요약 결과는 보관되어 재시도할 수 있습니다.');
 return path;
}

export const validOtPath=(path:unknown,studyId:string):path is string=>validDeckPath(path,`studies/${studyId}/orientation`);
export async function createOtUploadUrl(studyId:string){return createDeckUploadUrl(`studies/${studyId}/orientation`);}
