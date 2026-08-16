#!/usr/bin/env python3
"""Measure thresholded image differences at multiple scales."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any


def _pixels(image):
    getter = getattr(image, "get_flattened_data", None)
    return getter() if getter else image.getdata()


def _ratio(a_path: Path, b_path: Path, scale: float, threshold: float) -> float:
    from PIL import Image, ImageChops
    with Image.open(a_path).convert("RGB") as a0, Image.open(b_path).convert("RGB") as b0:
        width = max(a0.width, b0.width)
        height = max(a0.height, b0.height)
        a = Image.new("RGB", (width, height), "white")
        b = Image.new("RGB", (width, height), "white")
        a.paste(a0, (0, 0))
        b.paste(b0, (0, 0))
        if scale != 1.0:
            size = (max(1, round(width * scale)), max(1, round(height * scale)))
            a = a.resize(size, Image.Resampling.LANCZOS)
            b = b.resize(size, Image.Resampling.LANCZOS)
        delta = ImageChops.difference(a, b)
        cutoff = threshold * math.sqrt(3 * 255 * 255)
        changed = 0
        for r, g, bl in _pixels(delta):
            if math.sqrt(r*r + g*g + bl*bl) >= cutoff:
                changed += 1
        return changed / max(1, a.width * a.height)


def measure_multiscale(a: Path, b: Path, scales=(1.0, 0.5, 0.25), threshold=0.14) -> dict[str, Any]:
    ratios = {str(scale): round(_ratio(a, b, float(scale), threshold), 8) for scale in scales}
    return {"threshold": threshold, "ratios": ratios}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_a", type=Path)
    parser.add_argument("source_b", type=Path)
    parser.add_argument("--scales", default="1,0.5,0.25")
    parser.add_argument("--threshold", type=float, default=0.14)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)
    scales = tuple(float(item) for item in args.scales.split(",") if item.strip())
    result = measure_multiscale(args.source_a, args.source_b, scales, args.threshold)
    text = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    else:
        print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
