import unittest

from scripts.ref001_ci_impact import FULL_WIDTHS, classify


class Ref001CiImpactTests(unittest.TestCase):
    def test_outlined_logo_svg_is_light_without_content_stress(self):
        impact = classify([
            "experiments/ref001-blind-clean-20260812/implementation/theme/assets/icons/university-logo-outlined.svg"
        ])
        self.assertEqual(impact.mode, "light")
        self.assertEqual(impact.widths, (375, 768, 1380))
        self.assertTrue(impact.run_browser)
        self.assertFalse(impact.run_stress)

    def test_section_template_uses_breakpoint_boundaries_and_stress(self):
        impact = classify([
            "experiments/ref001-blind-clean-20260812/implementation/theme/template-parts/sections/student-voice.php"
        ])
        self.assertEqual(impact.mode, "section")
        self.assertEqual(impact.widths, (375, 767, 768, 1380))
        self.assertTrue(impact.run_stress)

    def test_header_template_is_section_risk(self):
        impact = classify([
            "experiments/ref001-blind-clean-20260812/implementation/theme/template-parts/header-site.php"
        ])
        self.assertEqual(impact.mode, "section")

    def test_local_visual_css_is_section_risk(self):
        impact = classify([
            "experiments/ref001-blind-clean-20260812/implementation/theme/assets/css/v2-header-polish.css"
        ])
        self.assertEqual(impact.mode, "section")
        self.assertTrue(impact.run_stress)

    def test_responsive_css_requires_full_matrix(self):
        impact = classify([
            "experiments/ref001-blind-clean-20260812/implementation/theme/assets/css/v2-responsive-continuity.css"
        ])
        self.assertEqual(impact.mode, "full")
        self.assertEqual(impact.widths, FULL_WIDTHS)
        self.assertTrue(impact.run_stress)

    def test_runtime_tooling_requires_full_matrix(self):
        impact = classify([
            "experiments/ref001-blind-clean-20260812/tools/capture-first-pass.mjs"
        ])
        self.assertEqual(impact.mode, "full")

    def test_router_and_workflow_changes_require_full_matrix(self):
        impact = classify([
            "scripts/ref001_ci_impact.py",
            ".github/workflows/ref001-blind-clean-runtime.yml",
        ])
        self.assertEqual(impact.mode, "full")

    def test_test_only_change_skips_browser(self):
        impact = classify(["tests/test_ref001_v2_logo_contract.py"])
        self.assertEqual(impact.mode, "static")
        self.assertFalse(impact.run_browser)
        self.assertFalse(impact.run_stress)

    def test_mixed_light_and_global_escalates_to_full(self):
        impact = classify([
            "experiments/ref001-blind-clean-20260812/implementation/theme/assets/icons/university-logo-outlined.svg",
            "experiments/ref001-blind-clean-20260812/implementation/theme/style.css",
        ])
        self.assertEqual(impact.mode, "full")

    def test_unknown_implementation_file_falls_back_to_full(self):
        impact = classify([
            "experiments/ref001-blind-clean-20260812/implementation/new-runtime-contract.json"
        ])
        self.assertEqual(impact.mode, "full")

    def test_empty_change_set_falls_back_to_full(self):
        impact = classify([])
        self.assertEqual(impact.mode, "full")
        self.assertTrue(impact.run_browser)


if __name__ == "__main__":
    unittest.main()
