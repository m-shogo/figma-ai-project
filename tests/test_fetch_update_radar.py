from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import fetch_update_radar as radar  # noqa: E402


def payload(*items: dict) -> bytes:
    return json.dumps(list(items), ensure_ascii=False).encode("utf-8")


class JsonDigestTests(unittest.TestCase):
    def test_unrelated_json_record_changes_do_not_change_filtered_digest(self) -> None:
        before = payload(
            {"id": 1, "name": "CSS viewport behavior", "status": "shipping"},
            {"id": 2, "name": "Unrelated storage API", "status": "draft"},
        )
        after = payload(
            {"id": 1, "name": "CSS viewport behavior", "status": "shipping"},
            {"id": 2, "name": "Unrelated storage API", "status": "shipped"},
        )

        _, _, before_digest = radar.parse_json_digest(before, ["CSS", "viewport"])
        _, _, after_digest = radar.parse_json_digest(after, ["CSS", "viewport"])

        self.assertEqual(before_digest, after_digest)
        self.assertEqual(radar.sha256_text(before_digest), radar.sha256_text(after_digest))

    def test_relevant_json_record_change_changes_filtered_digest(self) -> None:
        before = payload(
            {"id": 1, "name": "CSS viewport behavior", "status": "prototype"},
            {"id": 2, "name": "Unrelated storage API", "status": "draft"},
        )
        after = payload(
            {"id": 1, "name": "CSS viewport behavior", "status": "shipping"},
            {"id": 2, "name": "Unrelated storage API", "status": "draft"},
        )

        _, _, before_digest = radar.parse_json_digest(before, ["CSS", "viewport"])
        _, _, after_digest = radar.parse_json_digest(after, ["CSS", "viewport"])

        self.assertNotEqual(before_digest, after_digest)
        self.assertNotEqual(radar.sha256_text(before_digest), radar.sha256_text(after_digest))

    def test_no_keyword_match_has_stable_empty_subset(self) -> None:
        before = payload({"id": 1, "name": "Storage API", "status": "draft"})
        after = payload({"id": 1, "name": "Storage API", "status": "shipping"})

        _, _, before_digest = radar.parse_json_digest(before, ["CSS", "viewport"])
        _, _, after_digest = radar.parse_json_digest(after, ["CSS", "viewport"])

        self.assertEqual(before_digest, "[]")
        self.assertEqual(before_digest, after_digest)

    def test_without_keywords_full_json_remains_fingerprint_input(self) -> None:
        before = payload({"id": 1, "name": "Storage API", "status": "draft"})
        after = payload({"id": 1, "name": "Storage API", "status": "shipping"})

        _, _, before_digest = radar.parse_json_digest(before, [])
        _, _, after_digest = radar.parse_json_digest(after, [])

        self.assertNotEqual(before_digest, after_digest)


if __name__ == "__main__":
    unittest.main()