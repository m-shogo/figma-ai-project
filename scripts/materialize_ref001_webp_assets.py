#!/usr/bin/env python3
"""Build and atomically install REF-001 lossless WebP assets.

Inputs are the complete Figma PNG staging export plus the two original
high-resolution transparent CTA person images.  The CTA sources are composed
onto transparent canvases using placement geometry recorded in the registry;
no background removal or generative image processing is performed here.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "research/figma-assets/ref001/rendered-asset-registry.json"
DEFAULT_REPORT = ROOT / "research/figma-assets/ref001/webp-export-report.json"


def fail(message: str) -> None:
    raise SystemExit(f"REF-001 WebP materialization: {message}")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def scaled(value: int | float, scale: int) -> int:
    return int((Decimal(str(value)) * scale).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def load_rgba(path: Path, expected_size: tuple[int, int] | None = None) -> Image.Image:
    try:
        with Image.open(path) as opened:
            opened.load()
            image = opened.convert("RGBA")
    except Exception as exc:  # Pillow exposes decoder-specific exception classes.
        fail(f"decode failed for {path}: {exc}")
    if expected_size and image.size != expected_size:
        fail(f"dimension mismatch for {path.name}: {image.size} != {expected_size}")
    return image


def compose_cta(source: Image.Image, asset: dict[str, object]) -> Image.Image:
    scale = int(asset["scale"])
    placement = asset.get("alpha_source", {}).get("placement")
    if not isinstance(placement, dict):
        fail(f"missing CTA alpha placement for {asset['slot']}.{asset['viewport']}")
    person_size = (scaled(placement["width"], scale), scaled(placement["height"], scale))
    person = source.resize(person_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (int(asset["source_width"]), int(asset["source_height"])), (0, 0, 0, 0))
    canvas.alpha_composite(person, dest=(scaled(placement["x"], scale), scaled(placement["y"], scale)))
    return canvas


def encode_lossless_webp(source_png: Path, output: Path) -> None:
    result = subprocess.run(
        ["cwebp", "-quiet", "-lossless", "-exact", "-z", "9", str(source_png), "-o", str(output)],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if result.returncode:
        fail(f"cwebp failed for {source_png.name}: {result.stderr.strip()}")


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as output:
            output.write(data)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary_name, path)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("staging_dir", type=Path)
    parser.add_argument("--cta-left-source", type=Path, required=True)
    parser.add_argument("--cta-right-source", type=Path, required=True)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    if shutil.which("cwebp") is None:
        fail("cwebp is required")

    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    assets = registry.get("assets", [])
    if len(assets) != 32:
        fail(f"registry must define 32 assets; got {len(assets)}")

    alpha_sources = {
        "cta-person-left": args.cta_left_source,
        "cta-person-right": args.cta_right_source,
    }
    decoded_alpha_sources: dict[str, Image.Image] = {}
    for slot, path in alpha_sources.items():
        expected_hash = registry["cta_alpha_sources"][slot]["sha256"]
        if sha256(path) != expected_hash:
            fail(f"CTA raw source hash mismatch for {slot}")
        decoded_alpha_sources[slot] = load_rgba(path)
        if decoded_alpha_sources[slot].getchannel("A").getextrema()[0] == 255:
            fail(f"CTA raw source lacks transparent pixels: {slot}")

    report_assets: list[dict[str, object]] = []
    prepared: dict[str, bytes] = {}
    legacy_paths: list[Path] = []
    with tempfile.TemporaryDirectory(prefix="ref001-webp-build-") as build_dir_name:
        build_dir = Path(build_dir_name)
        for asset in assets:
            output_name = Path(str(asset["path"])).name
            source_name = output_name.removesuffix(".webp") + ".png"
            staged_png = args.staging_dir / source_name
            expected_size = (int(asset["source_width"]), int(asset["source_height"]))

            if str(asset["slot"]).startswith("cta-person-"):
                source_image = compose_cta(decoded_alpha_sources[str(asset["slot"])], asset)
                staged_sha = sha256(alpha_sources[str(asset["slot"])])
            else:
                source_image = load_rgba(staged_png, expected_size)
                staged_sha = sha256(staged_png)

            if source_image.size != expected_size:
                fail(f"prepared size mismatch for {asset['slot']}.{asset['viewport']}")
            alpha_extrema = source_image.getchannel("A").getextrema()
            if asset.get("alpha_required") and alpha_extrema[0] == 255:
                fail(f"transparent pixels required for {asset['slot']}.{asset['viewport']}")

            normalized_png = build_dir / (output_name + ".png")
            webp_path = build_dir / output_name
            source_image.save(normalized_png, format="PNG")
            encode_lossless_webp(normalized_png, webp_path)
            decoded_webp = load_rgba(webp_path, expected_size)
            if decoded_webp.tobytes() != source_image.tobytes():
                fail(f"lossless WebP RGBA mismatch for {asset['slot']}.{asset['viewport']}")
            webp_alpha = decoded_webp.getchannel("A").getextrema()
            if asset.get("alpha_required") and webp_alpha[0] == 255:
                fail(f"encoded WebP lost transparency for {asset['slot']}.{asset['viewport']}")

            canonical_path = ROOT / str(asset["path"])
            prepared[str(asset["path"])] = webp_path.read_bytes()
            asset["sha256"] = sha256(webp_path)
            legacy_paths.append(ROOT / str(asset["legacy_png_path"]))
            report_assets.append(
                {
                    "slot": asset["slot"],
                    "viewport": asset["viewport"],
                    "node_id": asset["node_id"],
                    "path": asset["path"],
                    "display_width": asset["display_width"],
                    "display_height": asset["display_height"],
                    "source_width": asset["source_width"],
                    "source_height": asset["source_height"],
                    "scale": asset["scale"],
                    "staging_sha256": staged_sha,
                    "webp_sha256": sha256(webp_path),
                    "webp_bytes": webp_path.stat().st_size,
                    "lossless_rgba_match": True,
                    "alpha_extrema": list(webp_alpha),
                    "transparent_pixels_required": bool(asset.get("alpha_required")),
                    "canonical_path": str(canonical_path.relative_to(ROOT)),
                }
            )

    report = {
        "schema_version": 1,
        "reference_id": "REF-001",
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "source": {
            "figma_file_key": registry["source"]["figma_file_key"],
            "method": "FIGMA_PNG_STAGING_TO_MAC_LOCAL_LOSSLESS_WEBP",
            "pc_scale": 1,
            "sp_scale": 3,
            "cta_alpha_method": "FIGMA_ORIGINAL_RGBA_SOURCE_WITH_RECORDED_LAYER_PLACEMENT",
        },
        "encoder": {"name": "cwebp", "mode": "lossless", "exact_transparent_rgb": True, "preset": "z9"},
        "transport": {"google_drive_used": False, "temporary_urls_persisted": False},
        "validation": {
            "assets": 32,
            "pc_assets": 16,
            "sp_assets": 16,
            "webp_decode": "PASS",
            "dimensions": "PASS",
            "lossless_rgba_roundtrip": "PASS",
            "cta_transparency": "PASS",
        },
        "assets": report_assets,
    }

    if args.apply:
        for repo_path, data in prepared.items():
            atomic_write(ROOT / repo_path, data)
        atomic_write(REGISTRY, (json.dumps(registry, ensure_ascii=False, indent=2) + "\n").encode())
        atomic_write(args.report, (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode())
        for legacy_path in legacy_paths:
            if legacy_path.exists():
                legacy_path.unlink()
    else:
        print(json.dumps(report["validation"], indent=2))


if __name__ == "__main__":
    main()
