import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Dot} from './components/Dot';
import {E, seg} from './lib/time';
import {camera, TL, worldTransform} from './lib/world';
import {Background, Grain, Grid, RouteHeading, Vignette} from './scenes/Atmosphere';
import {Ending} from './scenes/Ending';
import {HookLines, HookStream} from './scenes/Hook';
import {Ring, Strands} from './scenes/Ring';
import {Beyond, Facts, Overview, Project, Stations} from './scenes/Route';
import {Trail, Vision} from './scenes/Vision';
import {C} from './theme';

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cam = camera(t);
  const world = 1 - seg(t, TL.ending.worldOut[0], TL.ending.worldOut[1], 0, 1, E.in);
  return (
    <AbsoluteFill style={{backgroundColor: C.navy, overflow: 'hidden'}}>
      <Background t={t} />
      {world > 0 && (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, transformOrigin: '0 0', transform: worldTransform(cam), opacity: world}}>
          <Grid />
          <HookStream t={t} />
          <HookLines t={t} />
          <Trail t={t} />
          <Vision t={t} />
          <Ring t={t} />
          <Strands t={t} />
          <RouteHeading t={t} />
          <Stations t={t} />
          <Project t={t} />
          <Overview t={t} />
          <Beyond t={t} />
        </div>
      )}
      <Dot t={t} />
      <Facts t={t} />
      <Ending t={t} />
      <Vignette t={t} />
      <Grain frame={frame} />
      <Audio src={staticFile('audio/score.wav')} />
    </AbsoluteFill>
  );
};
