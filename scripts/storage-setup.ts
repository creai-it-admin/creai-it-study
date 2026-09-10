import {loadEnvConfig} from '@next/env';
async function main(){
 loadEnvConfig(process.cwd(),true,{info(){},error(){}});
 const {storageClient,mediaBucket,MAX_AUDIO_BYTES}=await import('../lib/storage');
 const storage=storageClient().storage;
 const {data,error}=await storage.listBuckets();if(error)throw error;
 const name=mediaBucket(),existing=data.find(b=>b.name===name);
 if(existing?.public)throw Error('녹음 저장소는 비공개여야 합니다. 새 비공개 버킷을 지정하세요.');
 if(!existing){const result=await storage.createBucket(name,{public:false,fileSizeLimit:MAX_AUDIO_BYTES,allowedMimeTypes:['text/html','audio/webm','audio/mp4','audio/ogg','audio/wav']});if(result.error)throw result.error;}
 console.log('Private media bucket ready.');
}
main().catch(()=>{console.error('비공개 자료 저장소를 준비하지 못했습니다.');process.exitCode=1;});
