from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

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


class SnapshotDiffTests(unittest.TestCase):
    def _config(self) -> dict:
        return {
            "policy": {"fetch_timeout_seconds": 1, "max_items_per_feed": 1},
            "retest_keyword_map": {},
            "lanes": {
                "FIGMA": {
                    "required_for_significant_run": True,
                    "sources": [
                        {
                            "id": "figma-release-notes",
                            "kind": "HTML_DIGEST",
                            "authority": "OFFICIAL",
                            "url": "https://example.com/figma",
                            "topics": ["Figma"],
                            "impacts": ["FIGMA_MCP"],
                        }
                    ],
                }
            },
        }

    def _result(self, fingerprint: str) -> radar.FetchResult:
        return radar.FetchResult(
            source_id="figma-release-notes",
            lane="FIGMA",
            authority="OFFICIAL",
            kind="HTML_DIGEST",
            url="https://example.com/figma",
            fetched_at="2026-08-11T00:00:00+00:00",
            fingerprint=fingerprint,
            title="Figma update",
            items=[],
            excerpt="Figma update",
            matched_keywords=["Figma"],
            retest_categories=["FIGMA_MCP"],
            impacts=["FIGMA_MCP"],
            topics=["Figma"],
        )

    def test_same_fingerprint_is_no_change(self) -> None:
        with patch.object(radar, "fetch_source", return_value=self._result("same")):
            snapshot = radar.build_snapshot(
                self._config(),
                policy_path=None,
                policy=None,
                previous_state={"fingerprints": {"figma-release-notes": "same"}},
            )
        self.assertEqual(snapshot["summary"]["changed_count"], 0)
        self.assertEqual(snapshot["changes"], [])

    def test_changed_fingerprint_becomes_retest_candidate(self) -> None:
        with patch.object(radar, "fetch_source", return_value=self._result("new")):
            snapshot = radar.build_snapshot(
                self._config(),
                policy_path=None,
                policy=None,
                previous_state={"fingerprints": {"figma-release-notes": "old"}},
            )
        self.assertEqual(snapshot["summary"]["changed_count"], 1)
        self.assertEqual(snapshot["summary"]["retest_categories"], ["FIGMA_MCP"])
        self.assertEqual(snapshot["changes"][0]["source_id"], "figma-release-notes")


if __name__ == "__main__":
    unittest.main()