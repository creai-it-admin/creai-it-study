"""
Original score and sound design, synthesized from the same timeline the picture uses.

Music: D major. A tense pedal while the flood of terms presses in; the chord opens when the dot breaks
ahead; a reflective Bm9 for the two understandings; a quiet pulse along the route; the widest voicing at
the overview; a resolved Dmaj9 as the dot becomes the + of CREAI+IT.
SFX: one coherent family (filtered noise, sine bells, soft sub) placed on the first legible frame of
each event. Nothing is sampled, so there is no third-party licence to track.

  python3 scripts/score.py            music-only cut -> public/audio/score.wav (loudness-normalized)
  python3 scripts/score.py --cut vo   narrated cut (src/timeline-vo.json + voiceover/placement.json) -> public/audio/score-vo.wav
  python3 scripts/score.py --silent   silent placeholders of the right lengths
"""
import json
import subprocess
import sys
import wave

import numpy as np
from scipy import signal

SR = 48000
CUT = 'vo' if '--cut' in sys.argv and sys.argv[sys.argv.index('--cut') + 1] == 'vo' else 'music'
SPEED = json.load(open('src/render.json'))['speed']  # same playback speed the picture uses


def compress(o):
    """Timeline seconds -> film seconds. The music is composed at the compressed timing, never stretched afterwards."""
    if isinstance(o, dict):
        return {k: (x if k == 'fps' else compress(x)) for k, x in o.items()}
    if isinstance(o, list):
        return [compress(x) for x in o]
    return o / SPEED if isinstance(o, (int, float)) and not isinstance(o, bool) else o


TL = compress(json.load(open('src/timeline-vo.json' if CUT == 'vo' else 'src/timeline.json')))
END = TL['end']
N = int(END * SR)
OUT = 'public/audio/score-vo.wav' if CUT == 'vo' else 'public/audio/score.wav'


def write(path, stereo):
    pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if '--silent' in sys.argv:
    for path, tl_path in (('public/audio/score.wav', 'src/timeline.json'), ('public/audio/score-vo.wav', 'src/timeline-vo.json')):
        write(path, np.zeros((int(json.load(open(tl_path))['end'] * SR), 2)))
    sys.exit(0)

rng = np.random.default_rng(11)
t_all = np.arange(N) / SR
music = np.zeros((N, 2))
sfx = np.zeros((N, 2))
send = np.zeros((N, 2))  # reverb send


# ---------- helpers ----------
def hz(note):
    names = {'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6, 'E': -5, 'F': -4, 'F#': -3, 'Gb': -3,
             'G': -2, 'G#': -1, 'Ab': -1, 'A': 0, 'A#': 1, 'Bb': 1, 'B': 2}
    name, octave = note[:-1], int(note[-1])
    return 440.0 * 2 ** ((names[name] + (octave - 4) * 12) / 12)


def pan(mono, p):
    """Equal-power pan; p in [-1, 1], scalar or per-sample."""
    a = (np.asarray(p) + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=-1)


def place(bus, start, stereo, gain=1.0, reverb=0.0):
    i = int(round(start * SR))
    if i >= N:
        return
    j = min(N, i + len(stereo))
    if i < 0:
        stereo, i = stereo[-i:], 0
    bus[i:j] += stereo[: j - i] * gain
    if reverb:
        send[i:j] += stereo[: j - i] * gain * reverb


def env(n, attack, release, curve=3.0):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    r = np.exp(-curve * np.clip(t - attack, 0, None) / max(release, 1e-4))
    return a * r


def bell(freq, dur=2.5, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    partials = [(1, 1.0, 1.0), (2.01, 0.42 * bright, 1.6), (2.76, 0.28 * bright, 2.2), (5.4, 0.12 * bright, 3.4), (8.93, 0.05 * bright, 5.0)]
    out = np.zeros(n)
    for ratio, amp, speed in partials:
        out += amp * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-t * speed * 2.2 / dur * 2)
    return out * np.clip(t / 0.004, 0, 1)


