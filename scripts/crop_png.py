#!/usr/bin/env python3
from pathlib import Path
import sys
from PIL import Image

source = Path(sys.argv[1])
target = Path(sys.argv[2])
x, y, width, height = map(int, sys.argv[3:7])
target.parent.mkdir(parents=True, exist_ok=True)
with Image.open(source) as image:
    image.crop((x, y, x + width, y + height)).save(target)
