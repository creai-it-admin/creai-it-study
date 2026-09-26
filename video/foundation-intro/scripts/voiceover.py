"""
Voiceover pipeline for the VO cut.

1. Generate each take with the skill's ElevenLabs script (cached in voiceover/raw; --regen id,id to redo).
2. Cut multi-part takes at their longest pauses, trim, and verify each part with an ASR transcript.
3. Retime: build src/timeline-vo.json from src/timeline.json so every line has room at its natural pace,
   with the arcs drawing under the sentence that names them. The music-only cut is left untouched.
4. Write voiceover/placement.json (what the mixer reads) and WebVTT captions.

  python3 scripts/voiceover.py [--regen id,id] [--seed id=11]
Keys are found automatically: the skill's voiceover_gen.mjs resolves ELEVENLABS_API_KEY (environment → project
.env.local/.env → login shell); the ASR check reads OPENAI_API_KEY the same way (here, the app's .env.local).
"""
import copy
import difflib
import json
import os
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

SR = 48000
GEN = Path.home() / '.claude/skills/remotion-video-creator/scripts/voiceover_gen.mjs'
cfg = json.load(open('voiceover/takes.json'))
v = cfg['voice']
regen = set(sys.argv[sys.argv.index('--regen') + 1].split(',')) if '--regen' in sys.argv else set()
seed_for = {}
if '--seed' in sys.argv:  # --seed id=11,id=3 to audition a different take
    seed_for = dict(p.split('=') for p in sys.argv[sys.argv.index('--seed') + 1].split(','))
Path('voiceover/raw').mkdir(parents=True, exist_ok=True)
Path('public/audio/vo').mkdir(parents=True, exist_ok=True)
Path('out').mkdir(exist_ok=True)


def decode(path):
    pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).copy()


def save(path, x):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def voiced(x, floor_db=-50):
    hop = SR // 100
    n = len(x) // hop
    rms = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    return 20 * np.log10(rms / (rms.max() + 1e-12)) > floor_db, hop


def trim(x, head=0.14, tail=0.15):  # generous head: soft onsets (ㄷ, ㅂ, ㅅ) sit below the voicing floor
    mask, hop = voiced(x)
    idx = np.flatnonzero(mask)
    a = max(0, idx[0] * hop - int(head * SR))
    b = min(len(x), (idx[-1] + 1) * hop + int(tail * SR))
    out = x[a:b].copy()
    fade = int(0.008 * SR)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


