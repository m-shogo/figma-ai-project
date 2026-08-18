from __future__ import annotations

import hashlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import ingest_figma_mcp_asset as intake  # noqa: E402


VALID_URL = "https://" + "www.figma.com" + "/api/mcp/asset/11111111-2222-3333-4444-555555555555"
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"ref001-test-png"
JPEG_BYTES = b"\xff\xd8\xff\xe0" + b"ref001-test-jpeg"
GIF_BYTES = b"GIF89a" + b"ref001-test-gif"
WEBP_BYTES = b"RIFF\x10\x00\x00\x00WEBP" + b"ref001"
SVG_BYTES = b'<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>'


class FakeHeaders:
    def __init__(self, values: dict[str, str]) -> None:
        self.values = values

    def get(self, name: str, default: str | None = None) -> str | None:
        return self.values.get(name, default)

    def get_content_type(self) -> str:
        return (self.values.get("Content-Type", "") or "").split(";", 1)[0]


class FakeResponse:
    def __init__(self, payload: bytes, *, content_type: str = "application/octet-stream") -> None:
        self.buffer = io.BytesIO(payload)
        self.headers = FakeHeaders(
            {
                "Content-Type": content_type,
                "Content-Length": str(len(payload)),
            }
        )

    def read(self, size: int = -1) -> bytes:
        return self.buffer.read(size)

    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, exc_type: object, exc: object, tb: object) -> bool:
        return False


class FakeOpener:
    def __init__(self, response: FakeResponse) -> None:
        self.response = response
        self.requests: list[object] = []

    def open(self, request: object, timeout: int) -> FakeResponse:
        self.requests.append((request, timeout))
        return self.response


class SourceUrlValidationTests(unittest.TestCase):
    def test_accepts_figma_mcp_https_asset_url(self) -> None:
        self.assertEqual(intake.validate_source_url(VALID_URL), VALID_URL)

    def test_rejects_non_https(self) -> None:
        with self.assertRaisesRegex(intake.AssetIntakeError, "https"):
            intake.validate_source_url(VALID_URL.replace("https://", "http://"))

    def test_rejects_other_host(self) -> None:
        with self.assertRaisesRegex(intake.AssetIntakeError, "host"):
            intake.validate_source_url("https://example.com/api/mcp/asset/secret")

    def test_rejects_embedded_credentials(self) -> None:
        with self.assertRaisesRegex(intake.AssetIntakeError, "credentials"):
            intake.validate_source_url("https://user:pass@www.figma.com/api/mcp/asset/secret")

    def test_rejects_non_asset_figma_path(self) -> None:
        with self.assertRaisesRegex(intake.AssetIntakeError, "asset endpoint"):
            intake.validate_source_url("https://www.figma.com/file/example")

    def test_rejects_fragment(self) -> None:
        with self.assertRaisesRegex(intake.AssetIntakeError, "fragment"):
            intake.validate_source_url(VALID_URL + "#leak")


class FormatSniffTests(unittest.TestCase):
    def test_sniffs_supported_formats(self) -> None:
        cases = [
            (PNG_BYTES, "png"),
            (JPEG_BYTES, "jpeg"),
            (GIF_BYTES, "gif"),
            (WEBP_BYTES, "webp"),
            (SVG_BYTES, "svg"),
        ]
        for payload, expected in cases:
            with self.subTest(expected=expected):
                self.assertEqual(intake.sniff_format(payload), expected)

    def test_uses_content_type_as_fallback(self) -> None:
        self.assertEqual(intake.sniff_format(b"not-enough-magic", "image/png"), "png")

    def test_rejectable_payload_has_empty_format(self) -> None:
        self.assertEqual(intake.sniff_format(b"plain text", "text/plain"), "")


