"""Filmstrip of a time range from the rendered film: python3 scripts/strip.py name start end step"""
import subprocess, sys
from PIL import Image, ImageDraw
name, a, b, step = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
src = 'out/creaiit-foundation-intro-1080p60.mp4'
times, t = [], a
while t <= b + 1e-6:
    times.append(round(t, 3)); t += step
w, h, cols = 480, 270, 4
rows = (len(times) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 20)), (18, 18, 18))
d = ImageDraw.Draw(sheet)
for i, tt in enumerate(times):
    f = f'out/strips/{name}-{i}.png'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(tt), '-i', src, '-frames:v', '1', '-vf', f'scale={w}:{h}', f], check=True)
    x, y = (i % cols) * w, (i // cols) * (h + 20)
    sheet.paste(Image.open(f), (x, y + 20)); d.text((x + 5, y + 4), f'{tt:.2f}s', fill=(255, 220, 90))
sheet.save(f'out/strip-{name}.jpg', quality=85); print(f'out/strip-{name}.jpg', len(times))
