from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_wordpress_learning_fixture as validator  # noqa: E402


class WordPressLearningFixtureTests(unittest.TestCase):
    def test_repository_fixture_passes(self) -> None:
        self.assertEqual([], validator.validate_fixture())

    def copy_fixture(self, directory: str) -> tuple[Path, Path]:
        root = Path(directory).resolve()
        fixture = root / "fixture-theme"
        shutil.copytree(validator.DEFAULT_FIXTURE, fixture)
        acf_export = root / "acf-export.json"
        shutil.copy2(validator.DEFAULT_ACF_EXPORT, acf_export)
        return fixture, acf_export

    def test_expiring_figma_asset_url_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fixture, acf_export = self.copy_fixture(directory)
            target = fixture / "template-parts" / "ref001" / "main-visual.php"
            ephemeral_url = "https://" + "www.figma.com" + "/api/mcp/asset/temporary.png"
            target.write_text(
                target.read_text(encoding="utf-8")
                + f'\n<img src="{ephemeral_url}" alt="">\n',
                encoding="utf-8",
            )
            errors = validator.validate_fixture(fixture, acf_export)
            self.assertTrue(any("expiring Figma MCP asset URLs" in error for error in errors))

    def test_repeater_api_is_rejected_in_fixed_cardinality_baseline(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fixture, acf_export = self.copy_fixture(directory)
            target = fixture / "template-parts" / "ref001" / "reason.php"
            target.write_text(
                target.read_text(encoding="utf-8") + "\n<?php if ( have_rows( 'reason_cards' ) ) : endif; ?>\n",
                encoding="utf-8",
            )
            errors = validator.validate_fixture(fixture, acf_export)
            self.assertTrue(any("ACF Repeater API" in error for error in errors))

    def test_page_template_location_mismatch_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fixture, acf_export = self.copy_fixture(directory)
            data = json.loads(acf_export.read_text(encoding="utf-8"))
            data[0]["location"][0][0]["value"] = "page-templates/other.php"
            acf_export.write_text(json.dumps(data), encoding="utf-8")
            errors = validator.validate_fixture(fixture, acf_export)
            self.assertTrue(any("page_template location" in error for error in errors))

    def test_image_return_url_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fixture, acf_export = self.copy_fixture(directory)
            data = json.loads(acf_export.read_text(encoding="utf-8"))
            image = next(field for field in data[0]["fields"] if field.get("type") == "image")
            image["return_format"] = "url"
            acf_export.write_text(json.dumps(data), encoding="utf-8")
            errors = validator.validate_fixture(fixture, acf_export)
            self.assertTrue(any("must return attachment ID" in error for error in errors))

    def test_missing_education_stage_field_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fixture, acf_export = self.copy_fixture(directory)
            data = json.loads(acf_export.read_text(encoding="utf-8"))
            data[0]["fields"] = [
                field
                for field in data[0]["fields"]
                if field.get("name") != "education_4_bullet_3"
            ]
            acf_export.write_text(json.dumps(data), encoding="utf-8")
            errors = validator.validate_fixture(fixture, acf_export)
            self.assertTrue(any("fixed four-stage Education ACF contract" in error for error in errors))

    def test_education_stage_number_cannot_become_editor_field(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fixture, acf_export = self.copy_fixture(directory)
            data = json.loads(acf_export.read_text(encoding="utf-8"))
            data[0]["fields"].append(
                {
                    "key": "field_ref001_education_1_number",
                    "label": "Stage number",
                    "name": "education_1_number",
                    "type": "text",
                }
            )
            acf_export.write_text(json.dumps(data), encoding="utf-8")
            errors = validator.validate_fixture(fixture, acf_export)
            self.assertTrue(any("stage identity/order must remain code-owned" in error for error in errors))

    def test_education_template_part_is_required(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fixture, acf_export = self.copy_fixture(directory)
            (fixture / "template-parts" / "ref001" / "education.php").unlink()
            errors = validator.validate_fixture(fixture, acf_export)
            self.assertTrue(any("education.php" in error for error in errors))

    def test_courses_existing_files_must_be_wired_into_template(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fixture, acf_export = self.copy_fixture(directory)
            template = fixture / validator.TEMPLATE_RELATIVE_PATH
            source = template.read_text(encoding="utf-8").replace(
                "\t<?php get_template_part( 'template-parts/ref001/courses' ); ?>\n",
                "",
            )
            template.write_text(source, encoding="utf-8")
            errors = validator.validate_fixture(fixture, acf_export)
            self.assertTrue(any("must include the courses template part" in error for error in errors))

    def test_courses_stylesheet_must_be_enqueued(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fixture, acf_export = self.copy_fixture(directory)
            functions = fixture / "functions.php"
            source = functions.read_text(encoding="utf-8").replace("ref001-courses.css", "missing-courses.css")
            functions.write_text(source, encoding="utf-8")
            errors = validator.validate_fixture(fixture, acf_export)
            self.assertTrue(any("ref001-courses.css" in error for error in errors))

    def test_partial_fixture_cannot_silently_claim_full_page(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fixture, acf_export = self.copy_fixture(directory)
            template = fixture / validator.TEMPLATE_RELATIVE_PATH
            source = template.read_text(encoding="utf-8").replace('data-fixture-completeness="partial"', 'data-fixture-completeness="full"')
            template.write_text(source, encoding="utf-8")
            errors = validator.validate_fixture(fixture, acf_export)
            self.assertTrue(any("data-fixture-completeness=partial" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