class DownloadTests(unittest.TestCase):
    def test_download_writes_bytes_hash_and_format_without_url_output(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp).resolve() / "asset.png"
            opener = FakeOpener(FakeResponse(PNG_BYTES, content_type="image/png"))

            result = intake.download_asset(
                url=VALID_URL,
                output=output,
                timeout=7,
                max_bytes=1024,
                opener=opener,
            )

            self.assertEqual(output.read_bytes(), PNG_BYTES)
            self.assertEqual(result.detected_format, "png")
            self.assertEqual(result.size_bytes, len(PNG_BYTES))
            self.assertEqual(result.sha256, hashlib.sha256(PNG_BYTES).hexdigest())
            self.assertNotIn(VALID_URL, repr(result))
            self.assertEqual(len(opener.requests), 1)

    def test_declared_size_over_limit_leaves_no_output_or_part_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            output = root / "too-large.png"
            opener = FakeOpener(FakeResponse(PNG_BYTES, content_type="image/png"))

            with self.assertRaisesRegex(intake.AssetIntakeError, "max-bytes"):
                intake.download_asset(
                    url=VALID_URL,
                    output=output,
                    timeout=7,
                    max_bytes=4,
                    opener=opener,
                )

            self.assertFalse(output.exists())
            self.assertEqual(list(root.glob("*.part")), [])
            self.assertEqual(list(root.glob(".*.part")), [])

    def test_unsupported_payload_leaves_no_output_or_part_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            output = root / "asset.bin"
            opener = FakeOpener(FakeResponse(b"not-an-image", content_type="text/plain"))

            with self.assertRaisesRegex(intake.AssetIntakeError, "supported image"):
                intake.download_asset(
                    url=VALID_URL,
                    output=output,
                    timeout=7,
                    max_bytes=1024,
                    opener=opener,
                )

            self.assertFalse(output.exists())
            self.assertEqual(list(root.glob(".*.part")), [])


class ManifestTests(unittest.TestCase):
    def test_manifest_contains_hash_and_lineage_but_not_source_url(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp).resolve() / "person.png"
            output.write_bytes(PNG_BYTES)
            result = intake.DownloadResult(
                sha256=hashlib.sha256(PNG_BYTES).hexdigest(),
                size_bytes=len(PNG_BYTES),
                content_type="image/png",
                detected_format="png",
            )

            manifest = intake.build_manifest(
                output=output,
                result=result,
                file_key="ZYTdtw4wCgkcBy2cVnhxVI",
                node_id="21384:8173",
                logical_name="main-visual-person-left",
            )
            serialized = json.dumps(manifest, ensure_ascii=False)

            self.assertNotIn(VALID_URL, serialized)
            self.assertNotIn("/api/mcp/asset/", serialized)
            self.assertFalse(manifest["source_url_persisted"])
            self.assertEqual(manifest["artifact"]["sha256"], result.sha256)
            self.assertEqual(manifest["figma"]["node_id"], "21384:8173")
            self.assertEqual(manifest["security"]["source_url_transport"], "STDIN_OR_ENV_ONLY")

    def test_write_manifest_is_valid_json(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp).resolve() / "asset.asset.json"
            payload = {"source_url_persisted": False, "artifact": {"sha256": "abc"}}
            intake.write_manifest(path, payload)
            self.assertEqual(json.loads(path.read_text(encoding="utf-8")), payload)


class WriteTargetTests(unittest.TestCase):
    def test_refuses_overwrite_without_force(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            output = root / "asset.png"
            manifest = root / "asset.png.asset.json"
            output.write_bytes(PNG_BYTES)
            with self.assertRaisesRegex(intake.AssetIntakeError, "overwrite"):
                intake.ensure_write_targets(output, manifest, force=False)

    def test_force_allows_existing_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            output = root / "asset.png"
            manifest = root / "asset.png.asset.json"
            output.write_bytes(PNG_BYTES)
            manifest.write_text("{}\n", encoding="utf-8")
            intake.ensure_write_targets(output, manifest, force=True)

    def test_refuses_same_asset_and_manifest_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp).resolve() / "same"
            with self.assertRaisesRegex(intake.AssetIntakeError, "must differ"):
                intake.ensure_write_targets(path, path, force=False)


if __name__ == "__main__":
    unittest.main()
