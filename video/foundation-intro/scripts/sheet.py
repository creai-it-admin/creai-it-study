import sys
from PIL import Image, ImageDraw
out, pairs = sys.argv[1], sys.argv[2:]
items = [(pairs[i], pairs[i + 1]) for i in range(0, len(pairs), 2)]
cols, w, h = 3, 640, 360
rows = (len(items) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 24)), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for i, (t, f) in enumerate(items):
    im = Image.open(f).convert('RGB').resize((w, h))
    x, y = (i % cols) * w, (i // cols) * (h + 24)
    sheet.paste(im, (x, y + 24))
    d.text((x + 6, y + 5), f't={float(t):.2f}s', fill=(255, 220, 90))
sheet.save(out, quality=88)
print(out, sheet.size)
