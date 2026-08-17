#!/usr/bin/env python3
from __future__ import annotations

import unittest
from datetime import datetime, timezone

import governance
import intake


class GovernanceTests(unittest.TestCase):
    def profile(self):
        return intake.load_json(intake.ROOT / "profile.example.json")

    def test_confidence_decay_only_affects_volatile_assumptions(self):
        profile = self.profile()
        profile["answers"]["interaction.slider"].update({"volatile": True, "observedAt": "2026-06-01T00:00:00Z", "halfLifeDays": 30, "confidence": 1.0})
        report = governance.confidence_decay(profile, datetime(2026, 8, 14, tzinfo=timezone.utc), threshold=0.5)
        row = next(item for item in report["answers"] if item["id"] == "interaction.slider")
        self.assertLess(row["effectiveConfidence"], 0.5)
        self.assertIn("interaction.slider", report["needsRecheck"])

    def test_learning_changes_question_priority(self):
        profile = {"version": 1, "project": {"name": "x"}, "answers": {}, "collections": []}
        ledger = {"questionStats": {"target.pageType": {"utility": 50}}}
        report = governance.learned_question_budget(profile, ledger, 5)
        ids = [item["id"] for item in report["questions"]]
        self.assertIn("target.pageType", ids)

    def test_ownership_map_requires_evidence_and_owners(self):
        report = governance.ownership_report({"ownership": [
            {"id": "hero", "type": "section", "owners": ["templates/hero.php", "assets/css/hero.css"], "evidence": "Figma hero section", "humanEditable": True},
            {"id": "slider", "type": "interaction", "owners": [], "evidence": "Prototype interaction"},
        ]})
        self.assertFalse(report["valid"])
        self.assertIn("slider", report["unresolved"])

    def test_recheck_plan_is_impact_scoped(self):
        report = governance.change_recheck_plan(self.profile(), ["cms.acf"], {})
        self.assertIn("acf-field-definition-validation", report["rerunChecks"])
        self.assertIn("only impacted", report["principle"])


if __name__ == "__main__":
    unittest.main()
