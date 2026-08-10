from __future__ import annotations

import hashlib
import json
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import apply_radar_preflight as radar  # noqa: E402


def snapshot(*, generated_at: str | None = None) -> dict:
    when = generated_at or datetime.now(timezone.utc).isoformat()
    rows = [
        {"source_id": "figma-release-notes", "lane": "FIGMA", "fingerprint": "a", "error": ""},
        {"source_id": "figma-mcp-docs", "lane": "FIGMA", "fingerprint": "b", "error": ""},
        {"source_id": "mcp-spec-releases", "lane": "MCP", "fingerprint": "c", "error": ""},
        {"source_id": "web-features-releases", "lane": "WEB_PLATFORM", "fingerprint": "d", "error": ""},
        {"source_id": "w3c-wai-news", "lane": "ACCESSIBILITY", "fingerprint": "g", "error": ""},
        {"source_id": "openai-codex-changelog", "lane": "CODEX", "fingerprint": "e", "error": ""},
        {"source_id": "safari-release-notes", "lane": "SAFARI_WEBKIT", "fingerprint": "f", "error": ""},
    ]
    return {
        "generated_at": when,
        "active_lanes": ["FIGMA", "MCP", "WEB_PLATFORM", "ACCESSIBILITY", "CODEX", "SAFARI_WEBKIT"],
        "sources": rows,
        "changes": [
            {"source_id": "safari-release-notes", "lane": "SAFARI_WEBKIT", "retest_categories": ["VIEWPORT_SAFE_AREA"]}
        ],
        "fetch_errors": [],
        "summary": {"retest_categories": ["VIEWPORT_SAFE_AREA"]},
    }


class ApplyRadarPreflightTests(unittest.TestCase):
    def test_pins_fresh_relevant_official_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "research/update-radar/latest.json"
            path.parent.mkdir(parents=True)
            value = snapshot()
            path.write_text(json.dumps(value), encoding="utf-8")
            run = {"agent": {"client": "codex"}, "tooling_preflight": {}}
            with patch.object(radar, "ROOT", root):
                updated = radar.apply(run, value, path, 36)
            preflight = updated["tooling_preflight"]
            self.assertEqual(preflight["mode"], "AUTOMATED_UPDATE_RADAR")
            self.assertTrue(preflight["official_sources_complete"])
            self.assertFalse(preflight["community_scan_checked"])
            self.assertIn("ACCESSIBILITY", preflight["active_lanes"])
            self.assertIn("SAFARI_WEBKIT", preflight["active_lanes"])
            self.assertEqual(preflight["rules_to_retest"], ["VIEWPORT_SAFE_AREA"])
            self.assertEqual(preflight["update_radar_sha256"], hashlib.sha256(path.read_bytes()).hexdigest())

    def test_retests_are_derived_only_from_changes_relevant_to_run(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "research/update-radar/latest.json"
            path.parent.mkdir(parents=True)
            value = snapshot()
            value["active_lanes"].append("WORDPRESS_ACF")
            value["sources"].append(
                {
                    "source_id": "wordpress-releases",
                    "lane": "WORDPRESS_ACF",
                    "fingerprint": "wp",
                    "error": "",
                }
            )
            value["changes"].append(
                {
                    "source_id": "wordpress-releases",
                    "lane": "WORDPRESS_ACF",
                    "retest_categories": ["WORDPRESS_ACF"],
                }
            )
            value["summary"]["retest_categories"] = ["VIEWPORT_SAFE_AREA", "WORDPRESS_ACF"]
            path.write_text(json.dumps(value), encoding="utf-8")
            run = {"agent": {"client": "codex"}, "tooling_preflight": {}}
            with patch.object(radar, "ROOT", root):
                updated = radar.apply(run, value, path, 36)
            preflight = updated["tooling_preflight"]
            self.assertEqual(
                [row["source_id"] for row in preflight["changes_relevant_to_run"]],
                ["safari-release-notes"],
            )
            self.assertEqual(preflight["rules_to_retest"], ["VIEWPORT_SAFE_AREA"])

    def test_stale_snapshot_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "research/update-radar/latest.json"
            path.parent.mkdir(parents=True)
            value = snapshot(generated_at=(datetime.now(timezone.utc) - timedelta(hours=48)).isoformat())
            path.write_text(json.dumps(value), encoding="utf-8")
            run = {"agent": {"client": "codex"}}
            with patch.object(radar, "ROOT", root), self.assertRaisesRegex(ValueError, "stale"):
                radar.apply(run, value, path, 36)

    def test_missing_agent_lane_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "research/update-radar/latest.json"
            path.parent.mkdir(parents=True)
            value = snapshot()
            value["active_lanes"].remove("CODEX")
            value["sources"] = [row for row in value["sources"] if row["lane"] != "CODEX"]
            path.write_text(json.dumps(value), encoding="utf-8")
            run = {"agent": {"client": "codex"}}
            with patch.object(radar, "ROOT", root), self.assertRaisesRegex(ValueError, "CODEX"):
                radar.apply(run, value, path, 36)

    def test_missing_accessibility_lane_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "research/update-radar/latest.json"
            path.parent.mkdir(parents=True)
            value = snapshot()
            value["active_lanes"].remove("ACCESSIBILITY")
            value["sources"] = [row for row in value["sources"] if row["lane"] != "ACCESSIBILITY"]
            path.write_text(json.dumps(value), encoding="utf-8")
            run = {"agent": {"client": "codex"}}
            with patch.object(radar, "ROOT", root), self.assertRaisesRegex(ValueError, "ACCESSIBILITY"):
                radar.apply(run, value, path, 36)


if __name__ == "__main__":
    unittest.main()