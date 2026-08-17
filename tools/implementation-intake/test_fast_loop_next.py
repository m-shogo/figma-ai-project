import json
import tempfile
import unittest
from pathlib import Path

from fast_loop_next import (
    bridge_manifest,
    browser_qa_plan,
    compare_typed_css_values,
    evidence_maturity,
    extract_css_adjustments,
    figma_instruction_evidence,
    font_provenance_diff,
    human_learning_record,
    materialize_bytes,
    plan_capabilities,
    repair_optimizer,
    responsive_continuum_plan,
    responsive_transition_evidence,
    validate_ephemeral_url,
)


class FastLoopNextTests(unittest.TestCase):
    def test_typed_css_requires_unit_context(self):
        self.assertEqual(compare_typed_css_values("12px", "14px")["delta"], 2)
        self.assertFalse(compare_typed_css_values("1rem", "16px")["comparable"])

    def test_cross_browser_is_risk_gated(self):
        self.assertEqual(browser_qa_plan()["browsers"], ["chromium"])
        self.assertEqual(browser_qa_plan(["font", "grid"])["browsers"], ["chromium", "webkit", "firefox"])

    def test_responsive_continuum_keeps_breakpoint_edges(self):
        widths = responsive_continuum_plan(320, 1380, [768], 9)
        self.assertTrue({767, 768, 769}.issubset(widths))

    def test_container_transition_is_distinct(self):
        result = responsive_transition_evidence([
            {"viewportWidth": 1200, "containerWidth": 520, "signature": "wide"},
            {"viewportWidth": 1200, "containerWidth": 380, "signature": "stacked"},
        ])
        self.assertEqual(result["transitions"][0]["cause"], "container-driven")

    def test_code_connect_unavailable_is_undetermined(self):
        result = figma_instruction_evidence({"codeConnectAvailable": False, "codeConnectError": "seat unavailable"})
        self.assertEqual(result["codeConnect"]["state"], "UNDETERMINED")

    def test_code_connect_mapping_is_authority(self):
        result = figma_instruction_evidence({"codeConnect": [{"componentName": "Button", "source": "src/Button.tsx"}]})
        self.assertEqual(result["codeConnect"]["authority"], "existing-code-component")

    def test_font_fallback_is_visible(self):
        result = font_provenance_diff({"family": "Noto Sans JP"}, {"computedFamily": "Arial", "loadedFamilies": ["Arial"]})
        self.assertTrue(result["fallbackSuspected"])

    def test_repair_optimizer_never_uses_runtime_regression(self):
        result = repair_optimizer(5.4, [
            {"id": "bad", "score": 8.0},
            {"id": "good", "score": 4.9},
            {"id": "runtime-bad", "score": 4.0, "runtimeOk": False},
        ])
        self.assertEqual(result["best"]["id"], "good")

    def test_human_diff_stays_e1_project_scoped(self):
        diff = """+++ b/style.css
- padding-top: 34px;
+ padding-top: 30px;
"""
        self.assertEqual(extract_css_adjustments(diff)[0]["property"], "padding-top")
        record = human_learning_record(diff, "project")
        self.assertEqual(record["evidenceMaturity"], "E1")
        self.assertFalse(record["portablePromotion"])

    def test_portable_promotion_requires_cross_reference_evidence(self):
        one = evidence_maturity([{"runId": "r1", "referenceId": "f1", "domain": "web-page"}])
        self.assertEqual(one["level"], "E1")
        self.assertFalse(one["portablePromotion"])
        many = evidence_maturity([
            {"runId": "r1", "referenceId": "f1", "domain": "web-page"},
            {"runId": "r2", "referenceId": "f2", "domain": "web-page"},
            {"runId": "r3", "referenceId": "f3", "domain": "web-component"},
            {"runId": "r4", "referenceId": "f3", "domain": "web-component"},
        ])
        self.assertEqual(many["level"], "E5")

    def test_asset_materializer_is_content_addressed_and_url_free(self):
        with self.assertRaises(ValueError):
            validate_ephemeral_url("https://example.com/x.png")
        with tempfile.TemporaryDirectory() as tmp:
            record = materialize_bytes(b"asset", Path(tmp), "hero-pc", ".png", {"nodeId": "1:2"})
            self.assertTrue((Path(tmp) / record["path"]).exists())
            self.assertNotIn("api/mcp/asset/", json.dumps(record))

    def test_bridge_manifest_matches_current_v1_shape(self):
        manifest = bridge_manifest("hero.png", "a" * 64, "hero", "m-shogo/figma-ai-project", "agent/assets", "assets/hero.png")
        self.assertEqual(manifest["version"], 1)
        self.assertEqual(manifest["sourceFile"], "hero.png")
        with self.assertRaises(ValueError):
            bridge_manifest("../hero.png", "a" * 64, "hero", "m-shogo/figma-ai-project", "agent/assets", "assets/hero.png")

    def test_planner_keeps_simple_project_light(self):
        result = plan_capabilities({"implementation": {"url": "http://localhost", "selector": "main"}, "viewport": {"width": 1280, "height": 800, "dpr": 1}, "fontRisk": False})
        self.assertEqual(result["browserPlan"]["browsers"], ["chromium"])
        self.assertFalse(result["policy"]["allOnByDefault"])

    def test_planner_activates_risky_interaction_capabilities(self):
        result = plan_capabilities({
            "implementation": {"url": "http://localhost", "selector": "main"},
            "viewport": {"width": 390, "height": 844, "dpr": 3},
            "riskSignals": ["font", "grid"],
            "interactionStates": [{"id": "default"}, {"id": "open", "actions": [{"type": "click", "selector": ".toggle"}]}],
            "containerSelectors": [".card"],
            "responsiveContinuum": {"min": 320, "max": 1380, "knownBreakpoints": [768], "maxProbes": 9},
            "assetMaterialization": True,
            "humanRepairLearning": True,
            "repairCandidates": [{"id": "a"}],
        })
        self.assertIn("interaction-state-matrix", result["activated"])
        self.assertIn("aria-semantic", result["activated"])
        self.assertIn("container-responsive-evidence", result["activated"])
        self.assertIn("asset-materializer", result["activated"])
        self.assertEqual(result["browserPlan"]["browsers"], ["chromium", "webkit", "firefox"])


if __name__ == "__main__":
    unittest.main()
