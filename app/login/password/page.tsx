import { Logo } from '@/components/Header';
import { PasswordForm } from './PasswordForm';
export default function PasswordPage() {
  return <main className="flex min-h-dvh items-center justify-center px-5 py-8"><div className="card w-full max-w-[420px] p-8"><Logo/><h1 className="mb-6 mt-5 text-[22px] font-semibold">비밀번호 설정</h1><PasswordForm/></div></main>;
}
