"""Film-grain tiles: breaks up banding in the dark gradients after H.264 compression."""
import numpy as np
from PIL import Image

rng = np.random.default_rng(7)
for i in range(6):
    noise = rng.normal(128, 38, (1080, 1920)).clip(0, 255).astype(np.uint8)
    Image.fromarray(noise, 'L').save(f'public/grain-{i}.png')
