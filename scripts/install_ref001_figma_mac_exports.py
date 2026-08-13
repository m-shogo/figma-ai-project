#!/usr/bin/env python3
"""Validate staged REF-001 Figma PNG exports and install them atomically.

The Figma connector/REST download step must put the 32 rendered PNGs in a
temporary directory using the canonical basenames from the registry.  This
script never handles a Figma token or temporary render URL.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import struct
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "research/figma-assets/ref001/rendered-asset-registry.json"
DEFAULT_REPORT = ROOT / "research/figma-assets/ref001/mac-local-export-report.json"
DEFAULT_BACKUP_REF = "origin/backup/ref001-drive-bridge-assets-20260813"


def fail(message: str) -> None:
    raise SystemExit(f"REF-001 Mac local export: {message}")


def git_bytes(ref: str, path: str) -> bytes:
    result = subprocess.run(
        ["git", "show", f"{ref}:{path}"],
        cwd=ROOT,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode:
        fail(f"could not read {ref}:{path}: {result.stderr.decode(errors='replace').strip()}")
    return result.stdout


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def rgba_sha256(path: Path) -> str:
    with tempfile.TemporaryDirectory() as temporary_dir:
        normalized = Path(temporary_dir) / "normalized.tiff"
        convert = subprocess.run(
            ["sips", "-s", "format", "tiff", str(path), "--out", str(normalized)],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        if convert.returncode:
            fail(f"could not decode {path}: {convert.stderr.decode(errors='replace').strip()}")
        result = subprocess.run(
            [
                "ffmpeg",
                "-v",
                "error",
                "-i",
                str(normalized),
                "-f",
                "rawvideo",
                "-pix_fmt",
                "rgba",
                "-",
            ],
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        if result.returncode:
            fail(f"could not normalize {path}: {result.stderr.decode(errors='replace').strip()}")
        return sha256(result.stdout)


def inspect_png(path: Path, expected_width: int, expected_height: int) -> tuple[bytes, str]:
    data = path.read_bytes()
    if not data:
        fail(f"empty PNG: {path}")
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        fail(f"invalid PNG signature: {path}")
    if len(data) < 33 or data[12:16] != b"IHDR":
        fail(f"missing IHDR: {path}")
    width, height = struct.unpack(">II", data[16:24])
    if (width, height) != (expected_width, expected_height):
        fail(
            f"dimension mismatch for {path.name}: {width}x{height} != "
            f"{expected_width}x{expected_height}"
        )
    if data[-12:-8] != b"\x00\x00\x00\x00" or data[-8:-4] != b"IEND":
        fail(f"PNG does not end with IEND: {path}")
    return data, rgba_sha256(path)


def pixel_sha256_bytes(data: bytes, suffix: str) -> str:
    with tempfile.NamedTemporaryFile(suffix=suffix) as temp:
        temp.write(data)
        temp.flush()
        return rgba_sha256(Path(temp.name))


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
    parser.add_argument("--backup-ref", default=DEFAULT_BACKUP_REF)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    if shutil.which("ffmpeg") is None:
        fail("ffmpeg is required for normalized RGBA pixel comparison")
    if shutil.which("sips") is None:
        fail("sips is required for macOS image decoding")

    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    assets = registry.get("assets", [])
    if len(assets) != 32:
        fail(f"registry must define 32 assets; got {len(assets)}")
    if {asset["viewport"] for asset in assets} != {"pc", "sp"}:
        fail("registry must contain pc and sp assets")
    for viewport in ("pc", "sp"):
        count = sum(asset["viewport"] == viewport for asset in assets)
        if count != 16:
            fail(f"registry must define 16 {viewport} assets; got {count}")

    expected_names = {Path(asset["path"]).name for asset in assets}
    actual_names = {path.name for path in args.staging_dir.glob("*.png")}
    if actual_names != expected_names:
        missing = sorted(expected_names - actual_names)
        extra = sorted(actual_names - expected_names)
        fail(f"staging inventory mismatch; missing={missing}, extra={extra}")

    report_assets: list[dict[str, object]] = []
    staged_data: dict[str, bytes] = {}
    for asset in assets:
        source = args.staging_dir / Path(asset["path"]).name
        new_data, new_pixel_sha256 = inspect_png(source, asset["width"], asset["height"])
        backup_data = git_bytes(args.backup_ref, asset["path"])
        backup_pixel_sha256 = pixel_sha256_bytes(backup_data, ".png")
        staged_data[asset["path"]] = new_data
        report_assets.append(
            {
                "slot": asset["slot"],
                "viewport": asset["viewport"],
                "node_id": asset["node_id"],
                "path": asset["path"],
                "width": asset["width"],
                "height": asset["height"],
                "new_bytes": len(new_data),
                "backup_bytes": len(backup_data),
                "new_sha256": sha256(new_data),
                "backup_sha256": sha256(backup_data),
                "exact_byte_match": new_data == backup_data,
                "new_pixel_sha256": new_pixel_sha256,
                "backup_pixel_sha256": backup_pixel_sha256,
                "pixel_exact_match": new_pixel_sha256 == backup_pixel_sha256,
            }
        )

    exact_bytes = sum(bool(asset["exact_byte_match"]) for asset in report_assets)
    exact_pixels = sum(bool(asset["pixel_exact_match"]) for asset in report_assets)
    report = {
        "schema_version": 1,
        "reference_id": "REF-001",
        "exported_at_utc": datetime.now(timezone.utc).isoformat(),
        "source": {
            "figma_file_key": registry["source"]["figma_file_key"],
            "method": "FIGMA_CONNECTOR_RENDER_TO_MAC_LOCAL",
            "format": "png",
            "scale": 1,
        },
        "transport": {
            "google_drive_used": False,
            "drive_desktop_used": False,
            "backup_ref": args.backup_ref,
        },
        "validation": {
            "assets": len(report_assets),
            "pc_assets": sum(asset["viewport"] == "pc" for asset in report_assets),
            "sp_assets": sum(asset["viewport"] == "sp" for asset in report_assets),
            "png_integrity": "PASS",
            "dimensions": "PASS",
            "registry_mapping": "PASS",
        },
        "comparison": {
            "assets": len(report_assets),
            "exact_byte_matches": exact_bytes,
            "exact_byte_differences": len(report_assets) - exact_bytes,
            "pixel_exact_matches": exact_pixels,
            "pixel_differences": len(report_assets) - exact_pixels,
            "pixel_normalization": "macOS sips TIFF decode, then ffmpeg RGBA rawvideo",
            "rule": "byte mismatch is not a visual failure; pixel mismatch requires visual QA against live Figma",
        },
        "assets": report_assets,
    }

    if args.apply:
        for repo_path, data in staged_data.items():
            atomic_write(ROOT / repo_path, data)
        report_bytes = (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode()
        atomic_write(args.report, report_bytes)
    else:
        print(json.dumps(report["validation"], indent=2))
        print(json.dumps(report["comparison"], indent=2))


if __name__ == "__main__":
    main()
