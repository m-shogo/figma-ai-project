from __future__ import annotations

import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import build_ref001_wordpress_seed as builder  # noqa: E402


class Ref001WordPressSeedTests(unittest.TestCase):
    def test_real_fixture_builds_stable_field_key_payload(self) -> None:
        payload = builder.build_payload()
        self.assertEqual(2, payload["schema_version"])
        self.assertEqual("REF-001-CHIBA-KEIZAI-SAMPLE", payload["reference_id"])
        self.assertEqual("ref001-learning", payload["page"]["slug"])
        self.assertEqual("page-templates/template-ref001.php", payload["page"]["template"])
        self.assertEqual(47, payload["summary"]["ready_field_count"])
        self.assertEqual(9, payload["summary"]["unresolved_field_count"])
        self.assertEqual(2, payload["summary"]["content_source_count"])
        self.assertEqual(2, payload["summary"]["acf_export_count"])

        fields = {row["field_name"]: row for row in payload["fields"]}
        self.assertEqual("field_ref001_mv_lead", fields["mv_lead"]["field_key"])
        self.assertEqual("READY", fields["mv_lead"]["status"])
        self.assertEqual("field_ref001_mv_left_person_image", fields["mv_left_person_image"]["field_key"])
        self.assertEqual("UNRESOLVED", fields["mv_left_person_image"]["status"])
        self.assertIsNone(fields["mv_left_person_image"]["value"])

        self.assertEqual("field_ref001_education_1_title", fields["education_1_title"]["field_key"])
        self.assertEqual("READY", fields["education_1_title"]["status"])
        self.assertEqual("field_ref001_education_4_bullet_3", fields["education_4_bullet_3"]["field_key"])
        self.assertEqual("READY", fields["education_4_bullet_3"]["status"])
        self.assertEqual("field_ref001_education_3_image", fields["education_3_image"]["field_key"])
        self.assertEqual("UNRESOLVED", fields["education_3_image"]["status"])
        self.assertEqual(
            "befe413ae4704994a80e0d7456914cd7c884073d",
            fields["education_3_image"]["figma_evidence"]["figma_image_hash"],
        )

        self.assertEqual(
            "field_ref001_course_it_description",
            fields["course_it_description"]["field_key"],
        )
        self.assertEqual("READY", fields["course_it_description"]["status"])

    def test_payload_carries_modular_source_fingerprints(self) -> None:
        payload = builder.build_payload()
        sources = payload["sources"]
        self.assertEqual(2, len(sources["fixture_contents"]))
        self.assertEqual(2, len(sources["acf_exports"]))
        for group in ("fixture_contents", "acf_exports"):
            for source in sources[group]:
                self.assertTrue(source["path"])
                self.assertEqual(64, len(source["sha256"]))

    def test_unknown_fixture_field_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            content = yaml.safe_load(builder.CONTENT_PATH.read_text(encoding="utf-8"))
            export = json.loads(builder.ACF_EXPORT_PATH.read_text(encoding="utf-8"))
            content = copy.deepcopy(content)
            content["acf_values"]["not_in_acf_export"] = "bad"

            content_path = root / "fixture-content.yaml"
            export_path = root / "acf-export.json"
            content_path.write_text(yaml.safe_dump(content, allow_unicode=True, sort_keys=False), encoding="utf-8")
            export_path.write_text(json.dumps(export, ensure_ascii=False), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "unknown ACF field"):
                builder.build_payload((content_path,), (export_path,))

    def test_media_placeholder_must_map_to_image_field(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            content = yaml.safe_load(builder.CONTENT_PATH.read_text(encoding="utf-8"))
            export = json.loads(builder.ACF_EXPORT_PATH.read_text(encoding="utf-8"))
            content = copy.deepcopy(content)
            content["media_placeholders"]["mv_lead"] = {"wp_attachment_id": None}

            content_path = root / "fixture-content.yaml"
            export_path = root / "acf-export.json"
            content_path.write_text(yaml.safe_dump(content, allow_unicode=True, sort_keys=False), encoding="utf-8")
            export_path.write_text(json.dumps(export, ensure_ascii=False), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "must map to an ACF image field"):
                builder.build_payload((content_path,), (export_path,))

    def test_duplicate_content_field_across_sources_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            first = yaml.safe_load(builder.CONTENT_PATH.read_text(encoding="utf-8"))
            second = {
                "schema_version": 1,
                "reference_id": first["reference_id"],
                "acf_values": {"mv_lead": "duplicate"},
                "media_placeholders": {},
            }
            first_path = root / "first.yaml"
            second_path = root / "second.yaml"
            first_path.write_text(yaml.safe_dump(first, allow_unicode=True, sort_keys=False), encoding="utf-8")
            second_path.write_text(yaml.safe_dump(second, allow_unicode=True, sort_keys=False), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "duplicate fixture content field"):
                builder.build_payload((first_path, second_path), (builder.ACF_EXPORT_PATH,))

    def test_render_is_deterministic_and_sorted_by_field_name(self) -> None:
        payload = builder.build_payload()
        rendered = builder.render_payload(payload)
        reparsed = json.loads(rendered)
        names = [row["field_name"] for row in reparsed["fields"]]
        self.assertEqual(sorted(names), names)
        self.assertTrue(rendered.endswith("\n"))


if __name__ == "__main__":
    unittest.main()
