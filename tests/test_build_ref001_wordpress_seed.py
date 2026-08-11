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
        self.assertEqual("REF-001-CHIBA-KEIZAI-SAMPLE", payload["reference_id"])
        self.assertEqual("ref001-learning", payload["page"]["slug"])
        self.assertEqual("page-templates/template-ref001.php", payload["page"]["template"])
        self.assertEqual(8, payload["summary"]["ready_field_count"])
        self.assertEqual(5, payload["summary"]["unresolved_field_count"])

        fields = {row["field_name"]: row for row in payload["fields"]}
        self.assertEqual("field_ref001_mv_lead", fields["mv_lead"]["field_key"])
        self.assertEqual("READY", fields["mv_lead"]["status"])
        self.assertEqual("field_ref001_mv_left_person_image", fields["mv_left_person_image"]["field_key"])
        self.assertEqual("UNRESOLVED", fields["mv_left_person_image"]["status"])
        self.assertIsNone(fields["mv_left_person_image"]["value"])

    def test_payload_carries_source_fingerprints(self) -> None:
        payload = builder.build_payload()
        self.assertEqual(64, len(payload["source"]["fixture_content_sha256"]))
        self.assertEqual(64, len(payload["source"]["acf_export_sha256"]))

    def test_unknown_fixture_field_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            content = yaml.safe_load(builder.CONTENT_PATH.read_text(encoding="utf-8"))
            export = json.loads(builder.ACF_EXPORT_PATH.read_text(encoding="utf-8"))
            content = copy.deepcopy(content)
            content["acf_values"]["not_in_acf_export"] = "bad"

            content_path = root / "fixture-content.yaml"
            export_path = root / "acf-export.json"
            content_path.write_text(yaml.safe_dump(content, allow_unicode=True, sort_keys=False), encoding="utf-8")
            export_path.write_text(json.dumps(export, ensure_ascii=False), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "unknown ACF field"):
                builder.build_payload(content_path, export_path)

    def test_media_placeholder_must_map_to_image_field(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            content = yaml.safe_load(builder.CONTENT_PATH.read_text(encoding="utf-8"))
            export = json.loads(builder.ACF_EXPORT_PATH.read_text(encoding="utf-8"))
            content = copy.deepcopy(content)
            content["media_placeholders"]["mv_lead"] = {"wp_attachment_id": None}

            content_path = root / "fixture-content.yaml"
            export_path = root / "acf-export.json"
            content_path.write_text(yaml.safe_dump(content, allow_unicode=True, sort_keys=False), encoding="utf-8")
            export_path.write_text(json.dumps(export, ensure_ascii=False), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "must map to an ACF image field"):
                builder.build_payload(content_path, export_path)

    def test_render_is_deterministic_and_sorted_by_field_name(self) -> None:
        payload = builder.build_payload()
        rendered = builder.render_payload(payload)
        reparsed = json.loads(rendered)
        names = [row["field_name"] for row in reparsed["fields"]]
        self.assertEqual(sorted(names), names)
        self.assertTrue(rendered.endswith("\n"))


if __name__ == "__main__":
    unittest.main()
