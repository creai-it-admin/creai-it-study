import {Easing} from 'remotion';

export type Ease = (x: number) => number;

// One motion vocabulary for the whole film.
export const E = {
  out: Easing.bezier(0.22, 1, 0.36, 1), // arrivals, reveals
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // camera travel
  soft: Easing.bezier(0.45, 0, 0.25, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45), // exits
  surge: Easing.bezier(0.86, 0, 0.12, 1), // the decisive dash
  linear: (x: number) => x,
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Eased value between t0 and t1, held outside the range. */
export const seg = (t: number, t0: number, t1: number, v0 = 0, v1 = 1, ease: Ease = E.out) => {
  if (t <= t0) return v0;
  if (t >= t1) return v1;
  return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
};

export type Key = {t: number; v: number[]; e?: Ease};

/** Piecewise track: equal neighbouring values hold, different values travel with the segment's ease. */
export const track = (t: number, keys: Key[]): number[] => {
  if (t <= keys[0].t) return keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (t <= b.t) {
      const p = (b.e ?? E.inOut)((t - a.t) / (b.t - a.t));
      return a.v.map((x, j) => x + (b.v[j] - x) * p);
    }
  }
  return keys[keys.length - 1].v;
};

/** Visibility window with eased fade in and out. */
export const win = (t: number, inAt: number, outAt = Infinity, fadeIn = 0.5, fadeOut = 0.5) =>
  Math.min(seg(t, inAt, inAt + fadeIn), 1 - seg(t, outAt, outAt + fadeOut, 0, 1, E.in));
