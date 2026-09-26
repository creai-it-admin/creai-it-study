import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {SPEED, TL} from './lib/world';
import './theme';

export const Root: React.FC = () => (
  <Composition id="FoundationIntro" component={Film} width={1920} height={1080} fps={TL.fps} durationInFrames={Math.round((TL.end / SPEED) * TL.fps)} />
);
