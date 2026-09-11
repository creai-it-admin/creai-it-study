"use client";
import {useEffect,useRef,useState} from 'react';
const questions=[
 {question:'AI를 잘 몰라도 괜찮나요?',answer:'도구를 많이 아는 것보다, 직접 해보고 싶은 일이 있는지가 중요해요. 기초 원리부터 배우고 자신의 과제에 적용합니다. 노트북과 함께 풀어보고 싶은 질문을 가져오세요.',link:'#experience',label:'스터디 경험 살펴보기'},
 {question:'모임은 어떻게 진행되나요?',answer:'0기는 6명이 함께하는 4회 대면 스터디예요. 토요일 오전 10시부터 12시까지, 신촌에서 만납니다. 원리를 배우고, 직접 시도하고, 막힌 지점을 함께 이야기해요.',link:'#join',label:'0기 운영 안내 보기'},
 {question:'끝나고 어떤 기록이 남나요?',answer:'인클래스에서 작성한 내용과 세션의 대화가 남아요. 멤버는 자신의 스터디에서 녹음·전사본·HTML 리포트를 확인하고, 리포트를 복사해 다시 질문하며 복습할 수 있어요.',link:'#records',label:'리포트 예시 보기'},
 {question:'어떻게 참여할 수 있나요?',answer:'현재는 0기를 준비하고 있어요. 다음 기수 모집은 추후 안내할 예정이며, 이 페이지에서는 신규 참가 신청을 받지 않습니다. 이미 배정된 멤버라면 로그인 후 내 스터디로 들어가세요.',link:'/routes',label:'내 스터디로 이동'},
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
