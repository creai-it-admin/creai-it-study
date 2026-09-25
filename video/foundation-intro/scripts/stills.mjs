// Renders stills at given seconds and assembles a labelled contact sheet: node scripts/stills.mjs 0.8 2.5 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const times = process.argv.slice(2).map(Number);
const tag = process.env.TAG ?? 'sheet';
mkdirSync('out/stills', {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'FoundationIntro'});
const files = [];
await Promise.all(times.map(async (t) => {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps));
  const output = `out/stills/${tag}-${t.toFixed(2)}.png`;
  await renderStill({serveUrl, composition, frame, output, imageFormat: 'png'});
  files.push([t, output]);
}));
files.sort((a, b) => a[0] - b[0]);
execFileSync('python3', ['scripts/sheet.py', `out/${tag}.jpg`, ...files.flatMap(([t, f]) => [String(t), f])], {stdio: 'inherit'});
