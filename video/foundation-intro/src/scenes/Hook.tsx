import React from 'react';
import {random} from 'remotion';
import {MaskedWords} from '../components/MaskedWords';
import {E, seg} from '../lib/time';
import {TL, W} from '../lib/world';
import {C, KR} from '../theme';

// Real terms from the curriculum and the field; they are atmosphere, not claims.
const TERMS = [
  '코딩 에이전트', 'Claude Code', '서브에이전트', '새 모델', 'MCP', '컨텍스트', 'Codex', '스킬', '멀티모달',
  '추론 모델', '에이전트', '자동화', '프롬프트', '벤치마크', 'API', '워크플로', '오픈 모델', '툴 호출',
  '메모리', '컴퓨터 사용', '음성 모드', '이미지 생성', 'RAG', '파인튜닝', 'GPU', '토큰', '밸류체인',
  '데이터센터', '바이브 코딩', '에이전트 팀',
];
const LAYER = [
  {size: 28, alpha: 0.15, speed: 230, weight: 500, blur: 1.2},
  {size: 44, alpha: 0.3, speed: 430, weight: 500, blur: 0},
  {size: 68, alpha: 0.5, speed: 760, weight: 600, blur: 0},
];
const SPAN = 3200;
const X0 = -1600;

const h = TL.hook;
// How fast the flow runs: arrives, presses harder, nearly stops as the dot gathers, then falls behind.
const flow = (t: number) => {
  let k = seg(t, h.streamIn, h.streamIn + 1.2, 0, 1, E.soft) * seg(t, h.pressure[0], h.pressure[1], 1, 1.55, E.soft);
  k = seg(t, h.slow[0], h.slow[1], k, 0.1, E.out);
  return seg(t, h.surge[0], h.surge[0] + 0.6, k, 0.45, E.soft);
};
const STEPS = Math.ceil(12 * TL.fps);
const TAU = new Float64Array(STEPS + 1);
for (let i = 1; i <= STEPS; i++) TAU[i] = TAU[i - 1] + flow((i - 0.5) / TL.fps) / TL.fps;
const tau = (t: number) => {
  const f = Math.min(STEPS - 1, Math.max(0, t * TL.fps));
  const i = Math.floor(f);
  return TAU[i] + (TAU[i + 1] - TAU[i]) * (f - i);
};

// Each depth runs in its own lanes; words sharing a lane and speed keep even spacing, so they never collide.
const LANES = [[-120, -20, 90, 240, 360], [-150, 30, 300, 470], [-90, 205, 405]];
const WORDS = TERMS.map((text, i) => {
  const depth = i % 3;
  const lanes = LANES[depth];
  const lane = Math.floor(i / 3) % lanes.length;
  const inLane = Math.ceil(TERMS.length / 3 / lanes.length);
  const slot = Math.floor(Math.floor(i / 3) / lanes.length);
  return {
    text,
    layer: LAYER[depth],
    y: lanes[lane],
    x0: (random(`lane-${depth}-${lane}`) * SPAN + (slot * SPAN) / inLane) % SPAN,
    fadeAt: h.streamIn + random(`f-${i}`) * 0.9,
  };
});

export const HookStream: React.FC<{t: number}> = ({t}) => {
  if (t > 11.2) return null;
  const d = tau(t);
  const exit = 1 - seg(t, 9.5, 10.9, 0, 1, E.soft);
  return (
    <>
      {WORDS.map((w, i) => {
        const x = X0 + ((((w.x0 - w.layer.speed * d) % SPAN) + SPAN) % SPAN);
        const a = w.layer.alpha * seg(t, w.fadeAt, w.fadeAt + 0.6) * exit;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: w.y, fontFamily: KR, fontSize: w.layer.size, fontWeight: w.layer.weight,
            letterSpacing: '-0.02em', color: C.muted, opacity: a, whiteSpace: 'nowrap', filter: w.layer.blur ? `blur(${w.layer.blur}px)` : undefined}}>
            {w.text}
          </div>
        );
      })}
    </>
  );
};

export const HookLines: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', left: -800, top: -330}}>
    <MaskedWords t={t} text="AI는 계속 새로워집니다." start={h.line1In} exit={h.line1Out} size={84} />
    <div style={{position: 'absolute', left: 0, top: 0}}>
      <MaskedWords t={t} text="따라가기만 하면, 늘 한발 늦습니다." start={h.line2In} exit={h.line2Out} size={84} />
    </div>
  </div>
);

export {W};
