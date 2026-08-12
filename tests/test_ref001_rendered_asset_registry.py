from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / "research" / "figma-assets" / "ref001" / "node-21384-8173.png"
MANIFEST = ASSET.with_name(ASSET.name + ".asset.json")


class Ref001RenderedAssetRegistryTests(unittest.TestCase):
    def test_materialized_ref001_transport_proof_is_present_and_hash_matches(self) -> None:
        self.assertTrue(ASSET.is_file(), f"missing durable REF-001 rendered asset: {ASSET.relative_to(ROOT)}")
        self.assertTrue(MANIFEST.is_file(), f"missing durable REF-001 asset manifest: {MANIFEST.relative_to(ROOT)}")
        payload = ASSET.read_bytes()
        record = json.loads(MANIFEST.read_text(encoding="utf-8"))
        self.assertGreater(len(payload), 100_000)
        self.assertEqual(record["figma"]["file_key"], "ZYTdtw4wCgkcBy2cVnhxVI")
        self.assertEqual(record["figma"]["node_id"], "21384:8173")
        self.assertEqual(record["artifact"]["sha256"], hashlib.sha256(payload).hexdigest())
        self.assertEqual(record["artifact"]["size_bytes"], len(payload))
        serialized = json.dumps(record)
        self.assertNotIn("/api/mcp/asset/", serialized)


if __name__ == "__main__":
    unittest.main()