def pluck(freq, dur=1.2, tone=2400):
    n = int(dur * SR)
    t = np.arange(n) / SR
    wave_ = signal.sawtooth(2 * np.pi * freq * t, 0.5) * 0.6 + np.sin(2 * np.pi * freq * t) * 0.5
    b, a = signal.butter(2, tone / (SR / 2))
    return signal.lfilter(b, a, wave_) * np.exp(-t * 4.5) * np.clip(t / 0.003, 0, 1)


def noise_sweep(dur, f0, f1, q=1.4, curve='exp'):
    """Band-passed noise whose centre travels f0 -> f1 (block-wise filter with state carry)."""
    n = int(dur * SR)
    src = rng.standard_normal(n)
    out = np.zeros(n)
    block = 256
    zi = None
    for s in range(0, n, block):
        p = s / max(n - 1, 1)
        fc = f0 * (f1 / f0) ** p if curve == 'exp' else f0 + (f1 - f0) * p
        lo, hi = fc / (1 + 1 / (2 * q)), fc * (1 + 1 / (2 * q))
        b, a = signal.butter(2, [max(lo, 30) / (SR / 2), min(hi, SR / 2 - 200) / (SR / 2)], btype='band')
        if zi is None:
            zi = signal.lfilter_zi(b, a) * 0
        seg, zi = signal.lfilter(b, a, src[s:s + block], zi=zi)
        out[s:s + block] = seg
    return out / (np.max(np.abs(out)) + 1e-9)


def whoosh(start, dur, f0, f1, p0, p1, gain, reverb=0.25, peak=0.45):
    n = int(dur * SR)
    x = noise_sweep(dur, f0, f1)
    t = np.linspace(0, 1, n)
    shape = np.where(t < peak, (t / peak) ** 2, np.exp(-5 * (t - peak) / (1 - peak)))
    place(sfx, start, pan(x * shape, np.linspace(p0, p1, n)), gain, reverb)


def sub_hit(start, gain=0.9, f0=92, f1=36, dur=1.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 3.2) * np.clip(t / 0.006, 0, 1)
    place(sfx, start, pan(x, 0), gain, 0.1)


def chime(start, notes, gain=0.25, spread=0.35, dur=3.0, reverb=0.5, bright=1.0, stagger=0.0):
    for k, note in enumerate(notes):
        x = bell(hz(note), dur, bright)
        p = spread * ((k / max(len(notes) - 1, 1)) * 2 - 1) if len(notes) > 1 else 0
        place(sfx, start + k * stagger, pan(x, p), gain / len(notes) ** 0.5, reverb)


# ---------- music: pad chords ----------
def pad_voice(freq, n, bright=0.6):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for det in (-0.004, 0.0, 0.0045):  # three detuned voices ≈ chorus
        f = freq * (1 + det)
        for h in range(1, 9):
            out += (1 / h ** (2.2 - bright)) * np.sin(2 * np.pi * f * h * t + det * 900 * h)
    lfo = 1 + 0.06 * np.sin(2 * np.pi * 0.17 * t + freq)
    return out * lfo / 3


def pad(start, end, notes, gain, fade=1.4, bright=0.6, width=0.5):
    n = int((end - start + fade) * SR)
    stereo = np.zeros((n, 2))
    for k, note in enumerate(notes):
        v = pad_voice(hz(note), n, bright)
        stereo += pan(v, width * ((k % 2) * 2 - 1) * (0.4 + 0.6 * k / max(len(notes), 1)))
    t = np.arange(n) / SR
    shape = np.clip(t / fade, 0, 1) * np.clip((end - start + fade - t) / fade, 0, 1)
    stereo *= (shape ** 1.5)[:, None] / len(notes) ** 0.5
    place(music, start - fade / 2, stereo, gain, 0.35)


h, v, g, u, r, pj, pb, bd, e = (TL[k] for k in ('hook', 'vision', 'ring', 'unroll', 'route', 'project', 'pullback', 'beyond', 'ending'))

