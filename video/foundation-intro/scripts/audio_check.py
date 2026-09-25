"""Short-term loudness curve + spectrogram with story markers, for reviewing the mix without ears."""
import json, subprocess, re
import numpy as np
from scipy import signal
from PIL import Image, ImageDraw
import wave

TL = json.load(open('src/timeline.json'))
w = wave.open('public/audio/score.wav'); sr = w.getframerate(); n = w.getnframes()
x = np.frombuffer(w.readframes(n), dtype=np.int16).reshape(-1, 2).astype(float) / 32768
mono = x.mean(axis=1)
# ffmpeg ebur128 short-term loudness (3 s window) sampled every 0.1 s
out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', 'public/audio/score.wav', '-af', 'ebur128=framelog=verbose', '-f', 'null', '-'], capture_output=True, text=True).stderr
pts = [(float(a), float(m), float(s)) for a, m, s in re.findall(r't:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+|-inf)\s+S:\s*(-?[\d.]+|-inf)', out.replace('-inf', '-70'))]
W_, H_ = 1800, 520
img = Image.new('RGB', (W_, H_ * 2 + 40), (14, 16, 22)); d = ImageDraw.Draw(img)
X = lambda t: int(t / TL['end'] * (W_ - 40)) + 20
# loudness: momentary (dim) and short-term (bright), -40..-5 LUFS
Y = lambda l: int(H_ - 20 - (max(-40, min(-5, l)) + 40) / 35 * (H_ - 40))
for i in range(1, len(pts)):
    d.line([X(pts[i-1][0]), Y(pts[i-1][1]), X(pts[i][0]), Y(pts[i][1])], fill=(70, 110, 150))
    d.line([X(pts[i-1][0]), Y(pts[i-1][2]), X(pts[i][0]), Y(pts[i][2])], fill=(120, 210, 255), width=2)
for l in (-10, -16, -23, -30):
    d.line([20, Y(l), W_ - 20, Y(l)], fill=(40, 44, 55)); d.text((W_ - 60, Y(l) - 12), f'{l}', fill=(120, 120, 130))
marks = {'dash': TL['hook']['surge'][0], 'vision': TL['vision']['line1In'], 'split': TL['ring']['split'][0], 'loop': TL['ring']['loop'][0],
         'unroll': TL['unroll']['roll'][0], 'W1': TL['route']['arrive'][0], 'W2': TL['route']['arrive'][1], 'W3': TL['route']['arrive'][2],
         'W4': TL['route']['arrive'][3], 'overview': TL['pullback']['move'][0], 'beyond': TL['beyond']['move'][0], '+': TL['ending']['brandIn']}
for k, t in marks.items():
    d.line([X(t), 0, X(t), H_ * 2 + 40], fill=(90, 70, 40)); d.text((X(t) + 3, 4), k, fill=(255, 200, 90))
# spectrogram (log-freq-ish)
f, tt, S = signal.spectrogram(mono, sr, nperseg=2048, noverlap=1024)
S = 10 * np.log10(S + 1e-12); S = np.clip((S + 110) / 80, 0, 1)
keep = f < 12000; S = S[keep][::-1]
spec = Image.fromarray((S * 255).astype(np.uint8)).resize((W_ - 40, H_)).convert('RGB')
img.paste(spec, (20, H_ + 40))
img.save('out/audio-check.jpg', quality=88)
peak = np.max(np.abs(x)); head = 20*np.log10(np.sqrt(np.mean(mono[:int(0.2*sr)]**2))+1e-9); tail = 20*np.log10(np.sqrt(np.mean(mono[-int(0.3*sr):]**2))+1e-9)
print(f'peak {20*np.log10(peak):.1f} dBFS | first 0.2s {head:.1f} dBFS rms | last 0.3s {tail:.1f} dBFS rms | clipped samples {(np.abs(x) > 0.999).sum()}')
