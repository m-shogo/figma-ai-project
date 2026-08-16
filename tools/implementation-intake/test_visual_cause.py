#!/usr/bin/env python3
import unittest

from visual_cause import (
    asset_provenance_diff,
    calibrate_cause_predictions,
    choose_counterfactual,
    classify_dpr_variance,
    classify_multiscale,
    compare_render_bounds,
    detect_breakpoint_topology,
    rank_css_root_causes,
    rank_observation_candidates,
    render_stability,
    semantic_region_diff,
    typography_fingerprint_diff,
)


class VisualCauseTests(unittest.TestCase):
    def test_render_bounds_separate_effect_overflow_from_layout(self):
        result = compare_render_bounds(
            {"x": 100, "y": 100, "width": 200, "height": 100},
            {"x": 92, "y": 96, "width": 216, "height": 112},
        )
        self.assertTrue(result["hasVisualOverflow"])
        self.assertEqual(8, result["overhangPx"]["left"])
        self.assertEqual("figma-render-effect-overflow", result["likelyCause"])

    def test_typography_fingerprint_catches_wrap_and_glyph_metrics(self):
        result = typography_fingerprint_diff(
            {
                "fontFamily": "A",
                "lineHeight": "24px",
                "lineRects": [{"width": 100}, {"width": 80}],
                "glyphMetrics": {"width": 180, "actualBoundingBoxAscent": 14},
            },
            {
                "fontFamily": "B",
                "lineHeight": "26px",
                "lineRects": [{"width": 160}, {"width": 20}, {"width": 10}],
                "glyphMetrics": {"width": 190, "actualBoundingBoxAscent": 15},
            },
        )
        self.assertEqual(1, result["lineCountDelta"])
        self.assertIn("font-loading-or-font-selection", result["likelyCauses"])
        self.assertIn("glyph-advance-or-letter-spacing", result["likelyCauses"])

    def test_render_stability_requires_consecutive_frames(self):
        unstable = render_stability([
            {"x": 0, "y": 0, "width": 100, "height": 100},
            {"x": 0, "y": 0, "width": 100, "height": 101},
            {"x": 0, "y": 0, "width": 100, "height": 101},
        ])
        stable = render_stability([
            {"x": 0, "y": 0, "width": 100, "height": 100},
            {"x": 0, "y": 0, "width": 100, "height": 100.1},
            {"x": 0, "y": 0, "width": 100, "height": 100.1},
        ])
        self.assertFalse(unstable["stable"])
        self.assertTrue(stable["stable"])

    def test_css_root_cause_prefers_relevant_rule(self):
        result = rank_css_root_causes(
            {"category": "section-boundary", "property": "height", "deltaPx": 12},
            [
                {"selector": ".hero", "declarations": {"color": "red"}},
                {"selector": ".section", "href": "layout.css", "declarations": {"min-height": "500px", "padding-bottom": "24px"}},
            ],
        )
        self.assertEqual(".section", result["candidates"][0]["selector"])
        self.assertIn("min-height", result["candidates"][0]["overlap"])

    def test_css_root_cause_prefers_important_direct_transform_over_generic_padding(self):
        result = rank_css_root_causes(
            {"category": "position", "property": "x", "deltaPx": 12},
            [
                {"selector": ".section", "sourceOrder": 10, "declarations": {"padding-left": "0px", "padding-right": "0px"}},
                {"selector": ".section", "sourceOrder": 200, "declarations": {"transform": "translateX(12px)"}, "priorities": {"transform": "important"}},
            ],
        )
        top = result["candidates"][0]
        self.assertEqual(["transform"], top["overlap"])
        self.assertEqual(["transform"], top["important"])

    def test_counterfactual_accepts_measured_gain_and_labels_visual_regression(self):
        result = choose_counterfactual(0.08, [
            {"id": "literal", "pixelDiffRatio": 0.0813, "runtimePass": True},
            {"id": "owner-only", "pixelDiffRatio": 0.0544, "runtimePass": True},
            {"id": "broken", "pixelDiffRatio": 0.04, "runtimePass": False},
        ])
        self.assertEqual("owner-only", result["bestAccepted"]["id"])
        rejected = {row["id"]: row for row in result["candidates"]}
        self.assertFalse(rejected["literal"]["accepted"])
        self.assertEqual("visual-regression", rejected["literal"]["decisionReason"])
        self.assertEqual("runtime-regression", rejected["broken"]["decisionReason"])

    def test_multiscale_distinguishes_edge_noise_from_structure(self):
        edge = classify_multiscale({"1.0": 0.10, "0.5": 0.03, "0.25": 0.01})
        structure = classify_multiscale({"1.0": 0.10, "0.5": 0.08, "0.25": 0.06})
        self.assertEqual("edge-rasterization-dominant", edge["kind"])
        self.assertEqual("structural-difference-persists", structure["kind"])

    def test_asset_provenance_separates_wrong_asset_from_wrong_crop(self):
        wrong_asset = asset_provenance_diff(
            [{"src": "/a.webp", "naturalWidth": 400, "naturalHeight": 200, "objectFit": "cover", "objectPosition": "50% 50%"}],
            [{"src": "/b.webp", "naturalWidth": 300, "naturalHeight": 300, "objectFit": "cover", "objectPosition": "50% 50%"}],
        )
        wrong_crop = asset_provenance_diff(
            [{"src": "/a.webp", "naturalWidth": 400, "naturalHeight": 200, "objectFit": "cover", "objectPosition": "50% 50%"}],
            [{"src": "/a.webp", "naturalWidth": 400, "naturalHeight": 200, "objectFit": "cover", "objectPosition": "50% 20%"}],
        )
        self.assertEqual("wrong-asset-or-slot-mapping", wrong_asset["likelyCause"])
        self.assertEqual("wrong-crop-or-object-position", wrong_crop["likelyCause"])

    def test_dpr_variance_distinguishes_raster_sensitivity(self):
        stable = classify_dpr_variance({"1": 0.05, "2": 0.055})
        sensitive = classify_dpr_variance({"1": 0.03, "2": 0.08})
        self.assertEqual("dpr-stable", stable["kind"])
        self.assertEqual("dpr-rasterization-sensitive", sensitive["kind"])

    def test_semantic_region_diff_catches_missing_control(self):
        result = semantic_region_diff(
            [{"kind": "text"}, {"kind": "image"}, {"kind": "control"}],
            [{"kind": "text"}, {"kind": "image"}],
        )
        self.assertTrue(result["semanticStructureMismatch"])
        self.assertEqual(-1, result["countDeltas"]["control"])

    def test_prediction_calibration_tracks_overconfidence(self):
        result = calibrate_cause_predictions([
            {"predictedCause": "typography", "actualCause": "typography", "confidence": 0.9},
            {"predictedCause": "asset", "actualCause": "layout", "confidence": 0.9},
        ])
        self.assertEqual(0.5, result["hitRate"])
        self.assertGreater(result["calibrationGap"], 0.3)

    def test_information_value_scheduler_prioritizes_uncertain_risky_changed_section(self):
        ranked = rank_observation_candidates([
            {"id": "safe", "uncertainty": 0.1, "severity": "micro", "captureCost": 1},
            {"id": "risky", "uncertainty": 0.9, "severity": "major", "sharedPatternPotential": 0.8, "priorFailureRate": 0.7, "lateDiscoveryRisk": 0.8, "changed": True, "captureCost": 1},
        ])
        self.assertEqual("risky", ranked[0]["id"])

    def test_breakpoint_topology_detects_observed_composition_change(self):
        result = detect_breakpoint_topology([
            {"width": 375, "signature": {"composition": "sp", "columns": 1}},
            {"width": 767, "signature": {"composition": "sp", "columns": 1}},
            {"width": 768, "signature": {"composition": "pc", "columns": 4}},
            {"width": 1380, "signature": {"composition": "pc", "columns": 4}},
        ])
        self.assertEqual(1, len(result["transitions"]))
        self.assertEqual([767, 768], result["transitions"][0]["between"])


if __name__ == "__main__":
    unittest.main()
