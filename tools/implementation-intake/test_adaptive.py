#!/usr/bin/env python3
from __future__ import annotations

import copy
import unittest
from datetime import datetime, timezone

import adaptive
import intake


class AdaptiveDecisionTests(unittest.TestCase):
    def profile(self):
        return intake.load_json(intake.ROOT / "profile.example.json")

    def test_progressive_change_preserves_history_and_impact(self):
        profile = self.profile()
        changed = adaptive.evolve(
            profile,
            "responsive.intermediate",
            "project-breakpoint-contract",
            state="confirmed",
            source="human",
            confidence=1.0,
            evidence="Owner changed requirement",
            decided_by="owner",
            reason="Existing company breakpoint contract discovered",
        )
        self.assertEqual(changed["answers"]["responsive.intermediate"]["state"], "confirmed")
        self.assertEqual(changed["decisionHistory"][-1]["type"], "decision-change")
        self.assertEqual(changed["decisionHistory"][-1]["question"], "responsive.intermediate")

    def test_evidence_coverage_rewards_confirmed_evidence(self):
        profile = self.profile()
        report = adaptive.evidence_report(profile)
        self.assertGreater(report["score"], 50)
        degraded = copy.deepcopy(profile)
        degraded["answers"]["target.runtime"] = {
            "value": "wordpress", "source": "unknown", "confidence": 0.1, "evidence": "", "decidedBy": "unknown", "state": "provisional"
        }
        self.assertLess(adaptive.evidence_report(degraded)["score"], report["score"])

    def test_expiry_marks_volatile_assumption(self):
        profile = self.profile()
        profile["answers"]["interaction.slider"]["expiresAt"] = "2026-01-01T00:00:00Z"
        expired = adaptive.expired_answers(profile, datetime(2026, 8, 14, tzinfo=timezone.utc))
        self.assertIn("interaction.slider", {item["id"] for item in expired})

    def test_question_budget_is_small_and_prioritized(self):
        profile = {"version": 1, "project": {"name": "x"}, "answers": {}, "collections": []}
        selected = adaptive.question_budget(profile, 3)
        self.assertLessEqual(len(selected), 3)
        self.assertTrue(all(item["severity"] == "blocking" for item in selected))

    def test_overlay_never_overwrites_resolved_project_answer(self):
        profile = self.profile()
        overlay = {
            "name": "company-a",
            "answers": {
                "target.runtime": {"value": "html"},
                "interaction.slider": {"value": "css-scroll-snap"}
            },
        }
        merged = adaptive.apply_overlay(profile, overlay)
        self.assertEqual(merged["answers"]["target.runtime"]["value"], "wordpress")
        self.assertEqual(merged["answers"]["interaction.slider"]["value"], "evidence-required")

    def test_recon_cannot_overwrite_confirmed_human_answer(self):
        profile = self.profile()
        profile["answers"]["target.runtime"]["state"] = "confirmed"
        observed = {"answers": {"target.runtime": {"value": "react", "source": "repo-observation", "confidence": 0.9, "evidence": "package.json", "decidedBy": "ai"}}}
        merged = adaptive.apply_recon(profile, observed)
        self.assertEqual(merged["answers"]["target.runtime"]["value"], "wordpress")

    def test_learning_ledger_rewards_useful_questions(self):
        ledger = {"version": 1, "events": [], "questionStats": {}}
        ledger = adaptive.learning_update(ledger, {"question": "assets.pcSp", "kind": "late-discovery"})
        ledger = adaptive.learning_update(ledger, {"question": "assets.pcSp", "kind": "prevented-rework"})
        self.assertEqual(ledger["questionStats"]["assets.pcSp"]["utility"], 5)

    def test_complexity_alarm_flags_over_abstract_section(self):
        report = adaptive.complexity_report({"sections": [{"id": "hero", "implementationFiles": 8, "abstractions": 5, "conditionalBranches": 4, "figmaStructuralNodes": 3}]})
        self.assertEqual(report["sections"][0]["level"], "high")

    def test_reverse_audit_detects_missing_checks(self):
        profile = self.profile()
        observed = {"implementationDirectives": [], "executedChecks": []}
        audit = adaptive.reverse_audit(profile, observed)
        self.assertFalse(audit["pass"])
        self.assertIn("wordpress-runtime-smoke", audit["missingChecks"])

    def test_router_separates_light_and_full_checks(self):
        route = adaptive.route_checks(self.profile())
        self.assertIn("wordpress-runtime-smoke", route["light"])
        self.assertIn("visual-fidelity", route["full"])

    def test_impact_graph_selects_dependent_qa(self):
        report = adaptive.impact_report(self.profile(), ["cms.acf"])
        self.assertIn("acf-field-definition-validation", report["rerunChecks"])


if __name__ == "__main__":
    unittest.main()
