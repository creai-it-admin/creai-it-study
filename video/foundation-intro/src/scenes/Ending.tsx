import React from 'react';
import {measureText} from '@remotion/layout-utils';
import {DotGlyph} from '../components/Dot';
import {MaskedWords} from '../components/MaskedWords';
import {E, seg, win} from '../lib/time';
import {camera, dotWorld, project, TL} from '../lib/world';
import {C, KR} from '../theme';

// OT cover (1600×900) scaled ×1.2 to 1920×1080: edge 80, top 56, brand 32, display 104, sub 34, rule 100×3 at bottom 100.
const K = 1.2;
const EDGE = 80 * K;
const TOP = 56 * K;
const BRAND = 32 * K;
const BRAND_TRACK = -1.6 * K;
const MICRO = 18 * K;
const e = TL.ending;

const brandWidth = (text: string) =>
  measureText({text, fontFamily: 'Pretendard', fontWeight: '800', fontSize: BRAND, letterSpacing: `${BRAND_TRACK}px`}).width;

/** The dot flies home and becomes the + of CREAI+IT; the frame settles on the OT cover. */
export const Ending: React.FC<{t: number}> = ({t}) => {
  if (t < e.flight[0]) return null;
  const wCreai = brandWidth('CREAI');
  const wPlus = brandWidth('+');
  const lineH = BRAND * 1.2;
  const target = {x: EDGE + wCreai + wPlus / 2, y: TOP + lineH / 2 + BRAND * 0.02};

  const from = project(dotWorld(e.flight[0]), camera(e.flight[0]));
  const p = E.inOut(Math.min(1, (t - e.flight[0]) / (e.flight[1] - e.flight[0])));
  const ctrl = {x: from.x + (target.x - from.x) * 0.45, y: Math.min(from.y, target.y) - 240};
  const q = 1 - p;
  const pos = {x: q * q * from.x + 2 * q * p * ctrl.x + p * p * target.x, y: q * q * from.y + 2 * q * p * ctrl.y + p * p * target.y};
  const landed = t >= e.flight[1];
  const morph = seg(t, e.brandIn, e.brandIn + 0.4, 0, 1, E.out);
  const ring = t < e.brandIn ? 0 : Math.exp(-(t - e.brandIn) * 2.6);
  const left = seg(t, e.brandIn + 0.05, e.brandIn + 0.6, 0, 1, E.out);
  const right = seg(t, e.brandIn + 0.12, e.brandIn + 0.7, 0, 1, E.out);
  const label = win(t, e.labelIn, Infinity, 0.7);
  const sub = win(t, e.subIn, Infinity, 0.8);
  const rule = seg(t, e.ruleIn[0], e.ruleIn[1], 0, 1, E.out);

  return (
    <>
      {/* Brand, grown outward from the + */}
      <div style={{position: 'absolute', left: EDGE, top: TOP, height: lineH, display: 'flex', alignItems: 'baseline', fontFamily: KR, fontWeight: 800,
        fontSize: BRAND, letterSpacing: `${BRAND_TRACK}px`, color: C.text, lineHeight: 1.2, whiteSpace: 'nowrap'}}>
        <span style={{clipPath: `inset(0 0 0 ${(1 - left) * 100}%)`}}>CREAI</span>
        <span style={{color: C.bright, opacity: morph, display: 'inline-block', transform: `scale(${1.9 - 0.9 * morph})`}}>+</span>
        <span style={{clipPath: `inset(0 ${(1 - right) * 100}% 0 0)`}}>
          IT<small style={{fontSize: MICRO, fontWeight: 500, letterSpacing: `${3 * K}px`, marginLeft: 16 * K}}>EDU</small>
        </span>
      </div>
      <div style={{position: 'absolute', right: EDGE, top: TOP, height: lineH, display: 'flex', alignItems: 'center', fontFamily: KR, fontSize: MICRO,
        fontWeight: 500, letterSpacing: `${2 * K}px`, color: C.muted, opacity: label}}>
        FOUNDATION EDUCATION
      </div>

      {!landed || morph < 1 ? (
        <DotGlyph x={pos.x} y={pos.y} core={10 - 4 * p} glow={1 - 0.4 * p} alpha={1 - morph} />
      ) : null}
      {ring > 0.01 && (
        <div style={{position: 'absolute', left: target.x - 14 - 70 * (1 - ring), top: target.y - 14 - 70 * (1 - ring), width: 28 + 140 * (1 - ring),
          height: 28 + 140 * (1 - ring), borderRadius: '50%', border: `2px solid ${C.bright}`, opacity: ring * 0.8}} />
      )}

      <div style={{position: 'absolute', left: EDGE, top: 286 * K}}>
        <MaskedWords t={t} text={'AI 시대를 이끄는,\n*압도적인 인재로.*'} start={e.heroIn[0]} lineDelay={e.heroIn[1] - e.heroIn[0]}
          size={104 * K} tracking={-4 / 104} emPulse={e.heroIn[1] + 0.7} />
      </div>
      <div style={{position: 'absolute', left: EDGE, top: 594 * K, fontFamily: KR, fontSize: 34 * K, fontWeight: 500, letterSpacing: '-0.02em',
        color: C.muted, opacity: sub, transform: `translateY(${(1 - sub) * 14}px)`}}>
        그 성장의 기반을 다지는 4주.
      </div>
      <div style={{position: 'absolute', left: EDGE, bottom: 100 * K, width: 100 * K * rule, height: 3 * K, background: C.bright}} />
    </>
  );
};
