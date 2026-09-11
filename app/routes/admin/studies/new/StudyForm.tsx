'use client';
import {useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
export function StudyForm(){
 const router=useRouter();const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  const form=new FormData(event.currentTarget);setBusy(true);setError('');
  try{
   const res=await fetch('/api/admin/studies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.get('name'),dates:[1,2,3,4].map(week=>form.get(`week${week}`))})});
   const data=await res.json();if(!res.ok)throw Error(data.error);
   router.push(`/routes/admin/studies/${data.id}`);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'스터디를 만들지 못했습니다.');setBusy(false);}
 }
 return <form onSubmit={submit} className="card flex flex-col gap-5 p-6">
  <label className="text-sm font-medium">스터디 이름<input className="field mt-2" name="name" placeholder="예: 1기 스터디" maxLength={120} required disabled={busy}/></label>
  <div className="grid gap-4 sm:grid-cols-2">{[1,2,3,4].map(week=><label className="text-sm font-medium" key={week}>{week}주차 날짜<input className="field mt-2" name={`week${week}`} type="date" required disabled={busy}/></label>)}</div>
  {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
  <button className="btn btn-primary" disabled={busy}>{busy?'만드는 중…':'스터디 만들기'}</button>
 </form>;
}
