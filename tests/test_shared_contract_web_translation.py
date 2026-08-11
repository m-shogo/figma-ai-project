from __future__ import annotations

import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "templates" / "shared-contract.yaml"


class SharedContractWebTranslationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.data = yaml.safe_load(TEMPLATE.read_text(encoding="utf-8"))

    def test_decision_preflight_covers_recurring_time_sinks_before_section_work(self) -> None:
        preflight = self.data["decision_preflight"]
        self.assertEqual("UNRESOLVED", preflight["status"])
        self.assertTrue(preflight["must_resolve_before_section_work"])
        self.assertTrue(preflight["repeated_time_sink_promotes_to_preflight"])

        items = preflight["items"]
        self.assertTrue(
            {
                "target_runtime",
                "responsive_contract",
                "typography_contract",
                "figma_capabilities",
                "asset_contract",
                "interaction_contract",
                "content_cms_contract",
                "qa_contract",
            }.issubset(items)
        )
        self.assertTrue(items["typography_contract"]["natural_wrap_default"])
        self.assertTrue(items["typography_contract"]["one_line_or_truncation_requires_evidence"])
        self.assertFalse(items["interaction_contract"]["invent_missing_behavior"])
        self.assertFalse(items["qa_contract"]["horizontal_overflow_allowed"])
        self.assertTrue(items["qa_contract"]["actual_artifact_visual_review_required"])
        self.assertIn("Do not invent a temporary value", preflight["unresolved_behavior"])

    def test_static_frame_fidelity_does_not_override_web_runtime_safety(self) -> None:
        policy = self.data["web_translation"]
        self.assertEqual("PROHIBITED", policy["static_frame_overfit"])
        self.assertTrue(policy["typography"]["natural_wrap_default"])
        self.assertTrue(policy["typography"]["one_line_or_truncation_requires_evidence"])
        self.assertTrue(policy["typography"]["line_box_spacing_diagnosis_required"])
        self.assertEqual("PROHIBITED", policy["overflow"]["page_horizontal_overflow"])
        self.assertEqual("PROHIBITED", policy["overflow"]["readable_text_clipping"])

    def test_responsive_runtime_safety_is_separate_from_figma_acceptance_endpoints(self) -> None:
        responsive = self.data["web_translation"]["responsive"]
        self.assertTrue(responsive["figma_endpoints_define_acceptance_frames_not_breakpoints"])
        self.assertTrue(responsive["intermediate_width_runtime_safety_required"])
        self.assertTrue(responsive["intrinsic_css_allowed_when_it_preserves_demonstrated_intent"])

    def test_assets_keep_source_crop_and_visual_qa_authorities_separate(self) -> None:
        assets = self.data["web_translation"]["assets"]
        self.assertTrue(assets["exact_source_preferred"])
        self.assertTrue(assets["source_identity_separate_from_crop_transform"])
        self.assertTrue(assets["exported_asset_requires_runtime_validation_when_complex"])
        self.assertTrue(assets["final_visible_composite_allowed_for_visual_qa"])
        self.assertTrue(assets["cms_media_ownership_separate_from_visual_qa"])

    def test_generation_specific_workarounds_need_current_evidence(self) -> None:
        generation = self.data["web_translation"]["generation"]
        self.assertTrue(generation["historical_complaint_is_not_current_capability_proof"])
        self.assertTrue(generation["generation_specific_workaround_requires_evidence"])
        self.assertTrue(generation["undetermined_is_preferred_to_guessing"])

    def test_integration_checks_include_runtime_translation_boundaries(self) -> None:
        checks = set(self.data["integration"]["required_checks"])
        self.assertTrue(
            {
                "preflight_decisions_resolved",
                "text_runtime_safety",
                "line_box_spacing_diagnostics",
                "font_availability_diagnostics",
                "intermediate_width_runtime_safety",
                "global_overflow",
                "readable_text_clipping",
                "exported_asset_runtime_fidelity",
            }.issubset(checks)
        )


if __name__ == "__main__":
    unittest.main()
