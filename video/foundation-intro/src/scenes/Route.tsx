import React from 'react';
import {MaskedWords} from '../components/MaskedWords';
import {E, seg, win} from '../lib/time';
import {dotWorld, ROUTE_Y, TL, W} from '../lib/world';
import {C, EN, KR} from '../theme';

// Week names follow the landing/apply pages; questions follow the OT roadmap.
const WEEKS = [
  {n: '01', name: '도구 이해', q: 'AI는 어디까지,\n나는 어디서부터?', a: '최신 도구의 가능성과 한계, 핵심 기능을 익힙니다.'},
  {n: '02', name: '업무 설계', q: '더 큰 일을,\nAI와 함께 하려면?', a: '목표·맥락·역할·검토 지점을 설계합니다.'},
  {n: '03', name: '활용 범위 확장', q: '모델이 좋아질 때,\n나도 더 잘 쓰려면?', a: '어려운 일을 맡기며 배우고, 활용 방식을 계속 갱신합니다.'},
  {n: '04', name: '기술·산업 이해', q: '새로운 지식을\n내 기회로 바꾸려면?', a: '기술 원리·밸류체인·협상력으로 변화를 읽습니다.'},
];
const r = TL.route;
const pb = TL.pullback;

export const Stations: React.FC<{t: number}> = ({t}) => {
  if (t < TL.unroll.extend[1] - 0.4 || t > TL.ending.worldOut[1]) return null;
  return (
    <>
      {WEEKS.map((w, i) => {
        const a = r.arrive[i];
        const leave = i < 3 ? r.depart[i + 1] : pb.move[0];
        // Spent stations recede to context; the overview restores them together.
        let dim = seg(t, leave, leave + 0.6, 1, 0.3, E.soft);
        dim = seg(t, pb.move[0], pb.move[0] + 1, dim, 0.95, E.soft);
        dim = seg(t, TL.beyond.move[0], TL.beyond.move[0] + 0.7, dim, 0, E.soft);
        const marker = seg(t, TL.unroll.extend[1] - 0.4, TL.unroll.extend[1] + 0.4, 0, 0.45);
        const lit = seg(t, a - 0.08, a + 0.25);
        const tick = seg(t, a - 0.02, a + 0.4, 0, 1, E.out);
        const hit = t < a ? 0 : Math.exp(-(t - a) * 3);
        const labelIn = seg(t, a + 0.05, a + 0.55, 0, 1, E.out);
        // Answers are for the close view; the overview keeps only the questions.
        const answer = seg(t, a + 0.75, a + 1.3, 0, 1, E.out) * (1 - seg(t, pb.move[0], pb.move[0] + 0.8));
        const x = W.S[i];
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: x - 9 - 14 * hit, top: ROUTE_Y - 9 - 14 * hit, width: 18 + 28 * hit, height: 18 + 28 * hit, borderRadius: '50%',
              border: `2px solid ${C.text}`, background: lit > 0.5 ? C.text : 'transparent', opacity: Math.max(marker, lit) * (lit > 0 ? dim : 1),
              boxShadow: hit > 0.01 ? `0 0 ${40 * hit}px rgba(243,249,255,${0.7 * hit})` : undefined}} />
            <div style={{position: 'absolute', left: x - 1, top: ROUTE_Y - 20 - 140 * tick, width: 2, height: 140 * tick, background: C.muted, opacity: dim}} />
            {t >= a - 0.1 && (
              <div style={{position: 'absolute', left: x, top: ROUTE_Y - 560, width: 900, opacity: dim}}>
                <div style={{display: 'flex', alignItems: 'baseline', gap: 18, opacity: labelIn, transform: `translateX(${(1 - labelIn) * -24}px)`}}>
                  <span style={{fontFamily: EN, fontSize: 42, fontWeight: 600, color: C.bright, letterSpacing: '-0.01em'}}>{w.n}</span>
                  <span style={{fontFamily: KR, fontSize: 40, fontWeight: 700, color: C.text, letterSpacing: '-0.03em'}}>{w.name}</span>
                </div>
                <div style={{marginTop: 22}}>
                  <MaskedWords t={t} text={w.q} start={a + 0.18} size={78} lineHeight={1.2} />
                </div>
                <div style={{marginTop: 26, width: 780, fontFamily: KR, fontSize: 32, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: C.muted,
                  opacity: answer, transform: `translateY(${(1 - answer) * 14}px)`}}>
                  {w.a}
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

/* ---------- Weeks 3–4: the personal project runs alongside ---------- */

const pj = TL.project;
const BRANCH_Y = ROUTE_Y + 230;
const MARKS = [4000, 4600, 5100];
const branchPath = `M ${W.weekStart[2]} ${ROUTE_Y + W.gap / 2} C ${W.weekStart[2] + 110} ${ROUTE_Y + 20}, ${W.weekStart[2] + 150} ${BRANCH_Y}, ${W.weekStart[2] + 290} ${BRANCH_Y} L ${W.weekEnd} ${BRANCH_Y}`;

export const Project: React.FC<{t: number}> = ({t}) => {
  if (t < pj.branch[0] || t > TL.beyond.move[0] + 0.8) return null;
  const fade = 1 - seg(t, TL.beyond.move[0], TL.beyond.move[0] + 0.7, 0, 1, E.soft);
  const draw = seg(t, pj.branch[0], pj.branch[1], 0, 1, E.inOut);
  const dotX = dotWorld(t).x;
  const moving = t > r.depart[3] - 0.2 && t < r.arrive[3] + 0.4 ? 1 : 0;
  const sub = win(t, pj.labelIn + 0.4, Infinity, 0.6);
  const result = seg(t, pj.resultIn, pj.resultIn + 0.45, 0, 1, E.out);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: fade}}>
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
        <path d={branchPath} fill="none" stroke={C.me} strokeWidth={18} strokeLinecap="round" opacity={0.14} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        <path d={branchPath} fill="none" stroke={C.me} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
      </svg>
      {MARKS.map((mx, i) => {
        const pop = seg(t, pj.marks[i], pj.marks[i] + 0.35, 0, 1, E.out);
        const near = moving * Math.max(0, 1 - Math.abs(dotX - mx) / 160);
        return (
          <div key={mx} style={{position: 'absolute', left: mx - 11, top: BRANCH_Y - 11, width: 22, height: 22, background: C.me,
            transform: `rotate(45deg) scale(${pop * (1 + 0.5 * near)})`, boxShadow: `0 0 ${16 + 40 * near}px ${C.me}`}} />
        );
      })}
      <div style={{position: 'absolute', left: W.weekEnd - 15 - 10 * result, top: BRANCH_Y - 15 - 10 * result, width: 30 + 20 * result, height: 30 + 20 * result,
        borderRadius: '50%', border: `3px solid ${C.me}`, opacity: result}} />
      <div style={{position: 'absolute', left: W.weekEnd + 36, top: BRANCH_Y - 22, fontFamily: KR, fontSize: 32, fontWeight: 600, color: C.me, opacity: result, whiteSpace: 'nowrap'}}>
        결과물
      </div>
      <div style={{position: 'absolute', left: W.weekStart[2] + 300, top: BRANCH_Y + 36}}>
        <MaskedWords t={t} text="나만의 프로젝트" start={pj.labelIn} size={50} color={C.me} />
        <div style={{marginTop: 10, fontFamily: KR, fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', color: C.muted, whiteSpace: 'nowrap',
          opacity: sub, transform: `translateY(${(1 - sub) * 12}px)`}}>
          3–4주차 병행 · 튜터 피드백으로 결과물까지
        </div>
      </div>
    </div>
  );
};

/* ---------- The whole route at once ---------- */

export const Overview: React.FC<{t: number}> = ({t}) => {
  if (t < pb.labelsIn || t > pb.factsOut + 0.8) return null;
  const a = win(t, pb.labelsIn, pb.factsOut, 0.6, 0.5);
  const b = win(t, pb.labelsIn + 0.25, pb.factsOut, 0.6, 0.5);
  const style = (o: number): React.CSSProperties => ({position: 'absolute', top: ROUTE_Y + 56, fontFamily: KR, fontSize: 84, fontWeight: 700,
    letterSpacing: '-0.03em', whiteSpace: 'nowrap', opacity: o, transform: `translateY(${(1 - o) * 20}px)`});
  return (
    <>
      <div style={{...style(a), left: W.weekStart[0], color: C.bright}}>1–3주 · 활용 중심</div>
      <div style={{...style(b), left: W.weekStart[3] + 40, color: C.knowledge}}>4주 · 지식 중심</div>
    </>
  );
};

/** Screen-space fact line under the overview. */
export const Facts: React.FC<{t: number}> = ({t}) => {
  const a = win(t, pb.factsIn, pb.factsOut, 0.6, 0.5);
  if (a <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 956, textAlign: 'center', fontFamily: KR, fontSize: 40, fontWeight: 600,
      letterSpacing: '-0.02em', color: C.text, opacity: a, transform: `translateY(${(1 - a) * 16}px)`}}>
      4주 <span style={{color: C.faint}}>·</span> 주 1회 <span style={{color: C.faint}}>·</span> 회당 2시간 <span style={{color: C.faint}}>·</span> 소규모 교육
    </div>
  );
};

const bd = TL.beyond;
export const Beyond: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', left: W.routeEnd + 190, top: ROUTE_Y - 470}}>
    <MaskedWords t={t} text="4주는, *시작*입니다." start={bd.lineIn} exit={bd.lineOut} size={116} />
  </div>
);
