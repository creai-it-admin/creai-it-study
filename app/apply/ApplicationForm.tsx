'use client';
import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { koreaToday, TIME_BLOCKS } from '@/lib/education-applications';
import styles from './apply.module.css';

export default function ApplicationForm() {
  const [blocks, setBlocks] = useState<string[]>([]);
  const [start, setStart] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const sending = useRef(false);
  const requestId = useRef<string | null>(null);
  const success = useRef<HTMLElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    if (!blocks.length) { setError({ field: 'timeBlocks', message: '참여 가능한 시간대를 하나 이상 선택해 주세요.' }); form.querySelector<HTMLInputElement>('input[name="timeBlocks"]')?.focus(); return; }
    sending.current = true; setBusy(true); setError(null);
    requestId.current ??= crypto.randomUUID();
    const data = new FormData(form);
    try {
      const response = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        id: requestId.current, name: data.get('name'), birthDate: data.get('birthDate'), phone: data.get('phone'), referral: data.get('referral'), availableFrom: start, timeBlocks: blocks, consent: data.get('consent') === 'on',
      }) });
      const result = await response.json();
      if (!response.ok) { setError({ field: result.field, message: result.error || '신청을 저장하지 못했습니다. 다시 시도해 주세요.' }); if (result.field) form.querySelector<HTMLInputElement>(`[name="${result.field}"]`)?.focus(); return; }
      setDone(true);
      requestAnimationFrame(() => success.current?.focus());
    } catch { setError({ message: '연결을 확인한 뒤 다시 시도해 주세요. 입력 내용은 그대로 유지됩니다.' }); }
    finally { sending.current = false; setBusy(false); }
  }
  const fieldError = (name: string) => error?.field === name;
  if (done) return <section ref={success} tabIndex={-1} className={`card ${styles.success}`} aria-labelledby="success-title"><span className={styles.check}>✓</span><p className={styles.eyebrow}>APPLICATION RECEIVED</p><h2 id="success-title">신청이 접수되었습니다.</h2><p>가능한 일정이 맞는 분들과 코호트를 구성한 뒤,<br/>남겨 주신 전화번호로 안내드릴게요.</p><div className={styles.summary}><span>시작 가능일</span><strong>{start.replaceAll('-', '.')} 이후</strong><span>가능한 요일·시간대</span><strong>{TIME_BLOCKS.filter(b => blocks.includes(b.value)).map(b => b.label).join(' / ')}</strong></div><p className={styles.note}>정확한 일정과 참가비를 확인하신 후 참여를 확정합니다.</p><Link href="/" className={`btn btn-primary ${styles.submit}`}>교육 소개로 돌아가기 ↗</Link></section>;
  return <form onSubmit={submit} className={`card ${styles.form}`} aria-busy={busy}>
    <fieldset disabled={busy} className={styles.section}><legend><span>01</span> 기본 정보</legend><p className={styles.note}>모든 항목을 입력해 주세요.</p>
      <div className={styles.twoColumns}>
        <label>이름<input className="field" name="name" autoComplete="name" placeholder="홍길동" required maxLength={50} aria-invalid={fieldError('name')} /></label>
        <label>생년월일<input className="field" name="birthDate" type="date" autoComplete="bday" required min="1900-01-01" max={koreaToday()} aria-invalid={fieldError('birthDate')} /></label>
      </div>
      <label>휴대전화 번호<input className="field" name="phone" type="tel" autoComplete="tel" placeholder="010-1234-5678" required maxLength={20} aria-invalid={fieldError('phone')} /><small>코호트 일정과 참여 안내를 받을 번호를 적어 주세요.</small></label>
      <label>알게 된 경로<input className="field" name="referral" placeholder="예: 지인 추천, 인스타그램, 링크드인" required maxLength={100} aria-invalid={fieldError('referral')} /></label>
    </fieldset>
    <fieldset disabled={busy} className={styles.section}><legend><span>02</span> 참여 가능한 일정</legend>
      <label>시작 가능일<input className="field" name="availableFrom" type="date" min={koreaToday()} value={start} onChange={e => setStart(e.target.value)} required aria-invalid={fieldError('availableFrom')} aria-describedby="start-help" /><small id="start-help">이 날짜 이후에 시작하는 코호트에 참여할 수 있다는 뜻입니다. 실제 개강일은 별도로 안내합니다.</small></label>
      <fieldset className={styles.times}><legend>참여 가능한 시간대 <small>복수 선택 가능</small></legend><p id="time-help">4주 동안 참여 가능한 요일·시간대를 모두 골라 주세요. 토요일과 일요일 모두 선택할 수 있으며, 선택한 시간대 중 하나로 편성합니다.</p>{(['토요일', '일요일'] as const).map(day => <fieldset key={day} className={styles.dayGroup}><legend>{day}</legend><div className={styles.blocks}>{TIME_BLOCKS.filter(block => block.day === day).map(block => <label key={block.value} className={`${styles.block} ${blocks.includes(block.value) ? styles.selected : ''}`}><input type="checkbox" name="timeBlocks" aria-label={block.label} value={block.value} checked={blocks.includes(block.value)} onChange={e => setBlocks(prev => e.target.checked ? [...prev, block.value] : prev.filter(v => v !== block.value))} aria-describedby="time-help" /><span><small>{block.period}</small><strong>{block.time}</strong></span></label>)}</div></fieldset>)}</fieldset>
    </fieldset>
    <label className={styles.consent}><input name="consent" type="checkbox" required disabled={busy} aria-invalid={fieldError('consent')} /><span>신청 접수를 위한 개인정보 수집·이용에 동의합니다.<small>CREAI+IT는 이름·생년월일·전화번호·유입 경로·가능 일정을 코호트 편성과 참여 안내에 사용합니다. 동의를 거부할 수 있으나 신청 접수는 어렵습니다.</small></span></label>
    {error && <p role="alert" className={styles.error}>{error.message}</p>}
    <button className={`btn btn-primary ${styles.submit}`} disabled={busy} type="submit">{busy ? '신청을 접수하고 있어요…' : '참가 신청하기 →'}</button><p className={styles.bottomNote}>신청 후 운영진이 남겨 주신 번호로 연락드립니다.</p>
  </form>;
}
