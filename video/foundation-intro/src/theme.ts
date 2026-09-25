import {loadFont} from '@remotion/fonts';
import {loadFont as loadOutfit} from '@remotion/google-fonts/Outfit';
import {staticFile} from 'remotion';

for (const [file, weight] of [
  ['Regular', '400'],
  ['Medium', '500'],
  ['SemiBold', '600'],
  ['Bold', '700'],
  ['ExtraBold', '800'],
] as const) {
  loadFont({family: 'Pretendard', url: staticFile(`fonts/Pretendard-${file}.woff2`), weight});
}
const outfit = loadOutfit('normal', {weights: ['500', '600'], subsets: ['latin']});

export const KR = 'Pretendard, "Apple SD Gothic Neo", sans-serif';
export const EN = `${outfit.fontFamily}, Pretendard, sans-serif`;

// Landing navy deepening into the OT cover's ink, which the last frame matches exactly.
export const C = {
  deep: '#060e1a',
  navy: '#0a1728',
  cover: '#102b50', // OT cover background
  text: '#f3f9ff', // OT bg, used as text on dark
  muted: '#afc8df', // OT darkMuted
  faint: '#6f8aa8',
  bright: '#79caff', // OT bright: vision emphasis and "활용에 대한 이해"
  knowledge: '#eef5ff', // "지식적 이해"
  me: '#38bdf8', // the protagonist and "나만의 프로젝트"
};
