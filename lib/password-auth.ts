import { createHash, randomBytes } from 'node:crypto';
import { prisma } from './prisma';
import { consumeAttempt } from './auth-rate-limit';
import { hashPassword, normalizeEmail, validPassword, verifyPassword } from './passwords';

export class AccountError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
const duplicateMessage = '이 이메일로 가입할 수 없습니다. 기존 계정의 비밀번호 설정은 운영진에게 요청해 주세요.';
function payload(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AccountError('입력 내용을 확인해 주세요.');
  return input as Record<string, unknown>;
}
export async function register(input: unknown): Promise<void> {
  const data = payload(input);
  const email = normalizeEmail(data.email);
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!email || !name || name.length > 80 || !validPassword(data.password)) throw new AccountError('이름, 이메일과 10~128자 비밀번호를 입력해 주세요.');
  if (data.agreed !== true) throw new AccountError('기록 저장 및 운영진 검토에 동의해 주세요.');
  if (!await consumeAttempt('signup:global', 30)) throw new AccountError('시도가 너무 많습니다. 15분 뒤 다시 시도해 주세요.', 429);
  // Email is an unverified login identifier. It must never confer admin rights.
  const reserved = (process.env.ADMIN_EMAILS ?? '').split(',').map(e=>e.trim().toLowerCase());
  const existing = await prisma.user.findFirst({where:{email:{equals:email,mode:'insensitive'}},select:{id:true}});
  if (existing || reserved.includes(email)) throw new AccountError(duplicateMessage, 409);
  const passwordHash = await hashPassword(data.password);
  try {
    await prisma.user.create({data:{email,name,passwordHash,roles:['participant'],consentedAt:new Date()}});
  } catch(error) {
    if ((error as {code?:string}).code === 'P2002') throw new AccountError(duplicateMessage, 409);
    throw error;
  }
}
export async function authenticate(input: unknown) {
  const data = payload(input);
  const email = normalizeEmail(data.email);
  if (!email || !validPassword(data.password)) return null;
  if (!await consumeAttempt('signin:global', 300) || !await consumeAttempt(`signin:${email}`, 10)) return null;
  const user = await prisma.user.findFirst({where:{email:{equals:email,mode:'insensitive'}}});
  if (!await verifyPassword(data.password, user?.passwordHash ?? null) || !user) return null;
  if (!user.consentedAt) {
    if (data.agreed !== true && data.agreed !== 'true') return null;
    await prisma.user.update({where:{id:user.id},data:{consentedAt:new Date()}});
  }
  return {id:user.id,email:user.email,name:user.name,authVersion:user.authVersion};
}
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
// Operator-only: invoked by a local CLI after checking the person's identity.
export async function issuePasswordSetup(emailInput: string): Promise<string> {
  const email = normalizeEmail(emailInput);
  if (!email) throw new AccountError('올바른 이메일을 입력해 주세요.');
  const token = randomBytes(32).toString('hex');
  await prisma.$transaction(async tx => {
    const users = await tx.$queryRaw<{id:string}[]>`SELECT "id" FROM "User" WHERE lower("email") = ${email} FOR UPDATE`;
    const user = users[0];
    if (!user) throw new AccountError('계정을 찾을 수 없습니다.',404);
    await tx.verificationToken.deleteMany({where:{identifier:user.id}});
    await tx.verificationToken.create({data:{identifier:user.id,token:digest(token),expires:new Date(Date.now()+60*60*1000)}});
  });
  return token;
}
export async function completePasswordSetup(input: unknown): Promise<void> {
  const data = payload(input);
  if (typeof data.token !== 'string' || !/^[a-f0-9]{64}$/.test(data.token) || !validPassword(data.password)) throw new AccountError('유효한 링크와 10~128자 비밀번호가 필요합니다.');
  if (data.agreed !== true) throw new AccountError('기록 저장 및 운영진 검토에 동의해 주세요.');
  if (!await consumeAttempt('password-setup:global',30)) throw new AccountError('15분 뒤 다시 시도해 주세요.',429);
  const token = digest(data.token);
  const record = await prisma.verificationToken.findUnique({where:{token}});
  if (!record || record.expires <= new Date()) throw new AccountError('만료되었거나 이미 사용한 링크입니다. 운영진에게 새 링크를 요청해 주세요.');
  const passwordHash = await hashPassword(data.password);
  await prisma.$transaction(async tx => {
    // DELETE makes concurrent redemption single-use; rollback also restores the token.
    const used = await tx.verificationToken.deleteMany({where:{token,expires:{gt:new Date()}}});
    if (used.count !== 1) throw new AccountError('만료되었거나 이미 사용한 링크입니다.');
    const user = await tx.user.findUniqueOrThrow({where:{id:record.identifier}});
    await tx.user.update({where:{id:user.id},data:{passwordHash,authVersion:{increment:1},consentedAt:user.consentedAt ?? new Date()}});
  });
}
