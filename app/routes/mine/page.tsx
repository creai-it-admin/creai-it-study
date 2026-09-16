import Link from 'next/link';
import {redirect} from 'next/navigation';
import {requireUser} from '@/lib/auth';
import {Header} from '@/components/Header';
import {prisma} from '@/lib/prisma';
import {sessionAccessWhere} from '@/lib/study-access';
import {activityProgress} from '@/lib/activity/types';
export const dynamic='force-dynamic';
export default async function MinePage(){
 const user=await requireUser();if(!user)redirect('/routes/login');
 const subs=await prisma.submission.findMany({where:{userId:user.id,formDef:{session:sessionAccessWhere(user)}},include:{answers:true,formDef:{include:{fields:{orderBy:{order:'asc'}},session:{include:{study:true}}}},_count:{select:{feedback:true}}},orderBy:{updatedAt:'desc'}});
 return <>{await Header()}<main className="mx-auto max-w-4xl px-5 py-8"><Link href="/routes/home" className="text-sm text-ink-2">← 회차 목록</Link><h1 className="mt-4 text-2xl font-semibold">내 활동 기록</h1><p className="mt-2 mb-6 text-sm text-ink-2">작성 중인 초안부터 수정 결과까지, 회차별로 이어서 확인합니다.</p><div className="space-y-4">{subs.map(sub=>{const s=sub.formDef.session,legacy=s.activityStatus==='locked'&&!sub.firstSharedAt;return <article className="card p-5" key={sub.id}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{s.study.name} · {s.weekNo===0?'리허설':`${s.weekNo}주차`}</h2><span className="text-xs text-ink-2">{legacy?(sub.status==='submitted'?'제출 완료':'초안'):activityProgress(sub)} · 받은 피드백 {sub._count.feedback}개</span></div>{legacy?<details className="mt-4"><summary className="cursor-pointer text-sm">기존 답변 보기</summary><div className="mt-4 space-y-5">{sub.formDef.fields.map(f=><div key={f.id}><p className="text-xs text-ink-2">{f.question}</p><p className="mt-1 whitespace-pre-wrap text-sm">{sub.answers.find(a=>a.formFieldId===f.id)?.text||'비어 있음'}</p></div>)}</div></details>:<Link className="btn mt-4" href={`/routes/sessions/${s.id}/activity`}>{s.activityStatus==='open'?'이어서 작성':'결과와 피드백 보기'}</Link>}</article>})}{!subs.length&&<p className="card p-8 text-sm text-ink-2">아직 작성한 활동이 없습니다. 스터디 회차에서 인클래스를 시작해 보세요.</p>}</div></main></>;
}
