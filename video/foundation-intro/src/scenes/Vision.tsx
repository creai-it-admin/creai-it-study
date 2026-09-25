import React from 'react';
import {MaskedWords} from '../components/MaskedWords';
import {E, seg} from '../lib/time';
import {dotWorld, TL, W} from '../lib/world';
import {C} from '../theme';

const v = TL.vision;
const u = W.underline;

/** The dash leaves a trail; the trail settles as the underline the vision is written on. */
export const Trail: React.FC<{t: number}> = ({t}) => {
  if (t < TL.hook.surge[0] || t > v.out + 0.9) return null;
  const head = t < TL.hook.surge[1] ? dotWorld(t).x : u.x1;
  let tail = seg(t, 10.35, 11.3, W.hookDrift, u.x0, E.inOut);
  tail = seg(t, v.out - 0.05, v.out + 0.45, tail, u.x1, E.in);
  const glow = 1 - seg(t, TL.hook.surge[1], TL.hook.surge[1] + 1.2, 0, 0.6, E.soft);
  if (head - tail < 1) return null;
  return (
    <div style={{position: 'absolute', left: tail, top: u.y - 1.5, width: head - tail, height: 3, borderRadius: 2,
      background: `linear-gradient(90deg, rgba(56,189,248,0) 0%, ${C.me} 22%, ${C.me} 100%)`,
      boxShadow: `0 0 ${18 * glow}px rgba(56,189,248,${0.8 * glow})`}} />
  );
};

export const Vision: React.FC<{t: number}> = ({t}) => (
  <>
    <div style={{position: 'absolute', left: u.x0, top: -262}}>
      <MaskedWords t={t} text={'AI 시대를 이끄는,\n*압도적인 인재로.*'} start={v.line1In} lineDelay={v.line2In - v.line1In}
        exit={v.out} emPulse={v.emphasis} size={148} tracking={-0.038} />
    </div>
    <div style={{position: 'absolute', left: u.x0, top: u.y + 44}}>
      <MaskedWords t={t} text="그 성장의 기반을 다지는 4주." start={v.subIn} exit={v.out} size={50} weight={500} color={C.muted} tracking={-0.02} />
    </div>
  </>
);
