import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TIME_BLOCKS } from '@/lib/education-applications';
import type { Prisma } from '@prisma/client';
export const metadata: Metadata = { title: '참가 신청자 · CREAI+IT EDU', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
const date = (value: Date) => value.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ block?: string; start?: string; page?: string }> }) {
  if (!await requireAdmin()) redirect('/routes/login');
  const params = await searchParams;
  const block = TIME_BLOCKS.some(b => b.value === params.block) ? params.block! : '';
  const start = typeof params.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.start) && Number.isFinite(Date.parse(params.start)) ? params.start : '';
  const where: Prisma.EducationApplicationWhereInput = { ...(block ? { timeBlocks: { has: block } } : {}), ...(start ? { availableFrom: { lte: new Date(start + 'T00:00:00Z') } } : {}) };
  const count = await prisma.educationApplication.count({ where });
  const pages = Math.max(1, Math.ceil(count / 50));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(params.page) || 1)));
  const applications = await prisma.educationApplication.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 50, skip: (page - 1) * 50 });
  const pageUrl = (value: number) => '/routes/admin/applications?' + new URLSearchParams({ block, start, page: String(value) });
  return <main className="mx-auto max-w-6xl px-5 py-8">
    <Link className="text-sm text-ink-2" href="/routes/admin">← 스터디 관리</Link>
    <div className="my-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold">참가 신청자 <span className="ml-2 text-accent-strong">{count}</span></h1><p className="mt-2 text-sm text-ink-2">신청자의 가능 일정을 확인하고 코호트 편성에 활용하세요. 최신 신청순입니다.</p></div><Link className="btn" href="/apply">신청 페이지 보기 ↗</Link></div>
    <form className="card mb-6 flex flex-wrap items-end gap-4 p-5" action="/routes/admin/applications">
      <label className="min-w-48 flex-1 text-sm">개강 예정일<input type="date" name="start" defaultValue={start} className="field mt-2" /><span className="mt-2 block text-xs text-ink-2">이 날짜까지 시작 가능한 신청자</span></label>
      <label className="min-w-48 flex-1 text-sm">요일·시간대<select name="block" defaultValue={block} className="field mt-2"><option value="">전체 시간대</option>{TIME_BLOCKS.map(b => <option value={b.value} key={b.value}>{b.label}</option>)}</select><span className="mt-2 block text-xs text-ink-2">해당 시간대를 선택한 신청자</span></label>
      <button className="btn btn-primary" type="submit">일정으로 찾기</button><Link className="btn" href="/routes/admin/applications">초기화</Link>
    </form>
    {applications.length === 0 ? <div className="card p-10 text-center text-ink-2">{block || start ? '선택한 일정에 맞는 신청자가 없습니다.' : '아직 접수된 신청이 없습니다.'}</div> : <div className="grid gap-4">{applications.map(item => <article key={item.id} className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{item.name}</h2><span className="text-xs text-ink-2">{date(item.createdAt)} {item.createdAt.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false })} 접수</span></div>
      <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><dt className="mb-1 text-xs text-ink-2">휴대전화</dt><dd><a className="text-accent-strong" href={`tel:${item.phone}`}>{item.phone.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3')}</a></dd></div><div><dt className="mb-1 text-xs text-ink-2">생년월일</dt><dd>{date(item.birthDate)}</dd></div><div><dt className="mb-1 text-xs text-ink-2">시작 가능일</dt><dd>{date(item.availableFrom)} 이후</dd></div><div><dt className="mb-1 text-xs text-ink-2">알게 된 경로</dt><dd className="break-words">{item.referral}</dd></div></dl>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4"><span className="mr-2 text-xs text-ink-2">가능한 요일·시간대</span>{TIME_BLOCKS.filter(b => item.timeBlocks.includes(b.value)).map(b => <span key={b.value} className="pill text-sm">{b.label}</span>)}</div>
    </article>)}</div>}
    {pages > 1 && <nav aria-label="신청자 목록 페이지" className="mt-6 flex items-center justify-center gap-5">{page > 1 && <Link className="btn" href={pageUrl(page - 1)}>이전</Link>}<span className="text-sm">{page} / {pages}</span>{page < pages && <Link className="btn" href={pageUrl(page + 1)}>다음</Link>}</nav>}
  </main>;
}
