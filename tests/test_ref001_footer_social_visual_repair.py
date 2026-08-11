from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-wordpress-acf" / "fixture-theme"
FOOTER = THEME / "footer.php"
CSS = THEME / "assets" / "css" / "ref001-footer.css"


def split_responsive_css(css: str) -> tuple[str, str]:
    marker = "@media (max-width: 767px)"
    assert marker in css, "Footer CSS must use the owner-resolved 768px breakpoint contract"
    desktop, mobile = css.split(marker, 1)
    return desktop, mobile


class Ref001FooterSocialVisualRepairTests(unittest.TestCase):
    def test_footer_no_longer_uses_social_placeholder_characters(self) -> None:
        footer = FOOTER.read_text(encoding="utf-8")
        self.assertNotIn('aria-hidden="true">f</span>', footer)
        self.assertNotIn('aria-hidden="true">▶</span>', footer)
        self.assertNotIn('aria-hidden="true">◎</span>', footer)
        self.assertNotIn('class="ref001-footer__line"', footer)

    def test_all_four_social_icons_have_semantic_visual_classes(self) -> None:
        footer = FOOTER.read_text(encoding="utf-8")
        for network in ("facebook", "youtube", "instagram", "line"):
            self.assertIn(f"ref001-footer__sns-icon--{network}", footer)
        self.assertIn('aria-label="公式SNS"', footer)
        self.assertIn('data-destinations="deferred"', footer)

    def test_social_icons_match_supplied_28px_brand_glyph_scale(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        self.assertIn("gap: 32px", css)
        self.assertIn(".ref001-footer__sns-icon--facebook", css)
        self.assertIn("width: 28px", css)
        self.assertIn("height: 28px", css)
        self.assertIn(".ref001-footer__sns-icon--youtube", css)
        self.assertIn("width: 29px", css)
        self.assertIn("height: 20px", css)
        self.assertIn(".ref001-footer__sns-icon--instagram", css)
        self.assertIn("width: 25px", css)
        self.assertIn("height: 25px", css)
        self.assertIn(".ref001-footer__sns-icon--line", css)
        self.assertIn("background: #020b4a", css)

    def test_footer_endpoint_geometry_remains_fixed(self) -> None:
        css = CSS.read_text(encoding="utf-8")
        desktop, mobile = split_responsive_css(css)
        self.assertNotIn("@media (max-width: 600px)", css)
        self.assertIn("height: 357px", desktop)
        self.assertIn("height: 515px", mobile)
        self.assertIn("top: 253px", mobile)
        self.assertIn("top: 437px", mobile)
        # Narrower-than-Figma runtime safety may adapt the one-line utility,
        # but the 375px acceptance endpoint keeps the supplied 12px size.
        self.assertIn("@media (max-width: 374px)", mobile)
        self.assertIn("font-size: 3.2vw", mobile)


if __name__ == "__main__":
    unittest.main()
