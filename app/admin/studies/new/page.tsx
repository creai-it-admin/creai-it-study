import Link from 'next/link';
import {StudyForm} from './StudyForm';
export default function NewStudyPage(){
 return <main className="mx-auto max-w-xl px-5 py-8"><Link className="text-sm text-accent-strong" href="/admin">← 스터디 목록</Link><h1 className="mb-3 mt-4 text-xl font-semibold">새 스터디 만들기</h1><p className="mb-6 text-sm text-ink-2">이름과 일정을 등록하면 1~4주차 회차가 함께 만들어집니다. 휴회가 있다면 실제 진행 날짜를 입력하세요.</p><StudyForm/></main>;
}
