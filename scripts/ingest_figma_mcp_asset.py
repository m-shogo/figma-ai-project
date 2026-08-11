#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import BinaryIO, Protocol

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_URL_ENV = "FIGMA_MCP_ASSET_URL"
DEFAULT_MAX_BYTES = 25 * 1024 * 1024
USER_AGENT = "figma-ai-project-asset-intake/1.0"
ALLOWED_SOURCE_HOST = "www.figma.com"
ALLOWED_SOURCE_PREFIX = "/api/mcp/asset/"
ALLOWED_FORMATS = {"png", "jpeg", "gif", "webp", "svg"}


class AssetIntakeError(RuntimeError):
    pass


class ResponseHeaders(Protocol):
    def get(self, name: str, default: str | None = None) -> str | None: ...

    def get_content_type(self) -> str: ...


class AssetResponse(Protocol):
    headers: ResponseHeaders

    def read(self, size: int = -1) -> bytes: ...

    def __enter__(self) -> "AssetResponse": ...

    def __exit__(self, exc_type: object, exc: object, tb: object) -> object: ...


class AssetOpener(Protocol):
    def open(self, request: urllib.request.Request, timeout: int) -> AssetResponse: ...


class HttpsOnlyRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(
        self,
        req: urllib.request.Request,
        fp: BinaryIO,
        code: int,
        msg: str,
        headers: object,
        newurl: str,
    ) -> urllib.request.Request | None:
        parsed = urllib.parse.urlparse(newurl)
        if parsed.scheme.lower() != "https":
            raise AssetIntakeError("redirect target must use https")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


@dataclass(frozen=True)
class DownloadResult:
    sha256: str
    size_bytes: int
    content_type: str
    detected_format: str


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def validate_source_url(value: str) -> str:
    url = value.strip()
    if not url:
        raise AssetIntakeError("Figma MCP asset URL is empty")
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme.lower() != "https":
        raise AssetIntakeError("Figma MCP asset URL must use https")
    if parsed.hostname != ALLOWED_SOURCE_HOST:
        raise AssetIntakeError("Figma MCP asset URL host is not allowed")
    if parsed.username or parsed.password:
        raise AssetIntakeError("Figma MCP asset URL must not contain credentials")
    if not parsed.path.startswith(ALLOWED_SOURCE_PREFIX):
        raise AssetIntakeError("URL is not a Figma MCP asset endpoint")
    if parsed.fragment:
        raise AssetIntakeError("Figma MCP asset URL must not contain a fragment")
    return url


def source_url_from_args(args: argparse.Namespace) -> str:
    if args.url_stdin:
        return validate_source_url(sys.stdin.read())
    return validate_source_url(os.environ.get(args.url_env, ""))


def sniff_format(prefix: bytes, content_type: str = "") -> str:
    if prefix.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if prefix.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if prefix.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if len(prefix) >= 12 and prefix[:4] == b"RIFF" and prefix[8:12] == b"WEBP":
        return "webp"

    text = prefix[:4096].decode("utf-8", errors="ignore").lstrip("\ufeff \t\r\n").lower()
    if text.startswith("<svg") or (text.startswith("<?xml") and "<svg" in text):
        return "svg"

    normalized = content_type.split(";", 1)[0].strip().lower()
    by_type = {
        "image/png": "png",
        "image/jpeg": "jpeg",
        "image/jpg": "jpeg",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/svg+xml": "svg",
    }
    return by_type.get(normalized, "")


def portable_path(path: Path) -> str:
    resolved = path.resolve()
    try:
        return str(resolved.relative_to(ROOT))
    except ValueError:
        return str(resolved)


def manifest_path_for(output: Path, explicit: Path | None) -> Path:
    return explicit if explicit is not None else output.with_name(output.name + ".asset.json")


def build_manifest(
    *,
    output: Path,
    result: DownloadResult,
    file_key: str,
    node_id: str,
    logical_name: str,
) -> dict[str, object]:
    return {
        "schema_version": 1,
        "source_kind": "FIGMA_MCP_EPHEMERAL_ASSET",
        "source_url_persisted": False,
        "retrieved_at": utc_now(),
        "figma": {
            "file_key": file_key,
            "node_id": node_id,
            "logical_name": logical_name,
        },
        "artifact": {
            "path": portable_path(output),
            "sha256": result.sha256,
            "size_bytes": result.size_bytes,
            "content_type": result.content_type,
            "detected_format": result.detected_format,
        },
        "security": {
            "source_url_storage": "PROHIBITED",
            "source_url_transport": "STDIN_OR_ENV_ONLY",
            "redirect_policy": "HTTPS_ONLY",
        },
    }


def ensure_write_targets(output: Path, manifest: Path, *, force: bool) -> None:
    if output.resolve() == manifest.resolve():
        raise AssetIntakeError("asset output and manifest path must differ")
    for path in (output, manifest):
        if ".git" in path.resolve().parts:
            raise AssetIntakeError("refusing to write inside .git")
        if path.exists() and not force:
            raise AssetIntakeError(f"refusing to overwrite existing path: {portable_path(path)}")
        path.parent.mkdir(parents=True, exist_ok=True)


def default_opener() -> urllib.request.OpenerDirector:
    return urllib.request.build_opener(HttpsOnlyRedirectHandler())