# Hook: a low pedal that tightens under pressure.
pad(0.3, h['surge'][0], ['D2', 'A2', 'D3'], 0.55, fade=2.2, bright=0.3)
pad(h['pressure'][0], h['surge'][0], ['Eb4', 'A4'], 0.10, fade=2.5, bright=0.2, width=0.8)  # the unease
# Vision: the chord opens as the dot breaks ahead.
pad(h['surge'][1] - 0.3, g['descend'][0] + 0.4, ['D3', 'A3', 'C#4', 'E4', 'F#4'], 0.42, fade=1.2, bright=0.8)
pad(h['surge'][1] - 0.3, g['descend'][0] + 0.4, ['D2'], 0.35, fade=1.2, bright=0.2)
# Two understandings: reflective.
pad(g['descend'][0], u['roll'][0], ['B2', 'F#3', 'A3', 'C#4', 'D4'], 0.36, fade=1.6, bright=0.55)
# The loop unrolls into a road: suspended, leaning forward.
pad(u['roll'][0], r['depart'][0] + 0.3, ['G2', 'D3', 'A3', 'B3', 'F#4'], 0.36, fade=1.4, bright=0.65)
# Route: one chord per week.
week_chords = [['D2', 'A2', 'F#3', 'E4'], ['B1', 'F#2', 'D3', 'C#4'], ['G1', 'D2', 'B2', 'A3'], ['A1', 'E2', 'C#3', 'B3']]
for i in range(4):
    s = r['depart'][i] + 0.2
    t_end = (r['depart'][i + 1] + 0.2) if i < 3 else pb['move'][0] + 0.3
    pad(s, t_end, week_chords[i], 0.32, fade=1.0, bright=0.55)
# Overview: widest voicing.
pad(pb['move'][0], bd['move'][0] + 0.5, ['G1', 'D2', 'B2', 'F#3', 'A3', 'D4', 'E4'], 0.42, fade=1.4, bright=0.85, width=0.9)
# Finale: suspended while the weeks gather, IV as they lock, V under the charge, the tonic when the + lands.
pad(bd['move'][0], bd['lock'] + 0.3, ['A1', 'E2', 'D3', 'E3', 'B3'], 0.34, fade=1.0, bright=0.6)
pad(bd['lock'], bd['charge'][0] + 0.3, ['G1', 'D2', 'B2', 'D3', 'A3', 'E4'], 0.40, fade=0.6, bright=0.8, width=0.8)
pad(bd['charge'][0], e['flight'][0] + 0.5, ['A1', 'E2', 'C#3', 'E3', 'A3', 'E4'], 0.42, fade=0.5, bright=0.85, width=0.8)
# Ending: resolved, long tail.
pad(e['flight'][0] + 0.4, END + 1.5, ['D2', 'A2', 'F#3', 'C#4', 'E4', 'A4'], 0.40, fade=2.4, bright=0.75, width=0.8)

# Route pulse: soft plucks on eighths (96 bpm) that give the journey momentum.
BEAT = 60 / 96 / SPEED  # 144 bpm at 1.5×: the pulse speeds up with the picture
pulse_notes = [['D4', 'A4', 'F#4', 'A4'], ['B3', 'F#4', 'D4', 'F#4'], ['G3', 'D4', 'B3', 'D4'], ['A3', 'E4', 'C#4', 'E4']]
t0 = r['depart'][0]
k = 0
tp = t0
while tp < pb['move'][0] + 0.4:
    week = sum(1 for d in r['depart'] if tp >= d - 0.05) - 1
    note = pulse_notes[max(week, 0)][k % 4]
    ramp = min(1.0, (tp - t0) / 2.0)
    place(music, tp, pan(pluck(hz(note), 0.9, 2200), 0.25 * ((k % 2) * 2 - 1)), 0.11 * ramp, 0.3)
    if k % 4 == 0:
        sub = np.sin(2 * np.pi * hz(['D2', 'B1', 'G1', 'A1'][max(week, 0)]) * np.arange(int(0.5 * SR)) / SR) * env(int(0.5 * SR), 0.01, 0.35)
        place(music, tp, pan(sub, 0), 0.22 * ramp)
    k += 1
    tp = t0 + k * BEAT / 2

