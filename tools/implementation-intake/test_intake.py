#!/usr/bin/env python3
from __future__ import annotations

import copy
import unittest

import intake


class IntakeTests(unittest.TestCase):
    def base_profile(self) -> dict:
        return {
            "version": 1,
            "project": {"name": "test", "profileStatus": "draft"},
            "answers": {},
            "collections": [],
        }

    def answer(self, value, source="human", confidence=1.0):
        return {
            "value": value,
            "source": source,
            "confidence": confidence,
            "evidence": "test evidence",
            "decidedBy": "owner" if source == "human" else "ai",
        }

    def test_html_target_hides_wordpress_questions(self):
        profile = self.base_profile()
        profile["answers"]["target.runtime"] = self.answer("html")
        active = {item["id"] for item in intake.active_questions(profile)}
        self.assertNotIn("cms.acf", active)
        self.assertNotIn("cms.mode", active)
        self.assertNotIn("qa.cmsMutation", active)
        self.assertNotIn("deliverables.acfJson", active)

    def test_acf_pro_activates_pro_specific_question(self):
        profile = self.base_profile()
        profile["answers"]["target.runtime"] = self.answer("wordpress")
        profile["answers"]["cms.acf"] = self.answer("acf-pro")
        active = {item["id"] for item in intake.active_questions(profile)}
        self.assertIn("cms.flexibleContentPolicy", active)
        self.assertIn("deliverables.acfJson", active)

    def test_only_blocking_unknowns_block_preflight(self):
        profile = intake.load_json(intake.ROOT / "profile.example.json")
        pending = intake.unresolved_questions(profile)
        self.assertFalse(any(item["severity"] == "blocking" for item in pending))
        self.assertTrue(any(item["severity"] == "review" for item in pending))

    def test_fingerprint_ignores_status_but_detects_decision_change(self):
        profile = intake.load_json(intake.ROOT / "profile.example.json")
        original = intake.profile_fingerprint(profile)

        status_only = copy.deepcopy(profile)
        status_only["project"]["profileStatus"] = "locked"
        self.assertEqual(original, intake.profile_fingerprint(status_only))

        changed = copy.deepcopy(profile)
        changed["answers"]["responsive.intermediate"]["value"] = "project-breakpoint-contract"
        self.assertNotEqual(original, intake.profile_fingerprint(changed))

    def test_collection_change_is_part_of_decision_lock(self):
        profile = intake.load_json(intake.ROOT / "profile.example.json")
        original = intake.profile_fingerprint(profile)
        changed = copy.deepcopy(profile)
        changed["collections"][0]["cmsOwnership"] = "fixed"
        self.assertNotEqual(original, intake.profile_fingerprint(changed))

    def test_unresolved_wordpress_collection_becomes_review_debt(self):
        profile = intake.load_json(intake.ROOT / "profile.example.json")
        profile["collections"][0]["cmsOwnership"] = "undetermined"
        debt = {item["id"] for item in intake.unresolved_collections(profile)}
        self.assertIn("feature-cards", debt)

    def test_resolved_collection_requires_evidence(self):
        profile = intake.load_json(intake.ROOT / "profile.example.json")
        profile["collections"][0]["evidence"] = ""
        errors = intake.validate_profile(profile)
        self.assertTrue(any("evidence is required" in item for item in errors))

    def test_compile_plan_derives_qa_and_deliverables(self):
        profile = intake.load_json(intake.ROOT / "profile.example.json")
        plan = intake.compile_plan(profile)
        self.assertIn("wordpress-runtime-smoke", plan["requiredChecks"])
        self.assertIn("visual-fidelity", plan["requiredChecks"])
        self.assertIn("cms-mutation-robustness", plan["requiredChecks"])
        self.assertIn("human-editability-review", plan["requiredChecks"])
        self.assertIn("acf-json", plan["requiredDeliverables"])
        self.assertIn("acf-export.json", plan["requiredDeliverables"])
        self.assertIn("collection:feature-cards=repeater", plan["implementationDirectives"])

    def test_low_confidence_ai_observation_is_review_debt(self):
        profile = intake.load_json(intake.ROOT / "profile.example.json")
        profile["answers"]["integration.mode"] = {
            "value": "isolated",
            "source": "repo-observation",
            "confidence": 0.5,
            "evidence": "repo scan incomplete",
            "decidedBy": "ai",
        }
        low = {item["id"] for item in intake.low_confidence_questions(profile, 0.8)}
        self.assertIn("integration.mode", low)

    def test_unknown_answer_id_fails_validation(self):
        profile = self.base_profile()
        profile["answers"]["made.up"] = self.answer("x")
        errors = intake.validate_profile(profile)
        self.assertTrue(any("unknown answer id" in item for item in errors))


if __name__ == "__main__":
    unittest.main()
