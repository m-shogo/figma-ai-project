#!/usr/bin/env python3
from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import fast_visual_qa as qa


class FastVisualQaTest(unittest.TestCase):
    def test_contract_validation_and_risk_depth(self):
        contract = {
            "id": "hero-pc",
            "figma": {"fileKey": "x", "nodeId": "1:2"},
            "implementation": {"url": "http://127.0.0.1:3000", "selector": "#hero"},
            "viewport": {"width": 1380, "height": 900},
            "reference": {"image": "hero.png", "measurement": "hero.json"},
            "risk": {"signals": {"slider": True, "pcSpStructureGap": True}},
        }
        self.assertEqual([], qa.validate_contract(contract))
        self.assertEqual("STANDARD", qa.choose_qa_depth(contract)["depth"])

    def test_structured_diagnosis_classifies_geometry_typography_and_crop(self):
        reference = {
            "box": {"x": 0, "y": 100, "width": 1000, "height": 400},
            "style": {"fontSize": "16px", "lineHeight": "24px", "color": "rgb(0, 0, 0)"},
            "images": [{"box": {"x": 0, "y": 100, "width": 500, "height": 300}, "objectFit": "cover", "objectPosition": "50% 50%"}],
            "text": "hello",
        }
        actual = {
            "box": {"x": 16, "y": 100, "width": 1000, "height": 424},
            "style": {"fontSize": "17px", "lineHeight": "25px", "color": "rgb(0, 0, 0)"},
            "images": [{"box": {"x": 0, "y": 100, "width": 500, "height": 300}, "objectFit": "cover", "objectPosition": "50% 20%"}],
            "text": "hello",
        }
        report = qa.diagnose_section(reference, actual, 0.13)
        self.assertIn("position", report["categories"])
        self.assertIn("section-boundary", report["categories"])
        self.assertIn("typography", report["categories"])
        self.assertIn("image-crop", report["categories"])

    def test_diagnosis_exposes_render_typography_stability_and_css_cause_evidence(self):
        reference = {
            "box": {"x": 100, "y": 100, "width": 200, "height": 100},
            "renderBox": {"x": 92, "y": 96, "width": 216, "height": 112},
            "style": {"fontFamily": "A", "lineHeight": "24px"},
            "typographyFingerprint": {
                "fontFamily": "A",
                "lineHeight": "24px",
                "lineRects": [{"width": 100}],
                "glyphMetrics": {"width": 100},
            },
        }
        actual = {
            "box": {"x": 100, "y": 100, "width": 200, "height": 112},
            "style": {"fontFamily": "B", "lineHeight": "26px"},
            "typographyFingerprint": {
                "fontFamily": "B",
                "lineHeight": "26px",
                "lineRects": [{"width": 80}, {"width": 20}],
                "glyphMetrics": {"width": 110},
            },
            "captureStability": {"stable": False},
            "matchedRules": [
                {"selector": ".section", "href": "layout.css", "declarations": {"min-height": "112px", "line-height": "26px"}},
            ],
        }
        report = qa.diagnose_section(reference, actual, 0.1)
        causes = report["causeEvidence"]
        self.assertTrue(causes["figmaRenderBounds"]["hasVisualOverflow"])
        self.assertTrue(causes["typography"]["requiresTypographyInspection"])
        self.assertIn("capture-before-layout-stable", causes["hints"])
        self.assertTrue(causes["cssRootCandidates"])

    def test_cumulative_drift_and_router(self):
        sections = [
            {"id": "s1", "reference": {"top": 0, "height": 100}, "actual": {"top": 0, "height": 102}},
            {"id": "s2", "reference": {"top": 100, "height": 100}, "actual": {"top": 102, "height": 102}},
            {"id": "s3", "reference": {"top": 200, "height": 100}, "actual": {"top": 204, "height": 108}},
            {"id": "s4", "reference": {"top": 300, "height": 100}, "actual": {"top": 312, "height": 115}},
        ]
        drift = qa.detect_cumulative_drift(sections)
        self.assertTrue(drift["detected"])
        route = qa.route_diagnosis([], drift)
        self.assertEqual("cumulative-spacing-height", route["actions"][0]["target"])

    def test_router_finds_shared_container(self):
        reports = []
        for section_id in ("a", "b", "c"):
            reports.append({"id": section_id, "viewport": "PC", "diagnosis": {"categories": ["position"], "differences": [{"property": "x", "deltaPx": 16, "category": "position"}]}})
        route = qa.route_diagnosis(reports)
        self.assertEqual("container-or-common-horizontal-rule", route["actions"][0]["target"])

    def test_repair_stop_redirects_after_two_low_gains(self):
        result = qa.repair_stop([0.20, 0.199, 0.1985], min_improvement=0.002)
        self.assertTrue(result["stop"])
        self.assertIn("wrong-asset", result["next"])

    def test_evidence_cache_reuses_unchanged_sources_and_budget(self):
        with tempfile.TemporaryDirectory() as tmp:
            cache = qa.EvidenceCache(Path(tmp) / "cache.json")
            cache.put("figma:hero", "rev-1", {"height": 400})
            cache.save()
            reopened = qa.EvidenceCache(Path(tmp) / "cache.json")
            self.assertEqual({"height": 400}, reopened.get("figma:hero", "rev-1"))
            plan = qa.reobservation_plan([
                {"key": "figma:hero", "sourceHash": "rev-1"},
                {"key": "figma:news", "sourceHash": "rev-2"},
                {"key": "repo:header", "sourceHash": "sha-2"},
            ], reopened, budget=1)
            self.assertEqual(["figma:hero"], plan["reuse"])
            self.assertEqual(["figma:news"], plan["observe"])
            self.assertEqual(["repo:header"], plan["deferred"])

    def test_scope_filter_protects_v2_v3_without_reading_everything(self):
        result = qa.filter_context(
            ["src/hero.tsx", "legacy/old.css", "experiments/ref/v2-implementation.css", "docs/readme.md"],
            {"include": ["src/**", "experiments/**"], "exclude": ["legacy/**"], "protected": ["**/v2-*", "**/v3-*"]},
        )
        self.assertEqual(["src/hero.tsx"], result["selected"])
        self.assertEqual(["experiments/ref/v2-implementation.css"], result["protected"])

    def test_component_mapping_requires_visual_semantic_behavioral_compatibility(self):
        result = qa.map_component([
            {"name": "Hero", "visual": 0.96, "semantic": 0.4, "behavior": 0.95},
            {"name": "CampaignHero", "visual": 0.88, "semantic": 0.9, "behavior": 0.9},
        ])
        self.assertEqual("reuse", result["decision"])
        self.assertEqual("CampaignHero", result["best"]["name"])

    def test_strategy_metrics_and_learning_are_small(self):
        measurement = qa.strategy_measurement("section-first", {"implementationSeconds": 90, "repairCount": 2, "unused": "drop"})
        self.assertNotIn("unused", measurement["metrics"])
        learning = qa.learning_feedback({"helpfulQa": ["section-boundary"], "wastedQa": ["deep-text-probe"]})
        self.assertEqual(["section-boundary"], learning["nextProject"]["increase"])
        self.assertEqual(["deep-text-probe"], learning["nextProject"]["decrease"])

    def test_mode_plan_keeps_fast_loop_light(self):
        self.assertNotIn("pc-full-page", qa.mode_plan("FAST", "QUICK"))
        self.assertIn("render-stability", qa.mode_plan("FAST", "QUICK"))
        self.assertIn("multi-scale-diff", qa.mode_plan("CHECKPOINT", "STANDARD"))
        self.assertIn("pc-full-page", qa.mode_plan("FINAL", "STANDARD"))


if __name__ == "__main__":
    unittest.main()
