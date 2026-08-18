from __future__ import annotations

import base64
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import materialize_figma_rendered_asset as materializer  # noqa: E402

PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"plugin-rendered-ref001" * 32


def write_chunks(directory: Path, payload: bytes, count: int = 3) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    encoded = base64.b64encode(payload).decode("ascii")
    width = max(1, len(encoded) // count)
    parts = [encoded[index : index + width] for index in range(0, len(encoded), width)]
    for index, part in enumerate(parts, 1):
        (directory / f"{index:04d}.b64").write_text(part, encoding="ascii")


class RenderedAssetMaterializerTests(unittest.TestCase):
    def test_materializes_sorted_chunks_and_writes_secret_safe_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            chunks = root / "chunks"
            write_chunks(chunks, PNG_BYTES)
            output = root / "assets" / "render.png"

            record = materializer.materialize(
                chunk_dir=chunks,
                output=output,
                manifest_path=None,
                file_key="ZYTdtw4wCgkcBy2cVnhxVI",
                node_id="21384:8173",
                logical_name="ref001-render",
                expected_format="png",
                min_bytes=10,
                expected_size=len(PNG_BYTES),
            )

            self.assertEqual(output.read_bytes(), PNG_BYTES)
            manifest_path = output.with_name(output.name + ".asset.json")
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            digest = hashlib.sha256(PNG_BYTES).hexdigest()
            self.assertEqual(manifest["artifact"]["sha256"], digest)
            self.assertEqual(record["artifact"]["sha256"], digest)
            self.assertEqual(manifest["figma"]["node_id"], "21384:8173")
            self.assertEqual(manifest["lineage"]["materialization"], "PLUGIN_RENDERED_BASE64_STAGING")
            self.assertFalse(manifest["lineage"]["staging_committed_in_final_tree"])
            serialized = json.dumps(manifest)
            self.assertNotIn("/api/mcp/asset/", serialized)

    def test_rejects_invalid_base64_without_output(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            chunks = root / "chunks"
            chunks.mkdir()
            (chunks / "0001.b64").write_text("%%%%", encoding="ascii")
            output = root / "asset.png"

            with self.assertRaisesRegex(materializer.MaterializeError, "invalid base64"):
                materializer.materialize(
                    chunk_dir=chunks,
                    output=output,
                    manifest_path=None,
                    file_key="file",
                    node_id="1:2",
                    logical_name="bad",
                    expected_format="png",
                    min_bytes=1,
                )
            self.assertFalse(output.exists())
            self.assertFalse(output.with_name(output.name + ".asset.json").exists())

    def test_rejects_hash_mismatch_without_output(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            chunks = root / "chunks"
            write_chunks(chunks, PNG_BYTES)
            output = root / "asset.png"

            with self.assertRaisesRegex(materializer.MaterializeError, "sha256 mismatch"):
                materializer.materialize(
                    chunk_dir=chunks,
                    output=output,
                    manifest_path=None,
                    file_key="file",
                    node_id="1:2",
                    logical_name="hash-mismatch",
                    expected_format="png",
                    min_bytes=1,
                    expected_sha256="0" * 64,
                )
            self.assertFalse(output.exists())

    def test_rejects_size_mismatch(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            chunks = root / "chunks"
            write_chunks(chunks, PNG_BYTES)
            output = root / "asset.png"

            with self.assertRaisesRegex(materializer.MaterializeError, "size mismatch"):
                materializer.materialize(
                    chunk_dir=chunks,
                    output=output,
                    manifest_path=None,
                    file_key="file",
                    node_id="1:2",
                    logical_name="size-mismatch",
                    expected_format="png",
                    min_bytes=1,
                    expected_size=len(PNG_BYTES) + 1,
                )
            self.assertFalse(output.exists())

    def test_refuses_overwrite_without_force(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            chunks = root / "chunks"
            write_chunks(chunks, PNG_BYTES)
            output = root / "asset.png"
            output.write_bytes(b"existing")

            with self.assertRaisesRegex(Exception, "overwrite"):
                materializer.materialize(
                    chunk_dir=chunks,
                    output=output,
                    manifest_path=None,
                    file_key="file",
                    node_id="1:2",
                    logical_name="no-overwrite",
                    expected_format="png",
                    min_bytes=1,
                )
            self.assertEqual(output.read_bytes(), b"existing")


if __name__ == "__main__":
    unittest.main()
