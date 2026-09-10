import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
// Import after env loading; do not log credentials or source content.
async function main(){
 const {nextRecordingJob,processRecording}=await import('../lib/recording-processing');
 const {prisma}=await import('../lib/prisma');
 let stopping=false;process.on('SIGTERM',()=>{stopping=true;});process.on('SIGINT',()=>{stopping=true;});
 console.log('Session report worker started');
 try{
  while(!stopping){
   try{
    const job=await nextRecordingJob();
    if(job){await processRecording(job.id);continue;}
   }catch{console.error('Session report step failed; state saved for retry.');}
   await new Promise(resolve=>setTimeout(resolve,3000));
  }
 }finally{await prisma.$disconnect();}
}
main().catch(()=>{console.error('Session report worker stopped unexpectedly.');process.exitCode=1;});
