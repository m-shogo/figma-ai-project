#!/usr/bin/env python3
import unittest

from micro_diff import classify_delta, learn_micro_diffs
from probe_adapter import boundary_route_detail


class MicroDiffLearningTests(unittest.TestCase):
    def test_micro_range_includes_one_through_four_px(self):
        self.assertEqual(classify_delta(0.999)["kind"], "subpixel")
        self.assertEqual(classify_delta(1)["kind"], "micro")
        self.assertEqual(classify_delta(-4)["kind"], "micro")
        self.assertEqual(classify_delta(4.001)["kind"], "small-material")

    def test_larger_absolute_bands_are_distinct(self):
        self.assertEqual(classify_delta(5)["absoluteKind"], "small-material")
        self.assertEqual(classify_delta(8)["absoluteKind"], "small-material")
        self.assertEqual(classify_delta(9)["absoluteKind"], "material")
        self.assertEqual(classify_delta(16)["absoluteKind"], "material")
        self.assertEqual(classify_delta(16.001)["absoluteKind"], "major")

    def test_relative_impact_escalates_small_element_difference(self):
        # Live Figma node 21378:7875 is an 11px-wide Education check icon.
        classification = classify_delta(2, 11)
        self.assertEqual(classification["absoluteKind"], "micro")
        self.assertEqual(classification["impactKind"], "material")
        self.assertAlmostEqual(classification["relativePercent"], 18.182, places=3)
        self.assertTrue(classification["relativeEscalated"])

    def test_large_section_keeps_five_px_as_small_material(self):
        # Live Figma Education node 21378:7868 is 684px high.
        classification = classify_delta(5, 684)
        self.assertEqual(classification["absoluteKind"], "small-material")
        self.assertEqual(classification["impactKind"], "small-material")
        self.assertLess(classification["relativePercent"], 1)

    def test_same_direction_repeat_across_sections_escalates(self):
        result = learn_micro_diffs([
            {"id": "hero", "viewport": "PC", "diagnosis": {"differences": [
                {"category": "section-boundary", "property": "bottom", "deltaPx": 2},
            ]}},
            {"id": "reason", "viewport": "PC", "diagnosis": {"differences": [
                {"category": "section-boundary", "property": "bottom", "deltaPx": 4},
            ]}},
        ])
        self.assertEqual(result["summary"]["microDifferenceCount"], 2)
        self.assertEqual(result["summary"]["structuralCandidateCount"], 1)
        self.assertTrue(result["patterns"][0]["structuralCandidate"])
        self.assertEqual(result["patterns"][0]["nextAction"], "inspect-shared-root-cause-before-local-repair")

    def test_opposite_directions_do_not_form_one_structural_pattern(self):
        result = learn_micro_diffs([
            {"id": "hero", "viewport": "SP", "diagnosis": {"differences": [
                {"category": "position", "property": "x", "deltaPx": 3},
            ]}},
            {"id": "reason", "viewport": "SP", "diagnosis": {"differences": [
                {"category": "position", "property": "x", "deltaPx": -3},
            ]}},
        ])
        self.assertEqual(result["summary"]["patternCount"], 2)
        self.assertEqual(result["summary"]["structuralCandidateCount"], 0)

    def test_duplicate_diffs_inside_one_section_do_not_escalate(self):
        result = learn_micro_diffs([
            {"id": "hero", "viewport": "PC", "diagnosis": {"differences": [
                {"category": "spacing", "property": "gap", "deltaPx": 2},
                {"category": "spacing", "property": "gap", "deltaPx": 3},
            ]}},
        ])
        self.assertEqual(result["summary"]["microDifferenceCount"], 2)
        self.assertEqual(result["summary"]["structuralCandidateCount"], 0)
        self.assertEqual(result["patterns"][0]["uniqueSections"], ["hero"])

    def test_repair_outcomes_are_retained_as_learning_evidence(self):
        result = learn_micro_diffs([
            {"id": "hero", "viewport": "PC", "repairOutcome": "accepted", "diagnosis": {"differences": [
                {"category": "size", "property": "width", "deltaPx": 1},
            ]}},
            {"id": "reason", "viewport": "PC", "repairOutcome": "rejected", "diagnosis": {"differences": [
                {"category": "size", "property": "width", "deltaPx": 2},
            ]}},
        ])
        outcomes = result["patterns"][0]["repairOutcomes"]
        self.assertEqual(outcomes["accepted"], 1)
        self.assertEqual(outcomes["rejected"], 1)

    def test_relative_escalation_routes_to_small_element_diagnosis(self):
        result = learn_micro_diffs([
            {"id": "education-check", "viewport": "PC", "diagnosis": {"differences": [
                {"category": "size", "property": "width", "deltaPx": 2, "referenceSizePx": 11},
            ]}},
        ])
        self.assertEqual(result["summary"]["relativeEscalationCount"], 1)
        self.assertEqual(result["patterns"][0]["maxImpactKind"], "material")
        self.assertEqual(
            result["patterns"][0]["nextAction"],
            "inspect-small-element-scale-or-rasterization-before-repair",
        )

    def test_major_delta_requires_structure_diagnosis_before_value_edit(self):
        result = learn_micro_diffs([
            {"id": "messages", "viewport": "PC", "diagnosis": {"differences": [
                {"category": "section-boundary", "property": "height", "deltaPx": 24, "referenceSizePx": 440},
            ]}},
        ])
        self.assertEqual(result["patterns"][0]["maxImpactKind"], "major")
        self.assertEqual(result["patterns"][0]["nextAction"], "diagnose-structure-before-value-edit")

    def test_controlled_faults_on_real_figma_section_dimensions_cover_large_bands(self):
        # These heights were read back from the current REF-001 Figma nodes:
        # Reason 21378:7999 = 559, Education 21378:7868 = 684,
        # Student Voice 21378:7766 = 1393, Messages manifest reference = 440.
        payload = {
            "source": {
                "kind": "controlled-fault-injection",
                "fileKey": "ZYTdtw4wCgkcBy2cVnhxVI",
                "mutatesV2": False,
            },
            "reports": [
                {"id": "reason", "viewport": "PC", "diagnosis": {"differences": [
                    {"category": "section-boundary", "property": "height", "deltaPx": 5, "referenceSizePx": 559},
                ]}},
                {"id": "education", "viewport": "PC", "diagnosis": {"differences": [
                    {"category": "section-boundary", "property": "height", "deltaPx": 8, "referenceSizePx": 684},
                ]}},
                {"id": "student-voice", "viewport": "PC", "diagnosis": {"differences": [
                    {"category": "section-boundary", "property": "height", "deltaPx": 16, "referenceSizePx": 1393},
                ]}},
                {"id": "messages", "viewport": "PC", "diagnosis": {"differences": [
                    {"category": "section-boundary", "property": "height", "deltaPx": 24, "referenceSizePx": 440},
                ]}},
            ],
        }
        result = learn_micro_diffs(payload)
        counts = result["summary"]["absoluteSeverityCounts"]
        self.assertEqual(counts["small-material"], 2)
        self.assertEqual(counts["material"], 1)
        self.assertEqual(counts["major"], 1)
        self.assertEqual(result["source"]["kind"], "controlled-fault-injection")

    def test_step_shift_exposes_local_boundary_jump_detail(self):
        detail = boundary_route_detail({
            "pattern": "step-shift",
            "rootCauseCandidate": "education",
            "recommendedInspection": ["first-divergent-section"],
        })
        self.assertEqual(detail["scope"], "section-boundary")
        self.assertEqual(detail["cause"], "local-boundary-jump")
        self.assertEqual(detail["candidate"], "education")
        self.assertEqual(detail["confidence"], "high")

    def test_constant_offset_exposes_shared_route_detail(self):
        detail = boundary_route_detail({
            "pattern": "constant-offset",
            "rootCauseCandidate": "page-or-shared-root",
        })
        self.assertEqual(detail["scope"], "shared-layout")
        self.assertEqual(detail["cause"], "page-or-coordinate-offset")
        self.assertEqual(detail["sourcePattern"], "constant-offset")


if __name__ == "__main__":
    unittest.main()
