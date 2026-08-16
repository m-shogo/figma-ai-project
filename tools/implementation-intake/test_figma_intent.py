#!/usr/bin/env python3
import unittest

from figma_intent import analyze_figma_intent, compare_variable_tokens, infer_layout_intent


class FigmaIntentTests(unittest.TestCase):
    def test_auto_layout_becomes_intent_not_fixed_dimension_copy(self):
        result = infer_layout_intent({
            "layoutMode": "VERTICAL",
            "layoutSizingHorizontal": "FILL",
            "layoutSizingVertical": "HUG",
            "itemSpacing": 24,
            "minWidth": 320,
            "maxWidth": 1200,
        })
        candidates = {row["cssCandidate"] for row in result["implementationHypotheses"]}
        self.assertTrue(result["available"])
        self.assertIn("flex", candidates)
        self.assertIn("flex-grow-or-stretch", candidates)
        self.assertIn("content-driven-height", candidates)
        self.assertIn("min-max-constraints", candidates)
        self.assertNotIn("copy-frame-height-verbatim", candidates)

    def test_unknown_layout_metadata_does_not_invent_intent(self):
        result = infer_layout_intent({"name": "legacy-frame", "width": 1380, "height": 684})
        self.assertFalse(result["available"])
        self.assertEqual([], result["implementationHypotheses"])

    def test_bound_variables_require_explicit_mapping(self):
        node = {
            "boundVariables": {
                "fills": [{"id": "VariableID:color-brand"}],
                "itemSpacing": {"id": "VariableID:space-24"},
            }
        }
        result = compare_variable_tokens(node, {
            "variables": {
                "VariableID:color-brand": "--color-brand",
            }
        })
        self.assertEqual(2, result["boundVariableCount"])
        self.assertEqual(1, result["mappedCount"])
        self.assertEqual(1, result["unmappedCount"])
        self.assertEqual("observe-or-map-missing-tokens", result["nextAction"])

    def test_combined_analysis_keeps_layout_and_token_evidence_separate(self):
        result = analyze_figma_intent(
            {
                "layoutMode": "HORIZONTAL",
                "layoutWrap": "WRAP",
                "boundVariables": {"itemSpacing": {"id": "space-gap"}},
            },
            {"space-gap": "--space-gap"},
        )
        self.assertTrue(result["layout"]["available"])
        self.assertEqual("reuse-observed-design-tokens", result["variables"]["nextAction"])


if __name__ == "__main__":
    unittest.main()