# Finale pulse: the route's pulse returns under the call on IV, doubles on V as the dot charges, and stops dead on the launch.
k, tp = 0, bd['lock'] + 0.15
while tp < e['flight'][0] - 0.02:
    on_v = tp >= bd['charge'][0]
    note = (['A3', 'E4', 'C#4', 'E4'] if on_v else ['G3', 'D4', 'B3', 'D4'])[k % 4]
    ramp = min(1.0, (tp - bd['lock']) / 1.5)
    place(music, tp, pan(pluck(hz(note), 0.8, 2000), 0.25 * ((k % 2) * 2 - 1)), 0.07 * ramp, 0.3)  # under speech: soft, darker
    if k % 4 == 0:
        sub = np.sin(2 * np.pi * hz('A1' if on_v else 'G1') * np.arange(int(0.5 * SR)) / SR) * env(int(0.5 * SR), 0.01, 0.35)
        place(music, tp, pan(sub, 0), 0.2 * ramp)
    k += 1
    tp += BEAT / 4 if on_v else BEAT / 2

# ---------- sound design ----------
# The flood: grains of filtered noise whose density follows the word stream.
def flow(t):
    k_ = np.clip((t - h['streamIn']) / 1.2, 0, 1)
    k_ = k_ * (1 + 0.55 * np.clip((t - h['pressure'][0]) / (h['pressure'][1] - h['pressure'][0]), 0, 1))
    k_ = np.where(t > h['slow'][0], k_ + (0.1 - k_) * np.clip((t - h['slow'][0]) / (h['slow'][1] - h['slow'][0]), 0, 1), k_)
    return np.where(t > h['surge'][0], 0.1 * np.exp(-(t - h['surge'][0]) * 2), k_)


grain_t = 0.3
while grain_t < h['surge'][0] + 0.3:
    rate = 3 + 26 * float(flow(np.array([grain_t]))[0])
    dur = rng.uniform(0.004, 0.018)
    n = int(dur * SR)
    fc = rng.uniform(1800, 6500)
    b, a = signal.butter(2, [fc * 0.8 / (SR / 2), min(fc * 1.25, 20000) / (SR / 2)], btype='band')
    x = signal.lfilter(b, a, rng.standard_normal(n)) * np.hanning(n)
    place(sfx, grain_t, pan(x / (np.max(np.abs(x)) + 1e-9), rng.uniform(-0.8, 0.8)), 0.05 * rng.uniform(0.4, 1), 0.2)
    grain_t += rng.exponential(1 / rate)
