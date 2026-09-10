import {saveTake,type LocalTake} from './recording-queue';
// Each take is a complete, independently playable recording. Partial snapshots are
// persisted every five seconds; closing/crashing can still lose the unsaved tail.
export class AudioCapture {
 private recorder:MediaRecorder|null=null;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private stopping:Promise<void>|null=null;
 private cycling=false;
 private failed=false;
 private unsaved=new Map<string,LocalTake>();
 private writes=Promise.resolve();
 private stream:MediaStream|null=null;
 lastBlob:Blob|null=null;
 constructor(private sessionId:string,private key:string,private events:{saved:()=>void;error:(message:string)=>void}){}
 static supportedMime(){
  const mime=typeof MediaRecorder!=='undefined'&&['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime)throw Error('이 브라우저에서는 녹음할 수 없습니다. Chrome 또는 Safari를 사용해 주세요.');
  return mime;
 }
 private async persist(take:LocalTake){
  try{await saveTake(take);this.unsaved.delete(take.id);}
  catch{
   this.unsaved.set(take.id,take);this.failed=true;this.cycling=false;
   clearTimeout(this.timer);
   if(this.recorder&&this.recorder.state!=='inactive')this.recorder.stop();
   this.events.error('브라우저에 녹음을 저장하지 못했습니다. 창을 닫지 말고 공간을 확보한 뒤 저장 재시도를 눌러 주세요.');
  }
 }
 async retryPersistence(){
  await this.writes;
  for(const take of this.unsaved.values()){await saveTake(take);this.unsaved.delete(take.id);if(take.complete)this.events.saved();}
  this.failed=this.unsaved.size>0;
 }
 async start(stream:MediaStream){
  if(this.recorder?.state==='recording')return;
  this.stream=stream;this.failed=false;this.cycling=true;this.begin();
 }
 private begin(){
  if(!this.stream||!this.cycling)return;
  const mime=AudioCapture.supportedMime();
  const started=Date.now();
  const take:LocalTake={id:crypto.randomUUID(),sessionId:this.sessionId,recorderKey:this.key,mimeType:mime.split(';')[0],recordedAt:new Date(started).toISOString(),durationMs:0,blob:new Blob(),complete:false};
  const chunks:Blob[]=[];
  const recorder=new MediaRecorder(this.stream,{mimeType:mime,audioBitsPerSecond:64000});
  this.recorder=recorder;
  recorder.ondataavailable=event=>{
   if(!event.data.size)return;
   chunks.push(event.data);
   take.blob=new Blob(chunks,{type:take.mimeType});take.durationMs=Date.now()-started;this.lastBlob=take.blob;
   const snapshot={...take};
   this.writes=this.writes.then(()=>this.persist(snapshot));
  };
  this.stopping=new Promise((resolve)=>{
   recorder.onstop=()=>{
    clearTimeout(this.timer);
    take.complete=true;
    // Restart capture before waiting for storage/network I/O.
    if(this.cycling&&!this.failed)this.begin();
    this.writes=this.writes.then(async()=>{if(take.blob.size){await this.persist({...take});if(!this.unsaved.has(take.id))this.events.saved();}}).finally(resolve);
   };
  });
  recorder.onerror=()=>{this.cycling=false;this.events.error('마이크 녹음이 중단되었습니다. 저장된 녹음을 확인하고 재개해 주세요.');void this.stop().catch(()=>{});};
  recorder.start(5000);
  this.timer=setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop();},60000);
 }
 async stop(){
  this.cycling=false;clearTimeout(this.timer);
  if(this.recorder&&this.recorder.state!=='inactive')this.recorder.stop();
  await this.stopping;await this.writes;
  this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;
  if(this.failed)throw Error('아직 브라우저에 저장하지 못한 녹음이 있습니다. 오디오를 내려받아 보관해 주세요.');
 }
}
