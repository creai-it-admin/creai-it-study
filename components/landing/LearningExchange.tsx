'use client';

import { useEffect, useRef, useState } from 'react';

const steps = [
  { label: '각자의 시도', title: '“자료 조사를 맡겼는데, 출처가 섞였어요.”', body: '잘된 결과만 가져오지 않습니다. 맡겨본 일과 막힌 지점이 대화의 출발점이 됩니다.' },
  { label: '함께 검토', title: '“어느 단계에서 확인했어야 했을까요?”', body: '서로의 작업 과정을 살피고, 다른 방식으로 접근했던 경험과 검토 기준을 나눕니다.' },
  { label: '모두의 다음 시도', title: '“다음에는 1차 자료를 확인하는 단계를 넣어볼게요.”', body: '한 사람의 시행착오가 다른 사람의 판단을 바꿉니다. 배운 기준을 각자의 일에서 다시 시험합니다.' },
];

export function LearningExchange() {
  const root = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [foreground, setForeground] = useState(true);
  const running = visible && foreground && !paused && !reduced;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const preference = () => setReduced(media.matches);
    const visibility = () => setForeground(!document.hidden);
    preference();
    visibility();
    media.addEventListener('change', preference);
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    if (root.current) observer.observe(root.current);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', preference);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setStep(value => (value + 1) % steps.length), 6000);
    return () => window.clearInterval(timer);
  }, [running, step]);

  return <div className="learning-exchange" ref={root} data-stage={step} data-running={running}>
    <div className="exchange-topline"><span>한 사람의 경험이, 모두의 다음 시도로.</span><span>THE SHARED LEARNING LOOP</span></div>
    <div className="exchange-art" aria-hidden="true">
      <div className="exchange-labels"><span>각자의 경험</span><span>대화와 검토</span><span>넓어진 가능성</span></div>
      <svg viewBox="0 0 1000 290" fill="none">
        <g className="exchange-input">
          {Array.from({ length: 18 }, (_, i) => {
            const y = 30 + i * 13;
            const d = `M 5 ${y} C 220 ${y}, 260 ${138 + i * 1.4}, 470 ${138 + i * 1.4}`;
            return <g key={i}><path d={d} className="exchange-thread"/><path d={d} className="exchange-signal" pathLength="1" style={{ animationDelay: `${i * -0.22}s` }}/></g>;
          })}
        </g>
        <g className="exchange-output">
          {Array.from({ length: 32 }, (_, i) => {
            const y = 12 + i * 8.4;
            const d = `M 530 ${138 + i * 0.8} C 720 ${138 + i * 0.8}, 755 ${y}, 995 ${y}`;
            return <g key={i}><path d={d} className="exchange-thread"/><path d={d} className="exchange-signal" pathLength="1" style={{ animationDelay: `${i * -0.17}s` }}/></g>;
          })}
        </g>
        <g className="exchange-junction"><path d="M 486 150 H 514 M 500 136 V 164" strokeWidth="3"/><circle cx="500" cy="150" r="38" strokeWidth="0.7"/><circle className="exchange-ring" cx="500" cy="150" r="53" strokeWidth="0.5"/></g>
      </svg>
    </div>
    <div className="exchange-controls" role="group" aria-label="커뮤니티 배움의 흐름">
      {steps.map((item, i) => <button key={item.label} type="button" aria-pressed={step === i} aria-controls="exchange-example" onClick={() => { setStep(i); setPaused(true); }}><span>0{i + 1}</span>{item.label}<i aria-hidden="true" /></button>)}
      {!reduced && <button className="exchange-pause" type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? '배움의 흐름 자동 재생' : '배움의 흐름 일시정지'}>{paused ? '재생 ▷' : '정지 Ⅱ'}</button>}
    </div>
    <div className="exchange-example" id="exchange-example" aria-live={paused ? 'polite' : 'off'}>
      <span>대화 예시</span><div key={step}><h3>{steps[step].title}</h3><p>{steps[step].body}</p></div>
    </div>
  </div>;
}

export function UnderstandingArt() {
  return <div className="understanding-art" aria-hidden="true">
    <svg viewBox="0 0 1160 260" fill="none">
      {Array.from({ length: 22 }, (_, i) => <g key={i}>
        <path d={`M -10 ${30 + i * 9} C 340 ${30 + i * 9}, 550 ${260 - i * 9}, 1170 ${260 - i * 9}`} stroke="currentColor" strokeWidth="0.6"/>
        <path d={`M -10 ${260 - i * 9} C 490 ${260 - i * 9}, 820 ${30 + i * 9}, 1170 ${30 + i * 9}`} stroke="currentColor" strokeWidth="0.6"/>
      </g>)}
    </svg>
    <div><span>이해</span><i>×</i><span>활용</span></div>
  </div>;
}
