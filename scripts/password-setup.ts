import { loadEnvConfig } from '@next/env';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

async function main() {
  loadEnvConfig(process.cwd(),true,{info(){},error(){}});
  const {issuePasswordSetup}=await import('../lib/password-auth');
  const {prisma}=await import('../lib/prisma');
  const rl=createInterface({input:stdin,output:stdout});
  try {
    const email=await rl.question('본인 확인을 마친 계정의 이메일: ');
    const token=await issuePasswordSetup(email);
    const url=new URL('/routes/login/password',process.env.NEXTAUTH_URL ?? 'http://localhost:3000');
    url.hash=new URLSearchParams({token}).toString();
    stdout.write(`본인에게만 전달하세요. 1시간 후 만료되는 일회용 링크입니다.\n${url}\n`);
  } finally {rl.close();await prisma.$disconnect();}
}
main().catch(()=>{console.error('링크를 만들지 못했습니다. 계정과 DB 설정을 확인해 주세요.');process.exitCode=1;});
