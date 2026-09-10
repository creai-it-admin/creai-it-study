"use client";

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';

export function Consent({agreed,onChange}:{agreed:boolean;onChange:(value:boolean)=>void}) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3">
    <input type="checkbox" checked={agreed} onChange={e=>onChange(e.target.checked)} className="mt-[3px] h-4 w-4 accent-[var(--accent)]" />
    <span className="text-[13.5px] leading-relaxed">대화 기록 저장 및 운영진 검토 목적의 문서화에 동의합니다.</span>
  </label>;
}
export function ConsentDetails() {
  return <ul className="flex flex-col gap-1.5 text-[12px] leading-relaxed text-ink-3">
    <li>무엇을 저장하나. 세션 녹음의 전사본과 요약, 인클래스 제출물, 출석</li>
    <li>무엇에 쓰나. 회차 운영 기록과 다음 회차·다음 기수 개선</li>
    <li>언제까지 두나. 0기가 끝나고 6개월 뒤에 지웁니다</li>
    <li>지워 달라고 하면. 운영진에게 말하면 계정과 제출물을 지웁니다</li>
  </ul>;
}
export function LoginForm({consentRequired=false}:{consentRequired?:boolean}) {
  const [mode,setMode] = useState<'signin'|'signup'>('signin');
  const [agreed,setAgreed] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const needsConsent = mode === 'signup' || consentRequired;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    if (needsConsent && !agreed) {setError('기록 저장 및 운영진 검토에 동의해 주세요.'); return;}
    if (mode === 'signup' && password !== form.get('confirmation')) {setError('비밀번호가 서로 다릅니다.');return;}
    setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'signup') {
        const response = await fetch('/api/auth/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register',name:form.get('name'),email,password,agreed})});
        const result = await response.json();
        if (!response.ok) {setError(result.error ?? '회원가입하지 못했습니다.');return;}
        setMode('signin');
        setNotice('계정이 만들어졌습니다. 이메일과 비밀번호로 로그인해 주세요.');
        return;
      }
      const result = await signIn('credentials',{email,password,agreed:String(agreed),redirect:false,redirectTo:'/'});
      if (result?.error || !result?.ok) {setError('이메일 또는 비밀번호를 확인해 주세요. 반복 시도했다면 15분 뒤 다시 시도해 주세요.');return;}
      window.location.assign('/');
    } catch {
      setError('연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
    } finally {setBusy(false);}
  }
  return <div className="flex flex-col gap-5">
    <div className="flex gap-2" aria-label="계정 메뉴">
      {(['signin','signup'] as const).map(value=><button key={value} type="button" disabled={busy} aria-pressed={mode===value} className={`btn flex-1 ${mode===value?'btn-primary':''}`} onClick={()=>{setMode(value);setError('');setNotice('');}}>{value==='signin'?'로그인':'회원가입'}</button>)}
    </div>
    <form onSubmit={submit} className="flex flex-col gap-4">
      {mode==='signup' && <label className="text-sm">이름<input className="field mt-1" name="name" autoComplete="name" required maxLength={80} disabled={busy}/></label>}
      <label className="text-sm">이메일<input className="field mt-1" name="email" type="email" autoComplete="username" required maxLength={254} disabled={busy}/></label>
      <label className="text-sm">비밀번호<input key={mode} className="field mt-1" name="password" type="password" autoComplete={mode==='signup'?'new-password':'current-password'} required minLength={10} maxLength={128} disabled={busy}/>{mode==='signup'&&<span className="mt-1 block text-xs text-ink-2">10~128자. 기억하기 쉬운 긴 문장도 사용할 수 있습니다.</span>}</label>
      {mode==='signup'&&<label className="text-sm">비밀번호 확인<input className="field mt-1" name="confirmation" type="password" autoComplete="new-password" required minLength={10} maxLength={128} disabled={busy}/></label>}
      {needsConsent&&<><Consent agreed={agreed} onChange={setAgreed}/><ConsentDetails/></>}
      {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
      {notice&&<p role="status" className="text-sm text-accent-strong">{notice}</p>}
      <button className="btn btn-primary w-full" disabled={busy||(needsConsent&&!agreed)}>{busy?'처리 중…':mode==='signup'?'계정 만들기':'로그인'}</button>
    </form>
    <p className="text-xs leading-relaxed text-ink-2">기존 계정의 첫 비밀번호 설정이나 비밀번호 재설정은 운영진에게 요청해 주세요.</p>
  </div>;
}