# Low pressure under the flood.
rum_n = int((h['surge'][0] + 0.2) * SR)
b, a = signal.butter(2, 180 / (SR / 2))
rum = signal.lfilter(b, a, rng.standard_normal(rum_n))
rum = rum / np.max(np.abs(rum)) * np.clip(t_all[:rum_n] / 3, 0, 1) * (0.5 + 0.6 * np.clip((t_all[:rum_n] - h['pressure'][0]) / 3, 0, 1))
place(sfx, 0, pan(rum, 0), 0.22)
# The dot appears.
chime(h['dotIn'], ['A5'], 0.12, dur=2.0, reverb=0.6, bright=0.5)
# Gathering: a rising sweep that cuts on the dash.
whoosh(h['gather'][0] - 0.3, h['surge'][0] - h['gather'][0] + 0.3, 300, 7000, 0, 0, 0.30, reverb=0.3, peak=0.98)
# The dash.
sub_hit(h['surge'][0], 0.85)
whoosh(h['surge'][0], 1.0, 5000, 400, -0.7, 0.8, 0.42, reverb=0.35, peak=0.18)
chime(h['surge'][1], ['D5', 'A5', 'E6'], 0.22, spread=0.5, dur=3.2, reverb=0.7, stagger=0.04)
# The vision lands word group by word group.
chime(v['line1In'] + 0.15, ['A4'], 0.12, dur=2.4, reverb=0.6)
chime(v['line2In'] + 0.15, ['D5'], 0.14, dur=2.8, reverb=0.6)
chime(v['emphasis'], ['F#5', 'C#6'], 0.10, spread=0.3, dur=2.8, reverb=0.8, bright=1.3)
chime(v['subIn'] + 0.2, ['A3'], 0.10, dur=2.4, reverb=0.5, bright=0.6)
# Descent and split.
whoosh(g['descend'][0], g['descend'][1] - g['descend'][0] + 0.2, 2500, 300, 0.6, 0, 0.22, peak=0.5)
place(sfx, g['split'][0], pan(bell(hz('A3'), 2.6, 0.7), -0.6), 0.16, 0.5)  # knowledge (left)
place(sfx, g['split'][0] + 0.05, pan(bell(hz('E4'), 2.6, 0.9), 0.6), 0.16, 0.5)  # application (right)
# Arcs draw across, then arrive.
whoosh(g['arcTop'][0], g['arcTop'][1] - g['arcTop'][0], 900, 2600, -0.7, 0.7, 0.10, peak=0.6)
place(sfx, g['arcTop'][1], pan(bell(hz('E5'), 2.2, 1.0), 0.6), 0.14, 0.5)
whoosh(g['arcBottom'][0], g['arcBottom'][1] - g['arcBottom'][0], 900, 2600, 0.7, -0.7, 0.10, peak=0.6)
place(sfx, g['arcBottom'][1], pan(bell(hz('A4'), 2.2, 1.0), -0.6), 0.14, 0.5)
# The marker circles the loop: an ascending figure panned with its position.
loop_notes = ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6']
for i_, note in enumerate(loop_notes):
    p = (i_ + 0.5) / len(loop_notes)
    s_curve = 0.5 - 0.5 * np.cos(np.pi * p)  # the marker eases in and out
    tt = g['loop'][0] + s_curve * (g['loop'][1] - g['loop'][0])
    theta = np.pi - 2 * np.pi * p
    place(sfx, tt, pan(bell(hz(note), 1.6, 0.8), 0.7 * np.cos(theta)), 0.07, 0.6)
chime(g['loop'][1], ['D5', 'A5'], 0.14, dur=3.0, reverb=0.7)
# The loop unrolls: a long glide forward.
n = int((u['roll'][1] - u['roll'][0] + 0.6) * SR)
tt = np.arange(n) / SR
f = hz('D4') * 2 ** (np.clip(tt / (u['roll'][1] - u['roll'][0]), 0, 1) ** 1.6 * 7 / 12)
glide = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.8, 1.2, 2.0) * 0.8 + np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * env(n, 0.8, 1.0) * 0.2
place(sfx, u['roll'][0], pan(glide, np.linspace(-0.4, 0.5, n)), 0.10, 0.6)
whoosh(u['roll'][0] + 0.4, 2.0, 300, 1800, -0.5, 0.6, 0.12, peak=0.7)
chime(u['headingIn'] + 0.2, ['A4', 'E5'], 0.10, dur=2.6, reverb=0.6)
# Stations: travel whoosh, then an arrival tick with the week's chord tone.
arrive_notes = [['D5', 'F#5'], ['B4', 'D5'], ['G4', 'B4'], ['A4', 'C#5']]
for i_ in range(4):
    whoosh(r['depart'][i_], r['arrive'][i_] - r['depart'][i_] + 0.15, 600, 3200, -0.5, 0.5, 0.16, peak=0.6)
    tick = rng.standard_normal(int(0.03 * SR)) * np.exp(-np.arange(int(0.03 * SR)) / SR * 180)
    place(sfx, r['arrive'][i_], pan(tick, 0), 0.10, 0.2)
    chime(r['arrive'][i_] + 0.02, arrive_notes[i_], 0.16, spread=0.3, dur=2.4, reverb=0.55, stagger=0.06)
