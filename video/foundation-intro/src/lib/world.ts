import TL from '../timeline.json';
import {E, lerp, seg, track, type Key} from './time';

export {TL};

/**
 * One world, one protagonist. Every scene lives at fixed world coordinates; the camera
 * travels between them, so the dot's journey is continuous by construction.
 */
export const W = {
  hookDot: {x: -420, y: 150},
  hookDrift: -640,
  underline: {x0: 840, x1: 2280, y: 150},
  C: {x: 1560, y: 1500}, // ring centre
  R: 380,
  gap: 30, // distance between the two strands
  weekStart: [1380, 2380, 3380, 4380],
  S: [1880, 2880, 3880, 4880], // station ticks
  weekEnd: 5380,
  routeEnd: 5500,
  beyondEnd: 7600,
};

export const L = {x: W.C.x - W.R, y: W.C.y}; // knowledge node, later the route start
export const Rp = {x: W.C.x + W.R, y: W.C.y}; // application node
export const ROUTE_Y = W.C.y;

export type Cam = {cx: number; cy: number; z: number};
export type Pt = {x: number; y: number};

const r = TL.route;
const camKeys: Key[] = [
  {t: 0, v: [0, 0, 1]},
  {t: TL.hook.pressure[0], v: [0, 0, 1]},
  {t: 8.6, v: [0, -10, 1.035], e: E.soft},
  {t: TL.hook.surge[0], v: [0, -10, 1.035]},
  {t: 10.9, v: [1560, 0, 1], e: E.surge},
  {t: TL.ring.descend[0] - 0.05, v: [1560, 0, 1]},
  {t: TL.ring.split[0] + 0.1, v: [1560, 1500, 1]},
  {t: TL.unroll.roll[0], v: [1560, 1500, 1]},
  {t: TL.unroll.roll[1], v: [1900, 1390, 0.78]},
  {t: r.depart[0], v: [1900, 1390, 0.78]},
  {t: r.arrive[0], v: [W.S[0] + 300, 1290, 0.95]},
  {t: r.depart[1], v: [W.S[0] + 300, 1290, 0.95]},
  {t: r.arrive[1], v: [W.S[1] + 300, 1290, 0.95]},
  {t: r.depart[2], v: [W.S[1] + 300, 1290, 0.95]},
  {t: r.arrive[2], v: [W.S[2] + 300, 1360, 0.95]},
  {t: r.depart[3], v: [W.S[2] + 300, 1360, 0.95]},
  {t: r.arrive[3], v: [W.S[3] + 300, 1360, 0.95]},
  {t: TL.pullback.move[0], v: [W.S[3] + 300, 1360, 0.95]},
  {t: TL.pullback.move[1], v: [3340, 1395, 0.4]}, // whole route, start to end, inside the 96 px OT margins
  {t: TL.beyond.camera[0], v: [3340, 1395, 0.4]},
  {t: TL.beyond.camera[1], v: [6300, 1420, 0.8]},
  {t: TL.ending.flight[0], v: [6500, 1420, 0.8], e: E.linear},
  {t: TL.ending.worldOut[1], v: [6620, 1420, 0.62], e: E.out},
];

export const camera = (t: number): Cam => {
  const [cx, cy, z] = track(t, camKeys);
  return {cx, cy, z};
};

export const project = (p: Pt, c: Cam): Pt => ({x: 960 + (p.x - c.cx) * c.z, y: 540 + (p.y - c.cy) * c.z});

/** World transform for a container whose children use world coordinates. */
export const worldTransform = (c: Cam) => `translate(${960 - c.cx * c.z}px, ${540 - c.cy * c.z}px) scale(${c.z})`;

/** Angle on the ring, clockwise from the left node over the top (SVG y points down). */
export const ringPoint = (theta: number): Pt => ({x: W.C.x + W.R * Math.cos(theta), y: W.C.y - W.R * Math.sin(theta)});

const routeX = (t: number) => {
  let x = L.x;
  for (let i = 0; i < 4; i++) x = seg(t, r.depart[i], r.arrive[i], x, W.S[i], E.inOut);
  return seg(t, TL.beyond.move[0], TL.beyond.move[1], x, W.beyondEnd, E.soft);
};

/**
 * The protagonist's world position. `visible` is false while the two ring nodes stand in for it
 * and during the final flight, which the ending layer draws in screen space.
 */
export const dotWorld = (t: number): Pt & {visible: boolean} => {
  const h = TL.hook;
  if (t < TL.ring.descend[0]) {
    let x = seg(t, h.pressure[0], TL.hook.line2Out, W.hookDot.x, W.hookDrift, E.inOut);
    x = seg(t, h.surge[0], h.surge[1], x, W.underline.x1, E.surge);
    return {x, y: W.hookDot.y, visible: t >= h.dotIn};
  }
  if (t < TL.ring.split[0]) {
    // Drop from the end of the underline into the centre of what becomes the ring.
    const p = E.inOut((t - TL.ring.descend[0]) / (TL.ring.descend[1] - TL.ring.descend[0]));
    const a = {x: W.underline.x1, y: W.underline.y};
    const ctrl = {x: W.underline.x1, y: 1150};
    const b = W.C;
    const q = 1 - p;
    return {x: q * q * a.x + 2 * q * p * ctrl.x + p * p * b.x, y: q * q * a.y + 2 * q * p * ctrl.y + p * p * b.y, visible: true};
  }
  if (t < TL.ring.loop[0]) return {...L, visible: false};
  if (t < TL.ring.loop[1]) {
    const u = E.inOut((t - TL.ring.loop[0]) / (TL.ring.loop[1] - TL.ring.loop[0]));
    return {...ringPoint(Math.PI - 2 * Math.PI * u), visible: true};
  }
  return {x: routeX(t), y: ROUTE_Y, visible: t < TL.ending.flight[0]};
};

export const dotScreen = (t: number): Pt => project(dotWorld(t), camera(t));

/** Speed of the dot on screen, used for its motion trail and the travel whoosh. */
export const dotSpeed = (t: number, dt = 1 / 60) => {
  const a = dotScreen(t - dt);
  const b = dotScreen(t);
  return Math.hypot(b.x - a.x, b.y - a.y) / dt;
};

export {lerp};
