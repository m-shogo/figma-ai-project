#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import binascii
import hashlib
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from ingest_figma_mcp_asset import portable_path, sniff_format

ROOT = Path(__file__).resolve().parents[1]
CONTENT_TYPES = {
    "png": "image/png",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp",
    "svg": "image/svg+xml",
}


class AssemblyError(RuntimeError):
    pass


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def chunk_paths(directory: Path) -> list[Path]:
    if not directory.is_dir():
        raise AssemblyError(f"chunk directory not found: {directory}")
    paths = sorted(directory.glob("*.b64"))
    if not paths:
        raise AssemblyError("no *.b64 chunk files found")
    return paths


def decode_chunk(path: Path) -> bytes:
    try:
        payload = "".join(path.read_text(encoding="ascii").split())
    except (OSError, UnicodeDecodeError) as exc:
        raise AssemblyError(f"cannot read chunk {path.name}: {type(exc).__name__}") from None
    if not payload:
        raise AssemblyError(f"chunk is empty: {path.name}")
    try:
        return base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError):
        raise AssemblyError(f"chunk is not valid base64: {path.name}") from None


def resolve_repo_path(path: Path) -> Path:
    resolved = path.resolve() if path.is_absolute() else (ROOT / path).resolve()
    root = ROOT.resolve()
    if resolved != root and root not in resolved.parents:
        raise AssemblyError("output path must remain inside repository root")
    return resolved


def ensure_targets(output: Path, manifest: Path, *, force: bool) -> None:
    if output.resolve() == manifest.resolve():
        raise AssemblyError("asset output and manifest path must differ")
    for path in (output, manifest):
        if ".git" in path.resolve().parts:
            raise AssemblyError("refusing to write inside .git")
        if path.exists() and not force:
            raise AssemblyError(f"refusing to overwrite existing path: {portable_path(path)}")
        path.parent.mkdir(parents=True, exist_ok=True)


def assemble_chunks(paths: list[Path], output: Path) -> tuple[str, int, str]:
    hasher = hashlib.sha256()
    total = 0
    prefix = bytearray()
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            dir=output.parent,
            prefix=f".{output.name}.",
            suffix=".part",
            delete=False,
        ) as handle:
            temp_path = Path(handle.name)
            for path in paths:
                decoded = decode_chunk(path)
                if len(prefix) < 4096:
                    prefix.extend(decoded[: 4096 - len(prefix)])
                hasher.update(decoded)
                total += len(decoded)
                handle.write(decoded)
        if total <= 0:
            raise AssemblyError("assembled asset is empty")
        detected = sniff_format(bytes(prefix))
        if detected not in CONTENT_TYPES:
            raise AssemblyError("assembled bytes are not a supported image/SVG format")
        assert temp_path is not None
        os.replace(temp_path, output)
        temp_path = None
        return hasher.hexdigest(), total, detected
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


def build_manifest(
    *,
    output: Path,
    sha256: str,
    size_bytes: int,
    detected_format: str,
    file_key: str,
    node_id: str,
    logical_name: str,
    export_format: str,
    chunk_count: int,
) -> dict[str, object]:
    return {
        "schema_version": 1,
        "source_kind": "FIGMA_PLUGIN_RENDERED_EXPORT",
        "source_url_persisted": False,
        "retrieved_at": utc_now(),
        "figma": {
            "file_key": file_key,
            "node_id": node_id,
            "logical_name": logical_name,
            "export_method": "node.exportAsync",
            "export_format": export_format,
        },
        "artifact": {
            "path": portable_path(output),
            "sha256": sha256,
            "size_bytes": size_bytes,
            "content_type": CONTENT_TYPES[detected_format],
            "detected_format": detected_format,
        },
        "security": {
            "source_url_storage": "NOT_APPLICABLE",
            "source_url_transport": "NOT_USED",
            "transport": "FIGMA_PLUGIN_BASE64_CHUNKS",
            "chunk_count": chunk_count,
        },
        "provenance": {
            "asset_semantics": "RENDERED_VISIBLE_NODE_NOT_RAW_SOURCE",
            "cms_source_authority": False,
            "intended_use": "VISUAL_FIXTURE",
        },
    }


def write_json_atomic(path: Path, payload: dict[str, object]) -> None:
    text = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".part",
            delete=False,
        ) as handle:
            temp_path = Path(handle.name)
            handle.write(text)
        os.replace(temp_path, path)
        temp_path = None
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Assemble URL-less Figma Plugin API base64 chunks into a rendered visual asset."
    )
    parser.add_argument("--chunks-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--file-key", required=True)
    parser.add_argument("--node-id", required=True)
    parser.add_argument("--logical-name", required=True)
    parser.add_argument("--export-format", choices=["PNG", "JPG"], required=True)
    parser.add_argument("--expected-size", type=int)
    parser.add_argument("--expected-sha256")
    parser.add_argument("--force", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    output = resolve_repo_path(args.output)
    manifest = resolve_repo_path(args.manifest) if args.manifest else output.with_name(output.name + ".asset.json")
    chunks_dir = args.chunks_dir.resolve() if args.chunks_dir.is_absolute() else (ROOT / args.chunks_dir).resolve()

    try:
        ensure_targets(output, manifest, force=args.force)
        paths = chunk_paths(chunks_dir)
        sha256, size_bytes, detected_format = assemble_chunks(paths, output)
        if args.expected_size is not None and size_bytes != args.expected_size:
            output.unlink(missing_ok=True)
            raise AssemblyError(
                f"assembled size mismatch: expected {args.expected_size}, got {size_bytes}"
            )
        expected_sha = str(args.expected_sha256 or "").strip().lower()
        if expected_sha and sha256 != expected_sha:
            output.unlink(missing_ok=True)
            raise AssemblyError("assembled SHA-256 does not match --expected-sha256")
        payload = build_manifest(
            output=output,
            sha256=sha256,
            size_bytes=size_bytes,
            detected_format=detected_format,
            file_key=args.file_key.strip(),
            node_id=args.node_id.strip(),
            logical_name=args.logical_name.strip(),
            export_format=args.export_format,
            chunk_count=len(paths),
        )
        write_json_atomic(manifest, payload)
    except AssemblyError as exc:
        print(f"FAIL Figma plugin asset assembly: {exc}", file=sys.stderr)
        return 1

    print(
        "PASS Figma plugin asset assembly "
        f"path={portable_path(output)} bytes={size_bytes} sha256={sha256} "
        f"chunks={len(paths)} manifest={portable_path(manifest)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