def split(x, parts, cuts=None):
    if parts == 1:
        return [trim(x)]
    if cuts:  # a take whose pauses hold room tone, or whose longest pause is expressive rather than a sentence break
        bounds = [0] + [int(c * SR) for c in cuts] + [len(x)]
        return [trim(x[bounds[k]:bounds[k + 1]]) for k in range(parts)]
    mask, hop = voiced(x)
    idx = np.flatnonzero(mask)
    gaps, start = [], None
    for i in range(idx[0], idx[-1] + 1):
        if not mask[i] and start is None:
            start = i
        elif mask[i] and start is not None:
            gaps.append((i - start, start, i))
            start = None
    cuts = sorted(sorted(gaps, reverse=True)[: parts - 1], key=lambda g: g[1])
    bounds = [0] + [((s + e) // 2) * hop for _, s, e in cuts] + [len(x)]
    return [trim(x[bounds[k]:bounds[k + 1]]) for k in range(parts)]


def secret(name):
    """Environment, then .env.local/.env from here up to home, then the login shell; never printed."""
    if os.environ.get(name):
        return os.environ[name]
    d, home = Path.cwd().resolve(), Path.home().resolve()
    while True:
        for f in ('.env.local', '.env'):
            if (d / f).is_file():
                for line in (d / f).read_text(errors='ignore').splitlines():
                    m = re.match(rf'^\s*(?:export\s+)?{name}\s*=\s*"?([^"\n]+?)"?\s*$', line)
                    if m:
                        return m.group(1)
        if d == home or d.parent == d:
            break
        d = d.parent
    out = subprocess.run([os.environ.get('SHELL', '/bin/zsh'), '-lic', f"printf '%s' \"${{{name}}}\""],
                         stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=15).stdout
    return out.strip() or None


def transcribe(path):
    key = secret('OPENAI_API_KEY')
    if not key:
        return None
    out = subprocess.run(['curl', '-s', 'https://api.openai.com/v1/audio/transcriptions', '-H', f'Authorization: Bearer {key}',
                          '-F', 'model=gpt-4o-mini-transcribe', '-F', 'language=ko', '-F', f'file=@{path}'],
                         capture_output=True, text=True).stdout
    return json.loads(out).get('text', '')


norm = lambda s: re.sub(r'[^\w]', '', s.replace('4', '사').replace('2', '이'))

# ---------- 1–2. generate, split, verify ----------
D, TEXT, problems = {}, {}, []
for take in cfg['takes']:
    raw = Path(f"voiceover/raw/{take['id']}.mp3")
    if not raw.exists() or take['id'] in regen:
        with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False) as f:
            f.write(take['perf'])
        subprocess.run(['node', str(GEN), '--model', v['model'], '--language', v['language'], '--voice', v['id'],
                        '--stability', str(v['stability']), '--similarity-boost', str(v['similarity']), '--style', str(v['style']),
                        '--speed', str(v['speed']), '--seed', str(seed_for.get(take['id'], v['seed'])), '--text-file', f.name, '--output', str(raw)],
                       check=True, capture_output=True)
    for k, (text, audio) in enumerate(zip(take['parts'], split(decode(raw), len(take['parts']), take.get('cuts')))):
        pid = f"{take['id']}-{k}"
        save(f'public/audio/vo/{pid}.wav', audio)
        D[pid], TEXT[pid] = len(audio) / SR, text
        heard = transcribe(f'public/audio/vo/{pid}.wav')
        match = difflib.SequenceMatcher(None, norm(text), norm(heard or '')).ratio() if heard is not None else None
        bad = match is not None and match < 0.9
        problems += [pid] if bad else []
        print(f"{pid:10s} {D[pid]:4.2f}s  ASR {match if match is None else round(match, 2)}  {heard or ''}{'   <-- check' if bad else ''}")

# ---------- 3. retime the VO cut ----------
base = json.load(open('src/timeline.json'))
tl = copy.deepcopy(base)
at = {}
r2 = lambda x: round(x, 2)

at['hook1-0'] = base['hook']['line1In'] + 0.15
at['hook2-0'] = base['hook']['line2In'] + 0.15
at['vision-0'] = base['vision']['line1In'] + 0.15
at['base-0'] = base['vision']['subIn'] + 0.15
for pid, limit in [('hook1-0', base['hook']['line1Out']), ('hook2-0', base['hook']['surge'][0] - 0.1),
                   ('vision-0', base['vision']['subIn']), ('base-0', base['vision']['out'] - 0.05)]:
    if at[pid] + D[pid] > limit:
        problems.append(f'{pid} ends {at[pid] + D[pid] - limit:.2f}s late')

g = tl['ring']
at['two-0'] = g['titleIn'] - 0.15
g['arcTop'] = [at['two-0'] + D['two-0'] + 0.15, 0]
g['arcTop'][1] = g['arcTop'][0] + 1.1
g['arcTopLabel'] = g['arcTop'][0] + 0.7
at['loop-0'] = g['arcTop'][0] + 0.1
g['arcBottom'] = [max(g['arcTop'][1] + 0.4, at['loop-0'] + D['loop-0'] + 0.15), 0]
g['arcBottom'][1] = g['arcBottom'][0] + 1.1
g['arcBottomLabel'] = g['arcBottom'][0] + 0.7
at['loop-1'] = g['arcBottom'][0] + 0.1
g['loop'] = [g['arcBottom'][1] + 0.4, g['arcBottom'][1] + 2.4]
g['out'] = [max(g['loop'][1] + 0.4, at['loop-1'] + D['loop-1'] + 0.3), 0]
g['out'][1] = g['out'][0] + 0.6

u = tl['unroll']
u['roll'] = [g['out'][1] + 0.2, g['out'][1] + 2.8]
at['route-0'] = u['roll'][0] + 0.3
u['headingIn'] = max(u['roll'][1] - 0.45, at['route-0'] + D['route-0'] + 0.25)
u['headingOut'] = u['headingIn'] + 2.7
u['extend'] = [u['roll'][1], u['roll'][1] + 1.9]
u['variance'] = [u['roll'][1] + 0.5, u['roll'][1] + 2.3]

rt = tl['route']
rt['depart'], rt['arrive'] = [u['headingOut'] + 0.1], [u['headingOut'] + 0.9]
for i in range(4):
    at[f'week{i + 1}-0'] = rt['arrive'][i] + 0.1
    if i < 3:
        rt['depart'].append(rt['arrive'][i] + max(3.4, D[f'week{i + 1}-0'] + 1.4))
        rt['arrive'].append(rt['depart'][i + 1] + 1.0)

pj, a2 = tl['project'], rt['arrive'][2]
pj.update(branch=[a2 + 0.35, a2 + 2.0], labelIn=a2 + 0.9, marks=[a2 + 1.4, a2 + 1.75, a2 + 2.1], resultIn=a2 + 2.2)

pb = tl['pullback']
m0 = rt['arrive'][3] + max(3.0, D['week4-0'] + 0.7)
at['project-0'] = m0 + 0.3
pb.update(move=[m0, m0 + 1.7], labelsIn=m0 + 0.9, factsIn=m0 + 1.3,
          factsOut=max(m0 + 3.8, at['project-0'] + D['project-0'] + 0.5))

# Finale: the four weeks lock into one foundation under "4주를 거치며,", FOUNDATION is struck into it under the
# middle clause, the call lands as a statement, and the dot launches home on its last syllable.
bd = tl['beyond']
b0 = pb['factsOut'] + 0.2
at['finale-0'] = b0 + 0.3
lock = max(b0 + 1.55, at['finale-0'] + D['finale-0'] + 0.1)
at['finale-1'] = lock + 0.2
stamp = [lock + 0.2, lock + 1.2]
line_in = max(stamp[1] + 0.1, at['finale-1'] + D['finale-1'] + 0.05)
at['finale-2'] = line_in + 0.1
# The charge starts as 만듭시다 ends (parts carry a 0.15 s tail) and the launch follows a held breath later:
# the sweep and the doubled pulse must not sit on the last word.
voice_end = at['finale-2'] + D['finale-2'] - 0.15
flight0 = max(line_in + 1.6, voice_end + 0.55)
bd.update(move=[b0, flight0], camera=[b0, b0 + 1.6], leadIn=b0 + 0.2, blocks=[b0 + 0.35 + 0.28 * i for i in range(4)], clause=at['finale-1'],
          lock=lock, stamp=stamp, lineIn=line_in, charge=[voice_end - 0.15, flight0])

shift = flight0 - base['ending']['flight'][0]
tl['ending'] = json.loads(json.dumps(base['ending']), parse_float=lambda s: float(s) + shift)
tl['end'] = base['end'] + shift


def rounded(o):
    if isinstance(o, dict):
        return {k: rounded(x) for k, x in o.items()}
    if isinstance(o, list):
        return [rounded(x) for x in o]
    return r2(o) if isinstance(o, float) else o


json.dump(rounded(tl), open('src/timeline-vo.json', 'w'), indent=2)
json.dump({'voice': v['name'], 'parts': [{'id': p, 'file': f'audio/vo/{p}.wav', 'at': r2(at[p]), 'dur': r2(D[p]), 'text': TEXT[p]}
                                          for p in sorted(at, key=at.get)]}, open('voiceover/placement.json', 'w'), ensure_ascii=False, indent=1)

stamp = lambda s: f'{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{s % 60:06.3f}'
speed = json.load(open('src/render.json'))['speed']  # captions follow the film's playback speed
with open('out/creaiit-foundation-intro.ko.vtt', 'w') as f:
    f.write('WEBVTT\n\n')
    order = sorted(at, key=at.get)
    for i, p in enumerate(order):
        end = (at[p] + D[p]) / speed + 0.25
        if i + 1 < len(order):  # never overlap the next line: two stacked captions flash for a frame or two
            end = min(end, at[order[i + 1]] / speed - 0.02)
        f.write(f'{stamp(at[p] / speed)} --> {stamp(end)}\n{TEXT[p]}\n\n')

print(f"\nVO cut: {tl['end']:.2f}s (music cut {base['end']:.2f}s)")
for p in sorted(at, key=at.get):
    print(f'  {at[p]:6.2f}–{at[p] + D[p]:6.2f}  {TEXT[p]}')
print('problems:', problems or 'none')
