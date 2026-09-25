import React from 'react';
import {clamp01, seg} from '../lib/time';
import {camera, dotSpeed, dotWorld, project, TL} from '../lib/world';
import {C} from '../theme';

const BURSTS = [TL.hook.surge[1], TL.ring.loop[1], ...TL.route.arrive];
const decay = (t: number, at: number, rate = 3) => (t < at ? 0 : Math.exp(-(t - at) * rate));

/** The protagonist, drawn in screen space so it keeps its size while the camera zooms. */
export const DotGlyph: React.FC<{x: number; y: number; core?: number; glow?: number; alpha?: number}> = ({x, y, core = 10, glow = 1, alpha = 1}) => (
  <>
    <div style={{position: 'absolute', left: x - 70 * glow, top: y - 70 * glow, width: 140 * glow, height: 140 * glow, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(56,189,248,0.42) 0%, rgba(56,189,248,0.12) 38%, rgba(56,189,248,0) 70%)', opacity: alpha}} />
    <div style={{position: 'absolute', left: x - core, top: y - core, width: core * 2, height: core * 2, borderRadius: '50%', background: C.text,
      boxShadow: `0 0 ${core * 1.6}px ${C.me}, 0 0 ${core * 4}px rgba(56,189,248,0.8)`, opacity: alpha}} />
  </>
);

export const Dot: React.FC<{t: number}> = ({t}) => {
  const d = dotWorld(t);
  if (!d.visible) return null;
  const p = project(d, camera(t));
  const appear = seg(t, TL.hook.dotIn, TL.hook.dotIn + 0.5);
  const [g0, g1] = TL.hook.gather;
  const charge = seg(t, g0, g1) * (1 - seg(t, TL.hook.surge[0], TL.hook.surge[0] + 0.12));
  const burst = Math.max(...BURSTS.map((b) => decay(t, b)));
  const trail = clamp01((dotSpeed(t) - 500) / 2200);
  const history = trail > 0.01 ? Array.from({length: 14}, (_, k) => project(dotWorld(t - (k + 1) * 0.011), camera(t - (k + 1) * 0.011))) : [];
  return (
    <>
      {history.length > 0 && (
        <svg style={{position: 'absolute', inset: 0, overflow: 'visible'}} width={1920} height={1080}>
          {history.map((q, k) => {
            const prev = k === 0 ? p : history[k - 1];
            return <line key={k} x1={prev.x} y1={prev.y} x2={q.x} y2={q.y} stroke={C.me} strokeLinecap="round"
              strokeWidth={16 * (1 - k / 14)} opacity={trail * 0.85 * (1 - k / 14)} />;
          })}
        </svg>
      )}
      {charge > 0 && (
        <div style={{position: 'absolute', left: p.x - (110 - 86 * charge), top: p.y - (110 - 86 * charge), width: 2 * (110 - 86 * charge),
          height: 2 * (110 - 86 * charge), borderRadius: '50%', border: `2px solid ${C.me}`, opacity: 0.8 * Math.sin(Math.PI * charge)}} />
      )}
      {burst > 0.01 && (
        <div style={{position: 'absolute', left: p.x - 20 - 90 * (1 - burst), top: p.y - 20 - 90 * (1 - burst), width: 40 + 180 * (1 - burst),
          height: 40 + 180 * (1 - burst), borderRadius: '50%', border: `2px solid ${C.me}`, opacity: burst * 0.7}} />
      )}
      <DotGlyph x={p.x} y={p.y} core={10 + 3 * charge + 3 * burst} glow={1 + 0.5 * charge + 0.4 * burst} alpha={appear} />
    </>
  );
};
