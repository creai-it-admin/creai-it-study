import React from 'react';
import {Img, staticFile} from 'remotion';
import {MaskedWords} from '../components/MaskedWords';
import {E, seg} from '../lib/time';
import {L, ROUTE_Y, TL} from '../lib/world';
import {C} from '../theme';

const end = TL.ending.worldOut;

export const Background: React.FC<{t: number}> = ({t}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(1400px 900px at 50% 30%, #11284a 0%, ${C.navy} 55%, ${C.deep} 100%)`}} />
    {/* The last frame is the OT cover's flat ink, so the deck can follow without a seam. */}
    <div style={{position: 'absolute', inset: 0, background: C.cover, opacity: seg(t, end[0], end[1], 0, 1, E.soft)}} />
  </>
);

/** A faint world grid: it is what makes camera travel legible between subjects. */
export const Grid: React.FC = () => (
  <div style={{position: 'absolute', left: -2400, top: -1400, width: 11200, height: 4400, opacity: 0.14,
    backgroundImage: 'radial-gradient(circle, #afc8df 1.8px, transparent 2.3px)', backgroundSize: '90px 90px'}} />
);

export const Vignette: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 1 - seg(t, end[0], end[1]),
    background: 'radial-gradient(ellipse 75% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(2,6,14,0.55) 100%)'}} />
);

export const Grain: React.FC<{frame: number}> = ({frame}) => (
  <Img src={staticFile(`grain-${Math.floor(frame / 2) % 6}.png`)}
    style={{position: 'absolute', inset: 0, width: 1920, height: 1080, opacity: 0.05, mixBlendMode: 'overlay', pointerEvents: 'none'}} />
);

/** The promise of the route, written as it unrolls. */
export const RouteHeading: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', left: L.x, top: ROUTE_Y - 470}}>
    <MaskedWords t={t} text={'AI를 쓰기 시작하는 데서,\n계속 더 잘 활용하는 사람으로.'} start={TL.unroll.headingIn} exit={TL.unroll.headingOut} size={80} lineHeight={1.22} />
  </div>
);
