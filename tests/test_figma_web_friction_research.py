from __future__ import annotations

import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
RESEARCH = ROOT / "research" / "figma-web-friction" / "2026-08-11.yaml"
OBSERVATION = (
    ROOT
    / "research"
    / "figma-web-friction"
    / "ref001-layout-generation-observation-2026-08-11.yaml"
)

ALLOWED_STATUSES = {
    "RESOLVED_BY_PLATFORM",
    "TRANSITIONAL",
    "CURRENT_FRICTION",
    "TOOLING_FRICTION",
    "WEB_RUNTIME_DIFFERENCE",
}


class FigmaWebFrictionResearchTests(unittest.TestCase):
    def setUp(self) -> None:
        self.data = yaml.safe_load(RESEARCH.read_text(encoding="utf-8"))

    def test_findings_use_known_statuses_and_dated_source_evidence(self) -> None:
        eras = self.data["eras"]
        self.assertGreaterEqual(len(eras), 4)

        for era in eras:
            self.assertTrue(str(era["era"]).strip())
            self.assertTrue(era["findings"])
            for finding in era["findings"]:
                self.assertIn(finding["current_status"], ALLOWED_STATUSES)
                self.assertTrue(finding["topic"])
                self.assertTrue(finding["current_rule"])
                self.assertTrue(finding["sources"])
                for source in finding["sources"]:
                    self.assertTrue(str(source["authority"]).strip())
                    self.assertTrue(str(source["url"]).startswith("https://"))

    def test_resolved_and_transitional_claims_have_official_evidence(self) -> None:
        for era in self.data["eras"]:
            for finding in era["findings"]:
                if finding["current_status"] not in {
                    "RESOLVED_BY_PLATFORM",
                    "TRANSITIONAL",
                }:
                    continue
                authorities = {source["authority"] for source in finding["sources"]}
                self.assertTrue(
                    any(authority.startswith("OFFICIAL") for authority in authorities),
                    msg=f"{finding['topic']} needs current/release official evidence",
                )

    def test_research_keeps_historical_complaints_out_of_default_rules(self) -> None:
        principles = "\n".join(self.data["principles"])
        promotion = "\n".join(self.data["promotion_rules"])
        self.assertIn("not permanent evidence", principles)
        self.assertIn("official documentation", principles)
        self.assertIn("historical limitation is resolved", promotion)
        self.assertIn("UNDETERMINED", promotion)

    def test_ref001_layout_generation_remains_explicitly_undetermined(self) -> None:
        observation = yaml.safe_load(OBSERVATION.read_text(encoding="utf-8"))
        self.assertEqual("VERIFIED_UNDETERMINED", observation["status"])
        self.assertEqual("UNDETERMINED", observation["inspection"]["result"])
        self.assertGreaterEqual(observation["inspection"]["sampled_auto_layout_nodes"], 40)
        self.assertEqual(0, observation["inspection"]["nodes_exposing_generation_property"])
        self.assertIn("layoutVersion", observation["inspection"]["generation_property_probe"])
        self.assertTrue(observation["retest_trigger"])


if __name__ == "__main__":
    unittest.main()
