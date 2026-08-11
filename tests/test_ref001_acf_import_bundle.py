from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import build_ref001_acf_import_bundle as bundle  # noqa: E402
import validate_acf_export  # noqa: E402


class Ref001AcfImportBundleTests(unittest.TestCase):
    def test_bundle_preserves_source_field_groups_in_order(self) -> None:
        expected = []
        for path in bundle.SOURCE_EXPORTS:
            expected.extend(bundle.load_export(path))

        actual = bundle.build_bundle()
        self.assertEqual(expected, actual)
        self.assertEqual(
            ["group_ref001_top_page", "group_ref001_courses"],
            [item["key"] for item in actual],
        )

    def test_bundle_is_valid_portable_acf_json(self) -> None:
        actual = bundle.build_bundle()
        self.assertEqual([], validate_acf_export.validate_export(actual))
        self.assertEqual([], bundle.validate_bundle_identity(actual))

        rendered = bundle.render_bundle(actual)
        decoded = json.loads(rendered)
        self.assertEqual(actual, decoded)
        self.assertTrue(rendered.endswith("\n"))

    def test_both_groups_target_the_same_learning_page_template(self) -> None:
        actual = bundle.build_bundle()
        locations = []
        for group in actual:
            rule = group["location"][0][0]
            locations.append((rule["param"], rule["operator"], rule["value"]))

        self.assertEqual(
            [
                ("page_template", "==", "page-templates/template-ref001.php"),
                ("page_template", "==", "page-templates/template-ref001.php"),
            ],
            locations,
        )

    def test_check_mode_detects_stale_output(self) -> None:
        rendered = bundle.render_bundle(bundle.build_bundle())
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "acf-import-bundle.json"
            path.write_text(rendered, encoding="utf-8")
            self.assertEqual(rendered, path.read_text(encoding="utf-8"))
            path.write_text("[]\n", encoding="utf-8")
            self.assertNotEqual(rendered, path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
