export type LocalTake={id:string;sessionId:string;recorderKey:string;mimeType:string;recordedAt:string;durationMs:number;blob:Blob;complete:boolean};
function openDb():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('creai-recordings',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('takes',{keyPath:'id'});
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
}
async function transact<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('takes',mode);const req=operation(tx.objectStore('takes'));
  tx.oncomplete=()=>{db.close();resolve(req.result);};
  tx.onerror=tx.onabort=()=>{db.close();reject(tx.error??req.error);};
 });
}
export async function saveTake(take:LocalTake){await transact('readwrite',store=>store.put(take));}
export async function listTakes(sessionId:string){return (await transact<LocalTake[]>('readonly',store=>store.getAll())).filter(t=>t.sessionId===sessionId).sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));}
export async function removeTake(id:string){await transact('readwrite',store=>store.delete(id));}
export function recorderKey(sessionId:string){
 const key=`creai-recorder:${sessionId}`;
 let value=localStorage.getItem(key);if(!value){value=crypto.randomUUID();localStorage.setItem(key,value);}return value;
}
export async function sendTake(take:LocalTake){
 const request=async(action:string)=>{
  const res=await fetch(`/api/admin/session/${take.sessionId}/recording`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id:take.id,recorderKey:take.recorderKey,mimeType:take.mimeType,bytes:take.blob.size,durationMs:take.durationMs,recordedAt:take.recordedAt}),signal:AbortSignal.timeout(30000)});
  const data=await res.json();if(!res.ok)throw Error(data.error??'녹음 저장에 실패했습니다.');return data;
 };
 const info=await request('reserve');
 if(!info.uploaded){
  if(!info.exists){
   const uploaded=await fetch(info.signedUrl,{method:'PUT',headers:{'Content-Type':take.mimeType},body:take.blob,signal:AbortSignal.timeout(60000)});
   if(!uploaded.ok)throw Error('녹음을 업로드하지 못했습니다. 이 브라우저에 보관되어 있습니다.');
  }
  await request('confirm');
 }
 await removeTake(take.id);
}