# Personal project: its own warmer voice.
for i_, note in enumerate(['D4', 'F#4', 'A4', 'D5']):
    place(sfx, pj['branch'][0] + i_ * 0.22, pan(pluck(hz(note), 1.4, 3200), -0.2 + 0.15 * i_), 0.14, 0.45)
for i_, tm in enumerate(pj['marks']):
    chime(tm, [['A5', 'D6', 'F#6'][i_]], 0.07, dur=1.4, reverb=0.5, bright=1.2)
chime(pj['resultIn'], ['D5', 'A5', 'D6'], 0.12, spread=0.4, dur=2.6, reverb=0.6, stagger=0.05)
# Overview: pull back.
whoosh(pb['move'][0], pb['move'][1] - pb['move'][0] + 0.3, 3500, 250, 0.3, -0.3, 0.20, peak=0.35)
chime(pb['factsIn'] + 0.1, ['D4', 'A4'], 0.10, dur=2.6, reverb=0.6, bright=0.6)
# Finale: each week's block rises on that week's chord tone, then the four lock with one impact.
whoosh(bd['move'][0], bd['lock'] - bd['move'][0], 400, 2600, -0.4, 0.4, 0.12, peak=0.85)
for i_ in range(4):
    tick = rng.standard_normal(int(0.03 * SR)) * np.exp(-np.arange(int(0.03 * SR)) / SR * 160)
    place(sfx, bd['blocks'][i_], pan(tick, -0.6 + 0.4 * i_), 0.12, 0.2)
    chime(bd['blocks'][i_] + 0.02, arrive_notes[i_], 0.13, spread=0.3, dur=1.6, reverb=0.5, stagger=0.04)
sub_hit(bd['lock'], 0.8, f0=80, f1=34, dur=1.8)
b, a = signal.butter(2, 1400 / (SR / 2))
clack = signal.lfilter(b, a, rng.standard_normal(int(0.09 * SR))) * np.exp(-np.arange(int(0.09 * SR)) / SR * 45)
place(sfx, bd['lock'], pan(clack / np.max(np.abs(clack)), 0), 0.22, 0.35)
chime(bd['lock'], ['D5', 'A5', 'D6'], 0.2, spread=0.4, dur=3.2, reverb=0.7, stagger=0.02)
# FOUNDATION is struck: a bright sweep across the field with the light.
whoosh(bd['stamp'][0], bd['stamp'][1] - bd['stamp'][0], 1200, 9000, -0.8, 0.8, 0.10, peak=0.6)
chime(bd['stamp'][1], ['F#6'], 0.07, dur=2.0, reverb=0.7, bright=1.3)
chime(bd['lineIn'] + 0.15, ['A4', 'E5'], 0.10, dur=2.6, reverb=0.6)
# Charge: the opening dash's rising sweep returns and cuts on the launch.
whoosh(bd['charge'][0] - 0.2, bd['charge'][1] - bd['charge'][0] + 0.2, 300, 7000, 0.6, 0.8, 0.2, reverb=0.3, peak=0.98)
sub_hit(e['flight'][0], 0.75)
# Homecoming: a rising glide as the dot flies, a bright landing as it becomes the +.
n = int((e['flight'][1] - e['flight'][0]) * SR)
tt = np.arange(n) / SR
f = hz('A4') * 2 ** ((tt / tt[-1]) ** 2 * 12 / 12)
fly = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.clip(tt / 0.3, 0, 1) * np.clip((tt[-1] - tt) / 0.05, 0, 1)
place(sfx, e['flight'][0], pan(fly, np.linspace(0.8, -0.7, n)), 0.07, 0.6)
whoosh(e['flight'][0], e['flight'][1] - e['flight'][0], 800, 6000, 0.8, -0.7, 0.14, peak=0.9)
sub_hit(e['brandIn'], 0.45, f0=70, f1=40, dur=1.6)
chime(e['brandIn'], ['D6', 'A6', 'F#6'], 0.24, spread=0.5, dur=4.0, reverb=0.8, bright=1.2, stagger=0.03)
chime(e['heroIn'][0] + 0.15, ['A4'], 0.10, dur=3.0, reverb=0.7)
chime(e['heroIn'][1] + 0.15, ['D5', 'F#5'], 0.12, dur=3.5, reverb=0.7)

