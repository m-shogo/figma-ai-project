from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments" / "ref001-blind-clean-20260812" / "implementation" / "theme"
LOGO = THEME / "assets" / "icons" / "university-logo-outlined.svg"
HEADER = THEME / "template-parts" / "header-site.php"
FOOTER = THEME / "template-parts" / "footer-site.php"
HEADER_CSS = THEME / "v2-header-polish.css"
FOOTER_CSS = THEME / "v2-visual-polish.css"


class Ref001V2LogoContractTest(unittest.TestCase):
    def test_shared_logo_is_outlined_svg(self):
        svg = LOGO.read_text(encoding="utf-8")
        lower = svg.lower()

        self.assertIn('viewBox="0 0 187 47"', svg)
        self.assertEqual(svg.count("<path"), 25)
        self.assertNotIn("<text", lower)
        self.assertNotIn("font-family", lower)
        self.assertNotIn("font-size", lower)

    def test_header_and_footer_use_the_same_logo_asset(self):
        header = HEADER.read_text(encoding="utf-8")
        footer = FOOTER.read_text(encoding="utf-8")

        for markup in (header, footer):
            self.assertIn("assets/icons/university-logo-outlined.svg", markup)
            self.assertIn('alt="千葉経済大学 CHIBA KEIZAI"', markup)
            self.assertNotIn("footer-logo-mark.svg", markup)

        self.assertNotIn("ref-header-logo__jp", header)
        self.assertNotIn("ref-header-logo__en", header)
        self.assertNotIn("ref-footer-logo__jp", footer)
        self.assertNotIn("ref-footer-logo__en", footer)

    def test_figma_reference_dimensions_remain_explicit(self):
        header_css = HEADER_CSS.read_text(encoding="utf-8")
        footer_css = FOOTER_CSS.read_text(encoding="utf-8")
        footer = FOOTER.read_text(encoding="utf-8")

        self.assertIn(".ref-header-logo{width:187px;height:47px}", header_css)
        self.assertIn(".ref-header-logo{width:140px;height:35px}", header_css)
        self.assertIn(".ref-footer-logo{display:flex;align-items:flex-start;width:240px;height:61px", footer_css)
        self.assertIn('width="240" height="61"', footer)


if __name__ == "__main__":
    unittest.main()
