import {spawn} from 'node:child_process';
const mode=process.argv[2];
if(!['dev','start'].includes(mode))throw Error('Expected dev or start');
const env={...process.env,NODE_ENV:mode==='dev'?'development':'production'};
const children=[spawn(process.execPath,['node_modules/next/dist/bin/next',mode,...process.argv.slice(3)],{stdio:'inherit',env}),spawn(process.execPath,['--import','tsx','scripts/report-worker.ts'],{stdio:'inherit',env})];
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;children.forEach(child=>child.kill('SIGTERM'));setTimeout(()=>{children.forEach(child=>child.kill('SIGKILL'));process.exit(code);},5000).unref();}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
children.forEach(child=>{child.on('error',()=>stop(1));child.on('exit',code=>{if(!stopping)stop(code??1);});});
