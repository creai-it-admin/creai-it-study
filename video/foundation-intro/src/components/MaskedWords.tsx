import React from 'react';
import {C, KR} from '../theme';
import {E, seg} from '../lib/time';

type Run = {text: string; em: boolean};
type Word = Run[];

/** `*...*` marks the operative phrase. Lines split on "\n", words on spaces (Korean reading units). */
const parse = (text: string): Word[][] => {
  let em = false;
  return text.split('\n').map((line) =>
    line.split(' ').map((word) => {
      const runs: Run[] = [];
      let buf = '';
      for (const ch of word) {
        if (ch === '*') {
          if (buf) runs.push({text: buf, em});
          buf = '';
          em = !em;
        } else buf += ch;
      }
      if (buf) runs.push({text: buf, em});
      return runs;
    }),
  );
};

type Props = {
  text: string;
  t: number;
  start: number;
  exit?: number;
  size: number;
  weight?: number;
  color?: string;
  emColor?: string;
  /** Time at which the operative phrase flares once. */
  emPulse?: number;
  lineHeight?: number;
  tracking?: number;
  stagger?: number;
  lineDelay?: number;
  dur?: number;
  align?: 'left' | 'center' | 'right';
  family?: string;
  style?: React.CSSProperties;
};

/** Words rise out of a mask, hold, then leave upward: reveal → emphasis → hold → handoff. */
export const MaskedWords: React.FC<Props> = ({
  text, t, start, exit, size, weight = 700, color = C.text, emColor = C.bright, emPulse,
  lineHeight = 1.18, tracking = -0.035, stagger = 0.055, lineDelay = 0.16, dur = 0.75,
  align = 'left', family = KR, style,
}) => {
  const lines = parse(text);
  if (t < start - 0.05 || (exit !== undefined && t > exit + 1.2)) return null;
  const pulse = emPulse === undefined ? 0 : seg(t, emPulse, emPulse + 0.35) * (1 - seg(t, emPulse + 0.35, emPulse + 1.4, 0, 1, E.soft));
  let n = 0;
  return (
    <div style={{fontFamily: family, fontSize: size, fontWeight: weight, lineHeight, letterSpacing: `${tracking}em`, color, textAlign: align, whiteSpace: 'nowrap', ...style}}>
      {lines.map((words, li) => (
        <div key={li}>
          {words.map((runs, wi) => {
            const begin = start + li * lineDelay + n++ * stagger;
            const inY = seg(t, begin, begin + dur, 108, 0, E.out);
            const outBegin = exit === undefined ? Infinity : exit + (n - 1) * 0.03;
            const outY = seg(t, outBegin, outBegin + 0.5, 0, -108, E.in);
            const rot = seg(t, begin, begin + dur, 4, 0, E.out);
            return (
              <span key={wi} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: size * 0.14, marginBottom: -size * 0.14, marginRight: wi < words.length - 1 ? '0.26em' : 0}}>
                <span style={{display: 'inline-block', transform: `translateY(${inY + outY}%) rotate(${rot}deg)`, transformOrigin: '0 100%'}}>
                  {runs.map((run, ri) => (
                    <span key={ri} style={run.em ? {color: emColor, textShadow: pulse > 0 ? `0 0 ${24 + 40 * pulse}px rgba(121,202,255,${0.55 * pulse})` : undefined} : undefined}>{run.text}</span>
                  ))}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
