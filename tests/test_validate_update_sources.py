from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import fetch_update_radar as radar  # noqa: E402
import validate_update_sources as registry  # noqa: E402


def current_registry() -> dict:
    return yaml.safe_load((ROOT / "config/update-sources.yaml").read_text(encoding="utf-8"))


class UpdateSourceRegistryTests(unittest.TestCase):
    def test_current_registry_is_valid(self) -> None:
        self.assertEqual([], registry.registry_errors(current_registry()))

    def test_figma_lane_tracks_current_layout_typography_asset_and_mode_semantics(self) -> None:
        data = current_registry()
        source_ids = {source["id"] for source in data["lanes"]["FIGMA"]["sources"]}
        self.assertTrue(
            {
                "figma-auto-layout-current",
                "figma-auto-layout-flexbox-generation",
                "figma-grid-auto-layout-current",
                "figma-text-properties-current",
                "figma-export-formats-current",
                "figma-image-crop-current",
                "figma-variables-dev-mode-current",
            }.issubset(source_ids)
        )

        retest = data["retest_keyword_map"]
        self.assertIn("FIGMA_LAYOUT_GENERATION", retest)
        self.assertIn("TYPOGRAPHY_RUNTIME", retest)
        self.assertIn("ASSET_FIDELITY", retest)
        self.assertIn("VARIABLE_MODE_RUNTIME", retest)
        self.assertIn("line-height", retest["TYPOGRAPHY_RUNTIME"]["keywords"])
        self.assertIn("vertical trim", retest["TYPOGRAPHY_RUNTIME"]["keywords"])
        self.assertIn("text-wrap", retest["TYPOGRAPHY_RUNTIME"]["keywords"])
        self.assertIn("legacy auto layout", retest["FIGMA_LAYOUT_GENERATION"]["keywords"])
        self.assertIn("image crop", retest["ASSET_FIDELITY"]["keywords"])
        self.assertIn("variable mode", retest["VARIABLE_MODE_RUNTIME"]["keywords"])

    def test_duplicate_source_id_is_rejected_across_lanes(self) -> None:
        data = current_registry()
        duplicate = copy.deepcopy(data["lanes"]["FIGMA"]["sources"][0])
        data["lanes"]["MCP"]["sources"].append(duplicate)
        errors = registry.registry_errors(data)
        self.assertTrue(any("duplicate source id" in error for error in errors))

    def test_invalid_kind_authority_url_topics_and_impacts_are_rejected(self) -> None:
        data = current_registry()
        source = data["lanes"]["FIGMA"]["sources"][0]
        source["kind"] = "MAGIC"
        source["authority"] = "BLOG"
        source["url"] = "http://example.com/feed"
        source["topics"] = []
        source["impacts"] = [""]
        errors = registry.registry_errors(data)
        self.assertTrue(any("unsupported kind" in error for error in errors))
        self.assertTrue(any("authority must be OFFICIAL" in error for error in errors))
        self.assertTrue(any("absolute https URL" in error for error in errors))
        self.assertTrue(any("topics must not be empty" in error for error in errors))
        self.assertTrue(any("impacts must contain only non-empty strings" in error for error in errors))

    def test_conditional_lane_requires_explicit_company_profile_activation(self) -> None:
        data = current_registry()
        data["lanes"]["SAFARI_WEBKIT"].pop("activation")
        errors = registry.registry_errors(data)
        self.assertTrue(any("SAFARI_WEBKIT: conditional lane requires activation" in error for error in errors))

    def test_browser_lane_activation_uses_required_environment_profiles_not_width(self) -> None:
        lane = current_registry()["lanes"]["SAFARI_WEBKIT"]
        safari_policy = {
            "browser_support": {
                "environment_profiles": [
                    {
                        "id": "ios-safari",
                        "role": "REQUIRED",
                        "browser": "Safari",
                        "engine": "WebKit",
                    }
                ]
            }
        }
        chrome_policy = {
            "browser_support": {
                "environment_profiles": [
                    {
                        "id": "desktop-chrome-390",
                        "role": "REQUIRED",
                        "browser": "Chrome",
                        "engine": "Blink",
                        "viewport": {"width_css_px": 390},
                    }
                ]
            }
        }
        self.assertTrue(radar.lane_enabled("SAFARI_WEBKIT", lane, safari_policy))
        self.assertFalse(radar.lane_enabled("SAFARI_WEBKIT", lane, chrome_policy))


if __name__ == "__main__":
    unittest.main()
