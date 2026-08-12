from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import build_human_review_site as builder  # noqa: E402
import validate_human_review_site as validator  # noqa: E402


class HumanReviewDashboardBuildTests(unittest.TestCase):
    def test_build_produces_latest_and_run_history_urls(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            site = builder.build_site(output=Path(directory) / "site")
            self.assertTrue((site / "ref-001/latest/review/index.html").is_file())
            self.assertTrue((site / "ref-001/latest/review/review-assist.js").is_file())
            self.assertTrue((site / "ref-001/latest/review/review-assist.css").is_file())
            self.assertTrue((site / "ref-001/latest/preview/index.html").is_file())
            self.assertTrue((site / "ref-001/latest/preview/human-review-repair.css").is_file())
            self.assertTrue((site / "ref-001/latest/preview/assets/images/dummy/image-pc.svg").is_file())
            self.assertTrue((site / "ref-001/latest/preview/assets/images/dummy/image-sp.svg").is_file())
            self.assertTrue((site / "ref-001/latest/preview/assets/icons/document.svg").is_file())
            self.assertTrue((site / "ref-001/latest/preview/assets/icons/course-7.svg").is_file())
            self.assertTrue((site / "ref-001/runs/run-2/review/index.html").is_file())
            self.assertTrue((site / "ref-001/runs/run-2/review/review-assist.js").is_file())
            self.assertTrue((site / "ref-001/runs/run-2/preview/index.html").is_file())
            self.assertTrue((site / ".nojekyll").is_file())
            self.assertEqual([], validator.validate_site(site))

    def test_manifest_keeps_human_review_pending_and_exact_endpoints(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            site = builder.build_site(output=Path(directory) / "site")
            manifest = json.loads(
                (site / "ref-001/latest/review/manifest.json").read_text(encoding="utf-8")
            )
            self.assertEqual(manifest["human_feedback_status"], "PENDING")
            self.assertEqual(manifest["human_review_status"], "PENDING")
            self.assertEqual(manifest["viewports"]["pc"]["width"], 1380)
            self.assertEqual(manifest["viewports"]["sp"]["width"], 375)
            self.assertEqual(manifest["viewports"]["sp"]["figma_device_chrome_px"], 40)
            self.assertEqual(manifest["viewports"]["sp"]["web_height"], 10777)
            self.assertEqual(len(manifest["sections"]), 13)

    def test_overlay_is_capability_gated_per_viewport(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            site = builder.build_site(output=Path(directory) / "site")
            manifest = json.loads(
                (site / "ref-001/latest/review/manifest.json").read_text(encoding="utf-8")
            )
            for viewport in ("pc", "sp"):
                capture = manifest["generated"]["captures"][viewport]
                self.assertTrue(capture["web"])
                self.assertEqual(capture["overlay_available"], bool(capture["figma"]))
                self.assertTrue((site / "ref-001/latest/review" / capture["web"]).resolve().is_file())

    def test_preview_is_actual_output_without_review_chrome(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            site = builder.build_site(output=Path(directory) / "site")
            preview = (site / "ref-001/latest/preview/index.html").read_text(encoding="utf-8")
            self.assertIn("data-ref001-page", preview)
            self.assertNotIn("Human Visual Review", preview)
            self.assertIn("Automated Final Preview", preview)
            self.assertIn("human-review-repair.css", preview)

    def test_preview_uses_swappable_pc_sp_images_focused_svg_assets_and_anchor_ctas(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            site = builder.build_site(output=Path(directory) / "site")
            preview = (site / "ref-001/latest/preview/index.html").read_text(encoding="utf-8")
            self.assertIn('<picture class="ref-picture', preview)
            self.assertIn('media="(max-width:767px)"', preview)
            self.assertIn('data-asset-slot="main-visual-left"', preview)
            self.assertIn('assets/images/dummy/image-pc.svg', preview)
            self.assertIn('assets/images/dummy/image-sp.svg', preview)
            self.assertIn('assets/icons/document.svg', preview)
            self.assertIn('assets/icons/open-campus.svg', preview)
            self.assertIn('assets/icons/course-1.svg', preview)
            self.assertIn('assets/icons/course-7.svg', preview)
            self.assertIn('<a href="#" class="ref-action', preview)
            self.assertNotIn('>▣<', preview)
            self.assertNotIn('>⚑<', preview)
            self.assertNotIn('data-icon=', preview)
            self.assertNotIn('fontawesome', preview.lower())

    def test_dashboard_uses_live_figma_embed_and_browser_local_feedback(self) -> None:
        app = (ROOT / "review-dashboard/app/app.js").read_text(encoding="utf-8")
        html = (ROOT / "review-dashboard/app/index.html").read_text(encoding="utf-8")
        self.assertIn("https://embed.figma.com/design/", app)
        self.assertIn("localStorage", app)
        self.assertIn("navigator.clipboard", app)
        self.assertIn('data-mode="overlay"', html)
        self.assertIn('data-mobile-panel="web"', html)
        self.assertIn("全FBをコピー", html)

    def test_dashboard_has_zero_friction_review_layer(self) -> None:
        assist = (ROOT / "review-dashboard/app/review-assist.js").read_text(encoding="utf-8")
        html = (ROOT / "review-dashboard/app/index.html").read_text(encoding="utf-8")
        css = (ROOT / "review-dashboard/app/review-assist.css").read_text(encoding="utf-8")
        for needle in (
            "navigateNextUnreviewed",
            "bulkMarkCurrentViewportGreen",
            "ArrowRight",
            "almost_same",
            "issues/new",
            "Review progress",
        ):
            self.assertIn(needle, assist)
        for needle in (
            'id="review-progress"',
            'id="next-unreviewed"',
            'id="auto-advance-green"',
            'id="unreviewed-only"',
            'id="bulk-green"',
            'id="create-issue"',
            'data-issue-repository="m-shogo/figma-ai-project"',
            'src="./review-assist.js"',
        ):
            self.assertIn(needle, html)
        self.assertIn("has-difference", css)
        self.assertIn("compact-toggle", css)


if __name__ == "__main__":
    unittest.main()
