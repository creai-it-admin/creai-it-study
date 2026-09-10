"use client";
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Consent } from '../LoginForm';

export function PasswordForm() {
  const [agreed,setAgreed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [done,setDone]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(busy || !agreed) return;
    const form=new FormData(event.currentTarget);
    const password=String(form.get('password')??'');
    if(password!==form.get('confirmation')){setError('비밀번호가 서로 다릅니다.');return;}
    // Fragment keeps the bearer token out of HTTP access logs and referrer headers.
    const token=new URLSearchParams(window.location.hash.slice(1)).get('token');
    if(!token){setError('운영진에게 받은 비밀번호 설정 링크를 열어 주세요.');return;}
    setBusy(true);setError('');
    try {
      const res=await fetch('/api/auth/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'setup',token,password,agreed})});
      const data=await res.json();
      if(!res.ok){setError(data.error??'비밀번호를 설정하지 못했습니다.');return;}
      window.history.replaceState(null,'','/login/password');
      setDone(true);
    }catch{setError('연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');}
    finally{setBusy(false);}
  }
  if(done)return <div className="flex flex-col gap-4"><p role="status">비밀번호가 설정되었습니다.</p><Link className="btn btn-primary" href="/login">로그인하기</Link></div>;
  return <form onSubmit={submit} className="flex flex-col gap-4">
    <label className="text-sm">새 비밀번호<input className="field mt-1" type="password" name="password" autoComplete="new-password" required minLength={10} maxLength={128} disabled={busy}/><span className="mt-1 block text-xs text-ink-2">10~128자로 입력해 주세요.</span></label>
    <label className="text-sm">비밀번호 확인<input className="field mt-1" type="password" name="confirmation" autoComplete="new-password" required minLength={10} maxLength={128} disabled={busy}/></label>
    <Consent agreed={agreed} onChange={setAgreed}/>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    <button className="btn btn-primary" disabled={busy||!agreed}>{busy?'저장 중…':'비밀번호 저장'}</button>
    <Link href="/login" className="text-center text-sm text-ink-2">로그인으로 돌아가기</Link>
  </form>;
}
