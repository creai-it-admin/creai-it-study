"use client";
import {useEffect,useRef,useState} from 'react';
const questions=[
 {question:'어떤 사람이 되기 위한 스터디인가요?',answer:'AI가 가져오는 변화를 이해하고, 최신 AI를 자기 일에 연결할 수 있는 사람을 지향해요. 지식적 이해와 활용에 대한 이해를 함께 쌓아, 일도 잘하고 AI도 잘 쓰는 인재로 성장할 기반을 만듭니다.',link:'#vision',label:'스터디의 방향 보기'},
 {question:'4주 동안 무엇을 배우나요?',answer:'1주차에는 AI와 함께 일을 설계하는 법, 2주차에는 큰 일을 믿고 맡기는 구조, 3주차에는 어려운 일과 새로운 결과물에 도전하는 법, 4주차에는 AI로 달라지는 사람들의 행동과 산업을 다룹니다. 주 1회, 회당 2시간이고 한 반은 8명 이내입니다. 3–4주차에는 개인 프로젝트를 진행하며 튜터의 피드백을 받습니다.',link:'#curriculum',label:'4주 커리큘럼 보기'},
 {question:'교육 이후에도 함께할 수 있나요?',answer:'네. 4주를 마치면 별도 비용 없이 CREAI+IT 커뮤니티의 일원이 돼요. 기수와 상관없이 수료생 대화방에서 AI 소식과 자료를 나누고, 정기 모임과 행사, 수료생 팀이 함께하는 프로젝트, 멘토 같은 역할로 이어집니다. 준비되는 활동은 멤버에게 먼저 안내해요.',link:'#community',label:'커뮤니티 구조 보기'},
 {question:'어떻게 참여할 수 있나요?',answer:'참가 신청에서 시작 가능일과 토요일·일요일 중 참여 가능한 시간대를 모두 알려 주세요. 일정이 맞는 분들과 코호트를 구성한 뒤, 남겨 주신 전화번호로 일정과 장소, 결제 방법을 안내합니다. 참가비는 10만 원입니다. 안내를 확인한 후 참여가 확정돼요.',link:'/apply',label:'참가 신청하러 가기'},
];
export function StudyGuide(){
 const [open,setOpen]=useState(false),[selected,setSelected]=useState<number|null>(null);
 const launcher=useRef<HTMLButtonElement>(null),close=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;close.current?.focus();const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);launcher.current?.focus();}};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);},[open]);
 const answer=selected===null?null:questions[selected];
 return <div className="study-guide">
  {open&&<aside id="study-guide-panel" role="dialog" aria-label="스터디 길잡이" className="guide-panel">
   <div className="guide-heading"><span><i/> CREAI+IT 길잡이</span><button ref={close} onClick={()=>{setOpen(false);launcher.current?.focus();}} aria-label="길잡이 닫기">×</button></div>
   <div className="guide-answer" aria-live="polite"><span className="guide-kicker">{answer?'궁금한 점부터, 하나씩.':'A LITTLE HELP, A GOOD START.'}</span><h2>{answer?answer.question:<>반가워요.<br/>무엇이 궁금하세요?</>}</h2><p>{answer?answer.answer:'처음 오셨다면, 여기서부터 알아가요. 스터디의 자주 묻는 질문을 모았어요.'}</p>{answer&&<a href={answer.link} onClick={()=>setOpen(false)}>{answer.label} ↗</a>}</div>
   <div className="guide-questions" aria-label="자주 묻는 질문">{questions.map((item,i)=><button key={item.question} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{item.question}<span aria-hidden="true">↗</span></button>)}</div>
   <p className="guide-note">운영 안내를 담은 길잡이 · 실시간 상담이 아닙니다</p>
  </aside>}
  <button ref={launcher} className="guide-launcher" aria-label={open?'스터디 길잡이 접기':'스터디 길잡이 열기'} aria-expanded={open} aria-controls="study-guide-panel" onClick={()=>setOpen(!open)}><span className="guide-label">{open?'다시 접어두기':'무엇이 궁금하세요?'}</span><img src="/landing/guide.svg" alt="" width="86" height="86"/></button>
 </div>;
}
