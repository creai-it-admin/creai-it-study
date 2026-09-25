// Copies Pretendard from npm, generates film-grain tiles, and ensures an audio file exists for the first render.
import {copyFileSync, existsSync, mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

mkdirSync('public/fonts', {recursive: true});
mkdirSync('public/audio', {recursive: true});
for (const w of ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold']) {
  copyFileSync(`node_modules/pretendard/dist/web/static/woff2/Pretendard-${w}.woff2`, `public/fonts/Pretendard-${w}.woff2`);
}
if (!existsSync('public/grain-0.png')) execFileSync('python3', ['scripts/grain.py'], {stdio: 'inherit'});
if (!existsSync('public/audio/score.wav')) execFileSync('python3', ['scripts/score.py', '--silent'], {stdio: 'inherit'});
