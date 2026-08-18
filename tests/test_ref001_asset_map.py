from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_ref001_asset_map as validator  # noqa: E402


class Ref001AssetMapTests(unittest.TestCase):
    def test_current_asset_map_is_structurally_safe_during_incremental_materialization(self) -> None:
        errors, counts = validator.validate(validator.DEFAULT_MAP)
        self.assertEqual([], errors)
        self.assertEqual(32, counts["total"])
        self.assertEqual(32, counts["rendered"] + counts["dummy"])

    def test_complete_mode_rejects_any_remaining_dummy(self) -> None:
        errors, counts = validator.validate(validator.DEFAULT_MAP, require_complete=True)
        if counts["dummy"]:
            self.assertTrue(any("dummy remains" in error for error in errors))
        else:
            self.assertEqual([], errors)

    def test_asset_map_figma_lineage_matches_registry(self) -> None:
        images = validator.load_images(validator.DEFAULT_MAP)
        registry, errors = validator.load_registry(validator.DEFAULT_REGISTRY)
        self.assertEqual([], errors)
        self.assertEqual(validator.EXPECTED_SLOTS, set(images))
        for slot, entry in images.items():
            self.assertEqual({"pc", "sp"}, set(entry["figma"]))
            for viewport in ("pc", "sp"):
                self.assertEqual(registry[(slot, viewport)]["node_id"], entry["figma"][viewport])

    def test_registry_requires_webp_sp_3x_and_cta_alpha(self) -> None:
        registry, errors = validator.load_registry(validator.DEFAULT_REGISTRY)
        self.assertEqual([], errors)
        self.assertEqual(32, len(registry))
        for (slot, viewport), asset in registry.items():
            self.assertEqual("webp", asset["format"])
            self.assertTrue(str(asset["path"]).endswith(".webp"))
            self.assertEqual(3 if viewport == "sp" else 1, asset["scale"])
            if slot.startswith("cta-person-"):
                self.assertTrue(asset["alpha_required"])
                self.assertTrue(asset["colored_silhouette_included"])
                self.assertTrue(asset["cta_background_omitted"])
                self.assertEqual(
                    ["colored_silhouette", "person"],
                    [layer["role"] for layer in asset["cta_layers"]],
                )

    def test_canonical_webp_dimensions_hashes_and_cta_alpha(self) -> None:
        registry, errors = validator.load_registry(validator.DEFAULT_REGISTRY)
        self.assertEqual([], errors)
        for (slot, viewport), asset in registry.items():
            path = validator.ROOT / str(asset["path"])
            width, height, has_alpha = validator.inspect_webp(path)
            self.assertEqual((asset["source_width"], asset["source_height"]), (width, height))
            if slot.startswith("cta-person-"):
                self.assertTrue(has_alpha, f"{slot}.{viewport}")


if __name__ == "__main__":
    unittest.main()
