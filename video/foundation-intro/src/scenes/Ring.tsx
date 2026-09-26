import React from 'react';
import {MaskedWords} from '../components/MaskedWords';
import {clamp01, E, lerp, seg, win} from '../lib/time';
import {L, ringPoint, ROUTE_Y, Rp, TL, W, type Pt} from '../lib/world';
import {C, KR} from '../theme';

const g = TL.ring;
const u = TL.unroll;
const HALF = Math.PI * W.R; // length of each arc, and of each strand once unrolled

const pulse = (t: number, at: number) => (t < at ? 0 : Math.exp(-(t - at) * 3.2));

const Node: React.FC<{p: Pt; color: string; t: number; hits: number[]; alpha: number}> = ({p, color, t, hits, alpha}) => {
  const k = Math.max(...hits.map((h) => pulse(t, h)));
  return (
    <>
      <div style={{position: 'absolute', left: p.x - 40 - 30 * k, top: p.y - 40 - 30 * k, width: 80 + 60 * k, height: 80 + 60 * k, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}55 0%, ${color}00 70%)`, opacity: alpha}} />
      <div style={{position: 'absolute', left: p.x - 13, top: p.y - 13, width: 26, height: 26, borderRadius: '50%', background: color,
        boxShadow: `0 0 ${20 + 30 * k}px ${color}`, opacity: alpha, transform: `scale(${1 + 0.35 * k})`}} />
    </>
  );
};

const Label: React.FC<{t: number; start: number; title: string; role: string; color: string; side: 'left' | 'right'}> = ({t, start, title, role, color, side}) => {
  const out = g.out[0];
  const a = win(t, start + 0.35, out, 0.6, 0.45);
  return (
    <div style={{position: 'absolute', top: ROUTE_Y - 84, width: 520, textAlign: side === 'left' ? 'right' : 'left',
      ...(side === 'left' ? {left: L.x - 46 - 520} : {left: Rp.x + 46})}}>
      <MaskedWords t={t} text={title} start={start} exit={out} size={56} color={color} align={side === 'left' ? 'right' : 'left'} />
      <div style={{fontFamily: KR, fontSize: 30, fontWeight: 500, lineHeight: 1.45, letterSpacing: '-0.02em', color: C.muted, marginTop: 12,
        whiteSpace: 'pre', opacity: a, transform: `translateY(${(1 - a) * 12}px)`}}>
        {role}
      </div>
    </div>
  );
};

const arcTop = `M ${L.x} ${L.y} A ${W.R} ${W.R} 0 0 1 ${Rp.x} ${Rp.y}`;
const arcBottom = `M ${Rp.x} ${Rp.y} A ${W.R} ${W.R} 0 0 1 ${L.x} ${L.y}`;

/** Two understandings, joined into one loop. Shared world coordinates keep the loop and the route one object. */
export const Ring: React.FC<{t: number}> = ({t}) => {
  if (t < g.split[0] || t > u.roll[1] + 0.2) return null;
  const sp = seg(t, g.split[0], g.split[1], 0, 1, E.out);
  const nodeAlpha = 1 - seg(t, u.roll[0], u.roll[0] + 0.5, 0, 1, E.in);
  const top = seg(t, g.arcTop[0], g.arcTop[1], 0, 1, E.inOut);
  const bottom = seg(t, g.arcBottom[0], g.arcBottom[1], 0, 1, E.inOut);
  const arrows = (at: number) => seg(t, at - 0.1, at + 0.25) * (1 - seg(t, g.out[0], g.out[1]));
  const rolling = t >= u.roll[0];
  return (
    <>
      {!rolling && (
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
          <path d={arcTop} fill="none" stroke={C.knowledge} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - top} opacity={top > 0 ? 1 : 0} />
          <path d={arcBottom} fill="none" stroke={C.bright} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - bottom} opacity={bottom > 0 ? 1 : 0} />
          <polyline points={`${Rp.x - 11},${Rp.y - 38} ${Rp.x},${Rp.y - 24} ${Rp.x + 11},${Rp.y - 38}`} fill="none" stroke={C.knowledge} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={arrows(g.arcTop[1])} />
          <polyline points={`${L.x - 11},${L.y + 38} ${L.x},${L.y + 24} ${L.x + 11},${L.y + 38}`} fill="none" stroke={C.bright} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={arrows(g.arcBottom[1])} />
        </svg>
      )}
      <Node p={{x: lerp(W.C.x, L.x, sp), y: W.C.y}} color={C.knowledge} t={t} hits={[g.arcBottom[1], g.loop[1]]} alpha={nodeAlpha} />
      <Node p={{x: lerp(W.C.x, Rp.x, sp), y: W.C.y}} color={C.bright} t={t} hits={[g.arcTop[1], (g.loop[0] + g.loop[1]) / 2]} alpha={nodeAlpha} />
      <div style={{position: 'absolute', left: W.C.x - 440, top: W.C.y - 74, width: 880}}>
        <MaskedWords t={t} text={'변화를 이해하는 깊이와,\nAI를 활용하는 힘을 함께.'} start={g.titleIn} exit={g.out[0]} size={58} align="center" lineHeight={1.28} />
      </div>
      <Label t={t} start={g.labelsIn[0]} side="left" title="지식적 이해" role={'가능성과 한계를\n해석하는 근거'} color={C.knowledge} />
      <Label t={t} start={g.labelsIn[1]} side="right" title="활용에 대한 이해" role={'내 일에 적용하고\n검증하는 힘'} color={C.bright} />
      <div style={{position: 'absolute', left: W.C.x - 300, top: W.C.y - W.R - 70, width: 600}}>
        <MaskedWords t={t} text="판단의 근거 →" start={g.arcTopLabel} exit={g.out[0]} size={34} weight={600} color={C.knowledge} align="center" />
      </div>
      <div style={{position: 'absolute', left: W.C.x - 300, top: W.C.y + W.R + 26, width: 600}}>
        <MaskedWords t={t} text="← 경험으로 갱신" start={g.arcBottomLabel} exit={g.out[0]} size={34} weight={600} color={C.bright} align="center" />
      </div>
    </>
  );
};

/* ---------- Strands: the loop unrolls into the route ---------- */

const N = 96;
const unrolled = (which: 'top' | 'bottom', t: number): Pt[] => {
  const q = clamp01((t - u.roll[0]) / (u.roll[1] - u.roll[0]));
  const k = 0.75; // how far ahead the straightening front runs
  const pts: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const theta = which === 'top' ? Math.PI - Math.PI * s : Math.PI + Math.PI * s;
    const a = ringPoint(theta);
    const b = {x: L.x + s * HALF, y: ROUTE_Y + (which === 'top' ? -W.gap / 2 : W.gap / 2)};
    const p = E.inOut(clamp01(q * (1 + k) - k * s));
    pts.push({x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p)});
  }
  return pts;
};

const SWITCH = [4300, 4460]; // week 4 is where knowledge takes the lead
const emphasis = (x: number) => clamp01((x - SWITCH[0]) / (SWITCH[1] - SWITCH[0]));

const band = (y: number, x0: number, x1: number, width: (x: number) => number) => {
  const xs: number[] = [];
  for (let x = x0; x < x1; x += 40) xs.push(x);
  xs.push(x1);
  const up = xs.map((x) => `${x},${y - width(x) / 2}`);
  const down = xs.reverse().map((x) => `${x},${y + width(x) / 2}`);
  return `M ${up.join(' L ')} L ${down.join(' L ')} Z`;
};

export const Strands: React.FC<{t: number}> = ({t}) => {
  if (t < u.roll[0]) return null;
  const upperY = ROUTE_Y - W.gap / 2;
  const lowerY = ROUTE_Y + W.gap / 2;
  if (t < u.roll[1]) {
    const line = (pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');
    return (
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
        <polyline points={line(unrolled('top', t))} fill="none" stroke={C.knowledge} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={line(unrolled('bottom', t))} fill="none" stroke={C.bright} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  const len = seg(t, u.extend[0], u.extend[1], HALF, W.routeEnd - L.x, E.inOut);
  const v = seg(t, u.variance[0], u.variance[1], 0, 1, E.inOut);
  const x1 = L.x + len;
  const know = (x: number) => 4 + v * lerp(-0.5, 6, emphasis(x));
  const use = (x: number) => 4 + v * lerp(6, -0.5, emphasis(x));
  const beyond = seg(t, u.extend[1] - 0.2, u.extend[1] + 0.8);
  const swell = (at: number) => seg(t, at, at + 0.35) * (1 - seg(t, at + 0.35, at + 2.2, 0, 1, E.soft));
  const glowUse = swell(TL.route.arrive[0] + 0.2);
  const glowKnow = swell(TL.route.arrive[3] + 0.2);
  const dashes = (y: number, color: string) => (
    <line x1={W.routeEnd + 24} y1={y} x2={W.beyondEnd + 600} y2={y} stroke={color} strokeWidth={3} strokeDasharray="18 22" strokeLinecap="round" opacity={beyond} />
  );
  // In the finale the two strands fuse into the foundation that replaces them.
  const fused = 1 - seg(t, TL.beyond.blocks[0], TL.beyond.lock, 0, 1, E.soft);
  if (fused <= 0) return null;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: fused}} width={1} height={1}>
      <defs>
        <linearGradient id="fadeRight" gradientUnits="userSpaceOnUse" x1={W.routeEnd} x2={W.beyondEnd + 600} y1={0} y2={0}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.55} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id="beyondMask" maskUnits="userSpaceOnUse" x={W.routeEnd} y={ROUTE_Y - 100} width={3000} height={200}>
          <rect x={W.routeEnd} y={ROUTE_Y - 100} width={3000} height={200} fill="url(#fadeRight)" />
        </mask>
      </defs>
      <path d={band(upperY, L.x, x1, (x) => know(x) + 12)} fill={C.knowledge} opacity={0.08} />
      <path d={band(lowerY, L.x, x1, (x) => use(x) + 12)} fill={C.bright} opacity={0.1} />
      <path d={band(upperY, L.x, x1, know)} fill={C.knowledge} />
      <path d={band(lowerY, L.x, x1, use)} fill={C.bright} />
      {/* On arrival, the strand that leads this stretch of weeks glows along its length. */}
      {glowUse > 0.01 && <path d={band(lowerY, W.weekStart[0], W.weekStart[3], (x) => use(x) + 14)} fill={C.bright} opacity={0.5 * glowUse} />}
      {glowKnow > 0.01 && <path d={band(upperY, W.weekStart[3], W.weekEnd, (x) => know(x) + 14)} fill={C.knowledge} opacity={0.5 * glowKnow} />}
      <g mask="url(#beyondMask)">
        {dashes(upperY, C.knowledge)}
        {dashes(lowerY, C.bright)}
      </g>
    </svg>
  );
};

export {HALF};
