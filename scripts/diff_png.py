#!/usr/bin/env python3
from pathlib import Path
import math
import sys
from PIL import Image, ImageChops

source_a = Path(sys.argv[1])
source_b = Path(sys.argv[2])
target = Path(sys.argv[3])
threshold = float(sys.argv[4]) if len(sys.argv) > 4 else 0.14

with Image.open(source_a).convert('RGB') as a0, Image.open(source_b).convert('RGB') as b0:
    width = max(a0.width, b0.width)
    height = max(a0.height, b0.height)
    a = Image.new('RGB', (width, height), 'white')
    b = Image.new('RGB', (width, height), 'white')
    a.paste(a0, (0, 0))
    b.paste(b0, (0, 0))
    delta = ImageChops.difference(a, b)
    out = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    cutoff = threshold * math.sqrt(3 * 255 * 255)
    changed = 0
    dp = delta.load(); ap = a.load(); bp = b.load(); op = out.load()
    for y in range(height):
        for x in range(width):
            r, g, bl = dp[x, y]
            if math.sqrt(r*r + g*g + bl*bl) >= cutoff:
                op[x, y] = (255, 35, 35, 235)
                changed += 1
            else:
                ar, ag, ab = ap[x, y]; br, bg, bb = bp[x, y]
                gray = round((ar + ag + ab + br + bg + bb) / 6)
                op[x, y] = (gray, gray, gray, 45)
    target.parent.mkdir(parents=True, exist_ok=True)
    out.save(target)
    print(f'{changed / max(1, width * height):.8f}')
