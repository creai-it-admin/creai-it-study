"use client";
import {useRef,useState} from 'react';
const steps=[
 {name:'질문을 꺼내고',label:'01 / FIND YOUR QUESTION',title:'“AI가 준 답,\n어디까지 믿어도 될까?”',body:'리서치를 맡겼는데 출처를 확인하는 데 더 오래 걸렸다면. 막연했던 불편함을, 함께 풀어볼 구체적인 질문으로 바꿉니다.',image:'/landing/field-notes.svg',alt:'원하는 결과와 확인할 기준을 정리하는 필드 노트',foot:'내가 원하는 결과 · 직접 확인할 기준'},
 {name:'함께 시도하고',label:'02 / THINK TOGETHER',title:'잘된 결과만큼,\n막힌 지점도 나눕니다.',body:'각자 해본 방법을 보여주고, 동료의 다른 관점을 만나고, 멘토와 다음 시도를 정합니다. 완벽한 답보다 더 나은 질문을 가지고 돌아갑니다.',image:'/landing/conversation.svg',alt:'막힌 지점을 나누고 함께 방법을 찾는 대화',foot:'개인의 시도 · 동료의 관점 · 멘토의 피드백'},
 {name:'내 것으로 남깁니다',label:'03 / MAKE IT YOURS',title:'한 번의 대화가,\n다음 시도의 출발점으로.',body:'배운 원리, 대화에서 나온 제안, 합의한 과제를 리포트로 돌아봅니다. HTML을 복사해 ChatGPT 등에 가져가 나의 상황에 맞게 더 질문할 수 있습니다.',image:'/landing/orbit.svg',alt:'서로 연결되며 이어지는 두 개의 고리',foot:'세션 리포트 · 다시 읽기 · 다음 업무에 적용'},
];
export function Experience(){
 const [active,setActive]=useState(0);const tabs=useRef<(HTMLButtonElement|null)[]>([]);const step=steps[active];
 return <div className="experience-content">
  <div className="experience-tabs" role="tablist" aria-label="스터디 경험">{steps.map((item,i)=><button key={item.name} ref={el=>{tabs.current[i]=el;}} id={`experience-tab-${i}`} role="tab" aria-selected={active===i} aria-controls={`experience-panel-${i}`} tabIndex={active===i?0:-1} onClick={()=>setActive(i)} onKeyDown={event=>{let next=active;if(event.key==='ArrowRight')next=(active+1)%steps.length;else if(event.key==='ArrowLeft')next=(active+steps.length-1)%steps.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=steps.length-1;else return;event.preventDefault();setActive(next);tabs.current[next]?.focus();}}><span>0{i+1}</span>{item.name}<b aria-hidden="true">↗</b></button>)}</div>
  <div key={active} id={`experience-panel-${active}`} role="tabpanel" aria-labelledby={`experience-tab-${active}`} tabIndex={0} className="experience-panel"><div><span className="eyebrow">{step.label}</span><h3>{step.title}</h3><p>{step.body}</p><div className="experience-foot">{step.foot}</div></div><div className={`experience-art experience-art-${active}`}><span className="sample-label">스터디 흐름을 보여주는 예시</span><img src={step.image} alt={step.alt} width="340" height="390"/></div></div>
 </div>;
}
