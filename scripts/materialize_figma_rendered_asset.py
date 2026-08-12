#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import binascii
import hashlib
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import ingest_figma_mcp_asset as intake  # noqa: E402


class MaterializeError(RuntimeError):
    pass


def read_chunks(chunk_dir: Path) -> bytes:
    if not chunk_dir.is_dir():
        raise MaterializeError(f"chunk directory does not exist: {chunk_dir}")
    chunks = sorted(path for path in chunk_dir.iterdir() if path.is_file() and path.suffix == ".b64")
    if not chunks:
        raise MaterializeError(f"no .b64 chunks found: {chunk_dir}")
    encoded = "".join(path.read_text(encoding="ascii").strip() for path in chunks)
    try:
        return base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise MaterializeError("invalid base64 staging payload") from exc


def resolve_manifest_path(output: Path, explicit: Path | None) -> Path:
    return explicit or output.with_name(output.name + ".asset.json")


def validate_payload(
    payload: bytes,
    *,
    expected_format: str,
    min_bytes: int,
    expected_size: int | None,
    expected_sha256: str,
) -> tuple[str, str]:
    detected = intake.sniff_format(payload, f"image/{expected_format}" if expected_format != "svg" else "image/svg+xml")
    if detected != expected_format:
        raise MaterializeError(f"format mismatch: expected {expected_format}, detected {detected or 'unknown'}")
    if len(payload) < min_bytes:
        raise MaterializeError(f"payload too small: {len(payload)} < {min_bytes} bytes")
    if expected_size is not None and len(payload) != expected_size:
        raise MaterializeError(f"size mismatch: expected {expected_size}, got {len(payload)}")
    digest = hashlib.sha256(payload).hexdigest()
    if expected_sha256 and digest.lower() != expected_sha256.lower():
        raise MaterializeError("sha256 mismatch")
    return detected, digest


def materialize(
    *,
    chunk_dir: Path,
    output: Path,
    manifest_path: Path | None,
    file_key: str,
    node_id: str,
    logical_name: str,
    expected_format: str,
    min_bytes: int,
    expected_size: int | None = None,
    expected_sha256: str = "",
    force: bool = False,
) -> dict:
    manifest = resolve_manifest_path(output, manifest_path)
    intake.ensure_write_targets(output, manifest, force=force)
    payload = read_chunks(chunk_dir)
    detected, digest = validate_payload(
        payload,
        expected_format=expected_format,
        min_bytes=min_bytes,
        expected_size=expected_size,
        expected_sha256=expected_sha256,
    )

    output.parent.mkdir(parents=True, exist_ok=True)
    manifest.parent.mkdir(parents=True, exist_ok=True)
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            prefix=f".{output.name}.",
            suffix=".part",
            dir=output.parent,
            delete=False,
        ) as handle:
            temp_path = Path(handle.name)
            handle.write(payload)
            handle.flush()
        temp_path.replace(output)
        temp_path = None

        content_type = "image/svg+xml" if detected == "svg" else f"image/{'jpeg' if detected == 'jpeg' else detected}"
        result = intake.DownloadResult(
            sha256=digest,
            size_bytes=len(payload),
            content_type=content_type,
            detected_format=detected,
        )
        record = intake.build_manifest(
            output=output,
            result=result,
            file_key=file_key,
            node_id=node_id,
            logical_name=logical_name,
        )
        record.setdefault("lineage", {})["materialization"] = "PLUGIN_RENDERED_BASE64_STAGING"
        record["lineage"]["staging_committed_in_final_tree"] = False
        record.setdefault("security", {})["source_url_persisted"] = False
        intake.write_manifest(manifest, record)
        return record
    except Exception:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)
        if output.exists() and not force:
            output.unlink(missing_ok=True)
        manifest.unlink(missing_ok=True)
        raise


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(
        description="Materialize Figma plugin/MCP rendered image bytes from strict base64 chunks without persisting ephemeral source URLs."
    )
    value.add_argument("--chunk-dir", type=Path, required=True)
    value.add_argument("--output", type=Path, required=True)
    value.add_argument("--manifest", type=Path)
    value.add_argument("--file-key", required=True)
    value.add_argument("--node-id", required=True)
    value.add_argument("--logical-name", required=True)
    value.add_argument("--expected-format", choices=("png", "jpeg", "gif", "webp", "svg"), required=True)
    value.add_argument("--min-bytes", type=int, default=1)
    value.add_argument("--expected-size", type=int)
    value.add_argument("--expected-sha256", default="")
    value.add_argument("--force", action="store_true")
    return value


def main() -> int:
    args = parser().parse_args()
    try:
        record = materialize(
            chunk_dir=args.chunk_dir,
            output=args.output,
            manifest_path=args.manifest,
            file_key=args.file_key,
            node_id=args.node_id,
            logical_name=args.logical_name,
            expected_format=args.expected_format,
            min_bytes=args.min_bytes,
            expected_size=args.expected_size,
            expected_sha256=args.expected_sha256,
            force=args.force,
        )
    except (MaterializeError, intake.AssetIntakeError, OSError) as exc:
        print(f"FAIL rendered asset materialization: {exc}", file=sys.stderr)
        return 1

    artifact = record.get("artifact", {})
    print(
        "PASS rendered asset materialized "
        f"path={artifact.get('path', args.output)} "
        f"bytes={artifact.get('size_bytes')} "
        f"sha256={artifact.get('sha256')}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