# ---------- mix ----------
def reverb_ir(seconds=2.8):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-t * 6.9 / seconds)[:, None]
    b, a = signal.butter(1, 5200 / (SR / 2))
    ir = signal.lfilter(b, a, ir, axis=0)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]  # small pre-delay feel
    return ir / np.sqrt(np.sum(ir ** 2))


ir = reverb_ir()
wet = np.stack([signal.fftconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], axis=-1)

# Narration (VO cut): place each line, then duck the music ~7 dB and the effects ~3 dB beneath it.
voice = np.zeros((N, 2))
if CUT == 'vo':
    placement = json.load(open('voiceover/placement.json'))['parts']
    speech = np.zeros(N)
    for p_ in placement:
        # Only the voice is time-compressed (pitch preserved); music and effects are composed at the new timing.
        pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f"public/{p_['file']}", '-af', f'atempo={SPEED}',
                              '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
        line = np.frombuffer(pcm, dtype=np.float32).astype(float)
        i0 = int(p_['at'] / SPEED * SR)
        voice[i0:i0 + len(line)] += pan(line, 0)[: max(0, N - i0)]
        speech[max(0, i0 - int(0.15 * SR)):i0 + len(line) + int(0.25 * SR)] = 1
    # smooth the duck: ~120 ms attack, ~450 ms release
    duck = signal.lfilter([1 - np.exp(-1 / (0.12 * SR))], [1, -np.exp(-1 / (0.12 * SR))], speech)
    duck = np.maximum(duck, signal.lfilter([1 - np.exp(-1 / (0.45 * SR))], [1, -np.exp(-1 / (0.45 * SR))], speech))
    b, a = signal.butter(2, 80 / (SR / 2), btype='high')
    voice = signal.lfilter(b, a, voice, axis=0)
    bed = music * 0.9 * (1 - 0.55 * duck)[:, None] + (sfx + wet * 0.55) * (1 - 0.3 * duck)[:, None]
    # Voice level from measurement: ~9 LU above the bed it sits on.
    on = duck > 0.9
    rms = lambda x: np.sqrt(np.mean(x[on] ** 2) + 1e-12)
    voice *= rms(bed) * 10 ** (9 / 20) / rms(voice)
    mix_src = bed + voice
else:
    mix_src = music * 0.9 + sfx + wet * 0.55

# Keep the low end clean.
b, a = signal.butter(2, 28 / (SR / 2), btype='high')
mix = signal.lfilter(b, a, mix_src, axis=0)
# Protect the first and last moments: an intentional near-silence at 0 and a clean tail for the cut to the deck.
fade_in = np.clip(t_all / 0.25, 0, 1)
fade_out = np.clip((END - t_all) / 1.6, 0, 1) ** 1.5
mix *= (fade_in * fade_out)[:, None]
mix /= np.max(np.abs(mix)) + 1e-9
write(f'out/score-raw-{CUT}.wav', mix * 0.7)

# Two-pass EBU R128 loudness to -16 LUFS / -1.5 dBTP (linear gain when possible).
probe = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', f'out/score-raw-{CUT}.wav', '-af',
                        'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
m = json.loads(probe[probe.rindex('{'):probe.rindex('}') + 1])
subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', f'out/score-raw-{CUT}.wav', '-af',
                f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
                f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true",
                '-ar', str(SR), '-c:a', 'pcm_s16le', OUT], check=True)
print(f"score ({CUT}, {SPEED}×): {END:.2f}s, measured {m['input_i']} LUFS / {m['input_tp']} dBTP -> {OUT}")
