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

import assemble_figma_plugin_asset as assembler  # noqa: E402
import validate_asset_manifests as validator  # noqa: E402


JPEG_BYTES = b"\xff\xd8\xff\xe0" + b"url-less-rendered-fixture" * 50


class ChunkAssemblyTests(unittest.TestCase):
    def write_chunks(self, directory: Path, payload: bytes, sizes: list[int]) -> list[Path]:
        directory.mkdir(parents=True)
        paths: list[Path] = []
        offset = 0
        for index, size in enumerate(sizes, start=1):
            chunk = payload[offset : offset + size]
            offset += len(chunk)
            path = directory / f"{index:04d}.b64"
            path.write_text(base64.b64encode(chunk).decode("ascii") + "\n", encoding="ascii")
            paths.append(path)
        if offset < len(payload):
            path = directory / f"{len(paths) + 1:04d}.b64"
            path.write_text(base64.b64encode(payload[offset:]).decode("ascii") + "\n", encoding="ascii")
            paths.append(path)
        return paths

    def test_independently_padded_chunks_reassemble_exact_bytes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            paths = self.write_chunks(root / "chunks", JPEG_BYTES, [7, 13, 17, 19])
            output = root / "asset.jpg"
            sha256, size, detected = assembler.assemble_chunks(paths, output)
            self.assertEqual(JPEG_BYTES, output.read_bytes())
            self.assertEqual(hashlib.sha256(JPEG_BYTES).hexdigest(), sha256)
            self.assertEqual(len(JPEG_BYTES), size)
            self.assertEqual("jpeg", detected)

    def test_invalid_chunk_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.b64"
            path.write_text("not base64!?", encoding="ascii")
            with self.assertRaisesRegex(assembler.AssemblyError, "valid base64"):
                assembler.decode_chunk(path)

    def test_rendered_manifest_is_explicitly_not_raw_cms_source(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            output = root / "assets" / "education.jpg"
            output.parent.mkdir(parents=True)
            output.write_bytes(JPEG_BYTES)
            payload = assembler.build_manifest(
                output=output,
                sha256=hashlib.sha256(JPEG_BYTES).hexdigest(),
                size_bytes=len(JPEG_BYTES),
                detected_format="jpeg",
                file_key="ZYTdtw4wCgkcBy2cVnhxVI",
                node_id="21378:7980",
                logical_name="education-01-visible-composite",
                export_format="JPG",
                chunk_count=5,
            )
            self.assertEqual("FIGMA_PLUGIN_RENDERED_EXPORT", payload["source_kind"])
            self.assertFalse(payload["source_url_persisted"])
            self.assertEqual("NOT_USED", payload["security"]["source_url_transport"])
            self.assertFalse(payload["provenance"]["cms_source_authority"])
            self.assertEqual(
                "RENDERED_VISIBLE_NODE_NOT_RAW_SOURCE",
                payload["provenance"]["asset_semantics"],
            )

    def test_generated_manifest_passes_repository_validator_shape(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            asset = root / "assets" / "education.jpg"
            asset.parent.mkdir(parents=True)
            asset.write_bytes(JPEG_BYTES)
            manifest = assembler.build_manifest(
                output=asset,
                sha256=hashlib.sha256(JPEG_BYTES).hexdigest(),
                size_bytes=len(JPEG_BYTES),
                detected_format="jpeg",
                file_key="ZYTdtw4wCgkcBy2cVnhxVI",
                node_id="21378:7980",
                logical_name="education-01-visible-composite",
                export_format="JPG",
                chunk_count=5,
            )
            # build_manifest uses repository portability; rewrite only the temp fixture path.
            manifest["artifact"]["path"] = str(asset.relative_to(root))
            manifest_path = asset.with_name(asset.name + ".asset.json")
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            self.assertEqual([], validator.validate_manifest(manifest_path, root=root))

    def test_missing_chunk_directory_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(assembler.AssemblyError, "not found"):
                assembler.chunk_paths(Path(tmp) / "missing")


if __name__ == "__main__":
    unittest.main()