def download_asset(
    *,
    url: str,
    output: Path,
    timeout: int,
    max_bytes: int,
    opener: AssetOpener | None = None,
) -> DownloadResult:
    if timeout <= 0:
        raise AssetIntakeError("timeout must be positive")
    if max_bytes <= 0:
        raise AssetIntakeError("max-bytes must be positive")

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "image/png,image/jpeg,image/gif,image/webp,image/svg+xml,application/octet-stream;q=0.8,*/*;q=0.1",
        },
    )
    active_opener = opener or default_opener()
    hasher = hashlib.sha256()
    total = 0
    prefix = bytearray()
    temp_path: Path | None = None

    try:
        with active_opener.open(request, timeout=timeout) as response:
            content_type = (response.headers.get("Content-Type", "") or "").split(";", 1)[0].strip().lower()
            declared_length_raw = response.headers.get("Content-Length", "") or ""
            if declared_length_raw.isdigit() and int(declared_length_raw) > max_bytes:
                raise AssetIntakeError("asset exceeds max-bytes before download")

            with tempfile.NamedTemporaryFile(
                mode="wb",
                dir=output.parent,
                prefix=f".{output.name}.",
                suffix=".part",
                delete=False,
            ) as handle:
                temp_path = Path(handle.name)
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    total += len(chunk)
                    if total > max_bytes:
                        raise AssetIntakeError("asset exceeds max-bytes during download")
                    if len(prefix) < 4096:
                        prefix.extend(chunk[: 4096 - len(prefix)])
                    hasher.update(chunk)
                    handle.write(chunk)

        if total == 0:
            raise AssetIntakeError("downloaded asset is empty")
        detected_format = sniff_format(bytes(prefix), content_type)
        if detected_format not in ALLOWED_FORMATS:
            raise AssetIntakeError("downloaded payload is not a supported image/SVG format")
        assert temp_path is not None
        os.replace(temp_path, output)
        temp_path = None
        return DownloadResult(
            sha256=hasher.hexdigest(),
            size_bytes=total,
            content_type=content_type or "application/octet-stream",
            detected_format=detected_format,
        )
    except urllib.error.HTTPError as exc:
        raise AssetIntakeError(f"Figma asset request failed with HTTP {exc.code}") from None
    except urllib.error.URLError as exc:
        reason = getattr(exc, "reason", None)
        reason_name = type(reason).__name__ if reason is not None else "network error"
        raise AssetIntakeError(f"Figma asset request failed: {reason_name}") from None
    finally:
        if temp_path is not None:
            try:
                temp_path.unlink(missing_ok=True)
            except OSError:
                pass


def write_manifest(path: Path, manifest: dict[str, object]) -> None:
    payload = json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
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
            handle.write(payload)
        os.replace(temp_path, path)
        temp_path = None
    finally:
        if temp_path is not None:
            try:
                temp_path.unlink(missing_ok=True)
            except OSError:
                pass


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Persist a short-lived Figma MCP asset without storing its source URL in Git or logs."
    )
    parser.add_argument("--output", type=Path, required=True, help="Destination image/SVG path")
    parser.add_argument("--manifest", type=Path, help="Manifest path; defaults to <output>.asset.json")
    parser.add_argument("--url-stdin", action="store_true", help="Read the short-lived URL from stdin instead of the environment")
    parser.add_argument("--url-env", default=DEFAULT_URL_ENV, help=f"Environment variable containing the URL (default: {DEFAULT_URL_ENV})")
    parser.add_argument("--file-key", default="", help="Non-secret Figma file key for lineage")
    parser.add_argument("--node-id", default="", help="Non-secret Figma node id for lineage")
    parser.add_argument("--logical-name", default="", help="Stable logical asset name/role")
    parser.add_argument("--timeout", type=int, default=30, help="Network timeout seconds")
    parser.add_argument("--max-bytes", type=int, default=DEFAULT_MAX_BYTES, help="Maximum accepted asset bytes")
    parser.add_argument("--force", action="store_true", help="Allow replacing an existing asset and manifest")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    output = args.output if args.output.is_absolute() else ROOT / args.output
    explicit_manifest = None
    if args.manifest is not None:
        explicit_manifest = args.manifest if args.manifest.is_absolute() else ROOT / args.manifest
    manifest_path = manifest_path_for(output, explicit_manifest)

    try:
        ensure_write_targets(output, manifest_path, force=args.force)
        url = source_url_from_args(args)
        result = download_asset(
            url=url,
            output=output,
            timeout=args.timeout,
            max_bytes=args.max_bytes,
        )
        manifest = build_manifest(
            output=output,
            result=result,
            file_key=str(args.file_key).strip(),
            node_id=str(args.node_id).strip(),
            logical_name=str(args.logical_name).strip(),
        )
        write_manifest(manifest_path, manifest)
    except AssetIntakeError as exc:
        print(f"FAIL Figma asset intake: {exc}", file=sys.stderr)
        return 1

    print(
        "PASS Figma asset intake "
        f"path={portable_path(output)} format={result.detected_format} "
        f"bytes={result.size_bytes} sha256={result.sha256} "
        f"manifest={portable_path(manifest_path)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
