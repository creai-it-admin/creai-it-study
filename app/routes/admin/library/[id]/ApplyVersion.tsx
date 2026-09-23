'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
type Target={id:string;name:string;otPath:string|null;hasMaterial:boolean};
export function ApplyVersion({versionId,number,weekNo,targets}:{versionId:string;number:number;weekNo:number;targets:Target[]}){
 const [targetId,setTargetId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[url,setUrl]=useState('');const router=useRouter();
 const target=targets.find(t=>t.id===targetId),isOt=weekNo===0;
 async function apply(e:React.FormEvent){e.preventDefault();if(!target)return;setBusy(true);setError('');setUrl('');try{const r=await fetch(`/api/admin/library/${versionId}/apply`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studyId:target.id,expectedOtPath:target.otPath})});const b=await r.json();if(!r.ok)throw Error(b.error);setUrl(b.url);router.refresh();}catch(e){setError(e instanceof Error?e.message:'적용하지 못했습니다.');}finally{setBusy(false);}}
 return <form onSubmit={apply} className="card space-y-3 p-5"><h2 className="font-semibold">이 버전을 기수에 적용</h2><p className="text-sm text-ink-2">v{number}을 복사합니다. 이후 공통 원본이 바뀌어도 이 기수의 자료는 유지됩니다.</p><div className="flex flex-col gap-3 sm:flex-row"><select aria-label="적용할 스터디" className="field min-w-0 flex-1" value={targetId} disabled={busy} onChange={e=>{setTargetId(e.target.value);setUrl('');setError('');}} required><option value="">스터디 선택</option>{targets.map(t=><option key={t.id} value={t.id}>{t.name}{isOt&&t.otPath?' · 기존 OT 있음':''}</option>)}</select><button className="btn btn-primary" disabled={!target||busy}>{busy?'적용 중…':isOt?(target?.otPath?'OT 교체':'OT로 적용'):`${weekNo}주차에 추가`}</button></div>
 {!targets.length&&<p className="text-sm text-ink-2">{isOt?'먼저 스터디를 만들어 주세요.':'해당 주차가 준비 중인 스터디가 없습니다.'} <Link className="text-accent-strong underline" href="/routes/admin/studies/new">스터디 만들기</Link></p>}
 {target&&<p className="text-sm text-ink-2">{isOt&&target.otPath?'이 스터디의 기존 OT를 선택한 버전으로 교체합니다.':!isOt&&target.hasMaterial?'기존 교육 자료는 유지하고 이 자료를 추가합니다.':'적용 후 해당 스터디의 참가자도 자료를 볼 수 있습니다.'}</p>}
 {error&&<p role="alert" className="text-sm text-danger">{error}</p>}{url&&<p role="status" className="text-sm text-accent-strong">적용되었습니다. <Link className="underline" href={url}>기수 자료 확인 →</Link></p>}
 </form>;
}
