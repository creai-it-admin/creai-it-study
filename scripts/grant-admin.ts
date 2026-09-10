import { loadEnvConfig } from '@next/env';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

async function main() {
  loadEnvConfig(process.cwd(),true,{info(){},error(){}});
  const {prisma}=await import('../lib/prisma');
  const {normalizeEmail}=await import('../lib/passwords');
  const rl=createInterface({input:stdin,output:stdout});
  try {
    const email=normalizeEmail(await rl.question('본인 확인을 마친 회원의 이메일: '));
    if(!email)throw Error();
    const user=await prisma.user.findFirst({where:{email:{equals:email,mode:'insensitive'}}});
    if(!user?.passwordHash)throw Error();
    await prisma.user.update({where:{id:user.id},data:{roles:['participant','admin']}});
    stdout.write('운영진 권한을 부여했습니다. 해당 계정은 로그아웃 후 다시 로그인하세요.\n');
  } finally {rl.close();await prisma.$disconnect();}
}
main().catch(()=>{console.error('권한을 변경하지 못했습니다. 이메일/비밀번호로 가입한 계정인지 확인해 주세요.');process.exitCode=1;});
