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

import validate_wordpress_theme_intake as validator  # noqa: E402

CANONICAL_RECORD = ROOT / "experiments" / "ref002-budokan-wordpress" / "theme-intake.yaml"
SCHEMA = json.loads(validator.SCHEMA_PATH.read_text(encoding="utf-8"))


def load_canonical() -> dict:
    return yaml.safe_load(CANONICAL_RECORD.read_text(encoding="utf-8"))


def check(data: dict) -> list[str]:
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / validator.RECORD_NAME
        path.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")
        return validator.validate_record(path, SCHEMA)


def observe_theme(data: dict) -> dict:
    """Move a record to the OBSERVED state without resolving downstream decisions."""
    data["status"] = "THEME_OBSERVED"
    data["theme_delivery"]["state"] = "OBSERVED"
    data["theme_delivery"]["repository"] = "git@example.invalid:client/budokan-theme.git"
    data["theme_delivery"]["starting_commit"] = "0" * 40
    return data


class CanonicalRecordTest(unittest.TestCase):
    def test_repository_record_passes(self) -> None:
        self.assertEqual(validator.validate_record(CANONICAL_RECORD, SCHEMA), [])

    def test_repository_record_is_still_awaiting_the_supplied_theme(self) -> None:
        data = load_canonical()
        self.assertEqual(data["status"], "AWAITING_THEME")
        self.assertEqual(data["theme_delivery"]["state"], "NOT_SUPPLIED")
        self.assertFalse(data["freeze"]["ready"])

    def test_canonical_record_is_discovered_without_arguments(self) -> None:
        self.assertIn(CANONICAL_RECORD.resolve(), validator.candidate_paths())


class ReferenceSectionParsingTest(unittest.TestCase):
    def test_pc_block_sections_are_extracted_from_committed_evidence(self) -> None:
        evidence = ROOT / "tools" / "implementation-intake" / "REAL_WEB_VALIDATION.md"
        slugs, errors = validator.reference_sections(evidence)
        self.assertEqual(errors, [])
        self.assertIn("header", slugs)
        self.assertIn("instagram", slugs)
        self.assertIn("footer", slugs)
        self.assertGreaterEqual(len(slugs), validator.MIN_REFERENCE_SECTIONS)

    def test_under_parsed_evidence_refuses_to_validate_coverage(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            evidence = Path(tmp) / "evidence.md"
            evidence.write_text("### PC\n\n- Header: `y=0 h=100`\n\n### SP\n", encoding="utf-8")
            slugs, errors = validator.reference_sections(evidence)
        self.assertEqual(slugs, [])
        self.assertTrue(any("under-parsed" in error for error in errors))


class FailClosedBeforeThemeTest(unittest.TestCase):
    def test_template_target_path_is_rejected_before_observation(self) -> None:
        data = load_canonical()
        data["template_coverage"][0]["target_path"] = "front-page.php"
        self.assertTrue(any("target_path must stay empty" in error for error in check(data)))

    def test_template_ownership_is_rejected_before_observation(self) -> None:
        data = load_canonical()
        data["template_coverage"][0]["ownership"] = "PROJECT"
        self.assertTrue(any("ownership must stay UNDETERMINED" in error for error in check(data)))

    def test_implementation_unit_is_rejected_before_observation(self) -> None:
        data = load_canonical()
        data["content_decisions"][0]["implementation_unit"] = "TEMPLATE_PART"
        self.assertTrue(any("implementation_unit must stay UNDETERMINED" in error for error in check(data)))

    def test_theme_slug_is_rejected_before_observation(self) -> None:
        data = load_canonical()
        data["theme_delivery"]["theme_slug"] = "budokan"
        self.assertTrue(any("theme_slug must stay empty" in error for error in check(data)))

    def test_theme_family_is_rejected_before_observation(self) -> None:
        data = load_canonical()
        data["theme_delivery"]["theme_family"] = "CLASSIC_THEME"
        self.assertTrue(any("theme_family must stay UNKNOWN" in error for error in check(data)))

    def test_form_selection_is_rejected_before_observation(self) -> None:
        data = load_canonical()
        data["forms"]["state"] = "SELECTED"
        data["forms"]["selected_plugin"] = "Contact Form 7"
        data["forms"]["evidence"] = ["assumed"]
        self.assertTrue(any("must not be SELECTED before" in error for error in check(data)))

    def test_cpt_definition_is_rejected_before_observation(self) -> None:
        data = load_canonical()
        data["cpt"]["state"] = "DEFINED"
        data["cpt"]["entries"] = [{"slug": "news", "role": "news", "evidence": ["figma"]}]
        data["cpt"]["evidence"] = ["figma"]
        self.assertTrue(any("must not be DEFINED before" in error for error in check(data)))

    def test_freeze_is_rejected_before_observation(self) -> None:
        data = load_canonical()
        data["freeze"]["ready"] = True
        self.assertTrue(any("freeze.ready must be false" in error for error in check(data)))


class StateMachineTest(unittest.TestCase):
    def test_status_and_delivery_state_must_agree(self) -> None:
        data = load_canonical()
        data["status"] = "THEME_SUPPLIED"
        self.assertTrue(any("requires theme_delivery.state" in error for error in check(data)))

    def test_not_supplied_theme_must_not_carry_a_repository(self) -> None:
        data = load_canonical()
        data["theme_delivery"]["repository"] = "git@example.invalid:client/theme.git"
        self.assertTrue(any("must stay empty while the theme is NOT_SUPPLIED" in error for error in check(data)))

    def test_observed_theme_requires_repository_and_commit(self) -> None:
        data = load_canonical()
        data["status"] = "THEME_OBSERVED"
        data["theme_delivery"]["state"] = "OBSERVED"
        errors = check(data)
        self.assertTrue(any("must record theme_delivery.repository" in error for error in errors))
        self.assertTrue(any("must record theme_delivery.starting_commit" in error for error in errors))


class EpistemicStateTest(unittest.TestCase):
    def test_none_without_evidence_is_rejected(self) -> None:
        data = load_canonical()
        data["cpt"]["state"] = "NONE"
        self.assertTrue(any("NONE requires investigation evidence" in error for error in check(data)))

    def test_none_with_evidence_is_accepted(self) -> None:
        data = load_canonical()
        data["cpt"]["state"] = "NONE"
        data["cpt"]["evidence"] = ["client confirmed core post + category is sufficient"]
        self.assertEqual([e for e in check(data) if "cpt" in e], [])

    def test_observation_none_without_evidence_is_rejected(self) -> None:
        data = load_canonical()
        data["theme_delivery"]["observation"][0]["status"] = "NONE"
        self.assertTrue(any("NONE requires evidence" in error for error in check(data)))

    def test_open_unknowns_must_stay_explicit(self) -> None:
        data = load_canonical()
        data["unknowns"] = []
        self.assertTrue(any("keep its open unknowns explicit" in error for error in check(data)))


class RegistrationBoundaryTest(unittest.TestCase):
    def test_entries_are_rejected_while_undetermined(self) -> None:
        data = observe_theme(load_canonical())
        data["cpt"]["entries"] = [{"slug": "news", "role": "news", "evidence": []}]
        self.assertTrue(any("entries must be empty while state is UNDETERMINED" in e for e in check(data)))

    def test_defined_requires_entries_and_evidence(self) -> None:
        data = observe_theme(load_canonical())
        data["cpt"]["state"] = "DEFINED"
        errors = check(data)
        self.assertTrue(any("DEFINED requires at least one entry" in error for error in errors))
        self.assertTrue(any("DEFINED requires evidence" in error for error in errors))

    def test_selected_plugin_is_rejected_while_undetermined(self) -> None:
        data = observe_theme(load_canonical())
        data["forms"]["selected_plugin"] = "Gravity Forms"
        self.assertTrue(any("selected_plugin must stay empty" in error for error in check(data)))

    def test_selected_state_requires_plugin_and_evidence(self) -> None:
        data = observe_theme(load_canonical())
        data["forms"]["state"] = "SELECTED"
        errors = check(data)
        self.assertTrue(any("SELECTED requires forms.selected_plugin" in error for error in errors))
        self.assertTrue(any("SELECTED requires evidence" in error for error in errors))


class CoverageTest(unittest.TestCase):
    def test_missing_wordpress_surface_is_rejected(self) -> None:
        data = load_canonical()
        data["template_coverage"] = [
            entry for entry in data["template_coverage"] if entry["surface"] != "NOT_FOUND"
        ]
        self.assertTrue(any("missing: NOT_FOUND" in error for error in check(data)))

    def test_cpt_surfaces_cannot_be_dropped_from_the_matrix(self) -> None:
        data = load_canonical()
        data["template_coverage"] = [
            entry for entry in data["template_coverage"] if not entry["surface"].startswith("CPT_")
        ]
        errors = check(data)
        self.assertTrue(any("CPT_ARCHIVE" in error and "CPT_SINGLE" in error for error in errors))

    def test_dropped_reference_section_is_rejected(self) -> None:
        data = load_canonical()
        data["content_decisions"] = [
            entry for entry in data["content_decisions"] if entry["section_id"] != "instagram"
        ]
        self.assertTrue(any("missing: instagram" in error for error in check(data)))

    def test_invented_section_is_rejected(self) -> None:
        data = load_canonical()
        invented = copy.deepcopy(data["content_decisions"][0])
        invented["section_id"] = "testimonials"
        invented["label"] = "Testimonials"
        data["content_decisions"].append(invented)
        self.assertTrue(any("invented: testimonials" in error for error in check(data)))

    def test_duplicate_section_is_rejected(self) -> None:
        data = load_canonical()
        data["content_decisions"].append(copy.deepcopy(data["content_decisions"][0]))
        self.assertTrue(any("duplicate section_id" in error for error in check(data)))


class EditorCapabilityTest(unittest.TestCase):
    def test_cms_ownership_without_observed_editor_capability_is_rejected(self) -> None:
        data = observe_theme(load_canonical())
        data["content_decisions"][6]["content_ownership"] = "ACF_FIELD"
        errors = check(data)
        self.assertTrue(any("without any observed editor capability" in error for error in errors))
        self.assertTrue(any("requires editor_capability.evidence" in error for error in errors))

    def test_cms_ownership_with_observed_capability_is_accepted(self) -> None:
        data = observe_theme(load_canonical())
        entry = data["content_decisions"][6]
        entry["content_ownership"] = "ACF_FIELD"
        entry["editor_capability"] = {
            "add_remove": "YES",
            "reorder": "NO",
            "evidence": ["client confirmed editors publish news entries"],
        }
        self.assertEqual([e for e in check(data) if "editor_capability" in e], [])

    def test_static_ownership_needs_no_editor_capability(self) -> None:
        data = observe_theme(load_canonical())
        data["content_decisions"][9]["content_ownership"] = "STATIC"
        self.assertEqual([e for e in check(data) if "editor_capability" in e], [])


class HygieneTest(unittest.TestCase):
    def test_ephemeral_figma_asset_url_is_rejected(self) -> None:
        url = "https://www.figma.com/api/mcp/asset/" + "0123456789abcdef0123456789abcdef"
        self.assertTrue(any("short-lived Figma MCP asset URL" in e for e in validator.hygiene_errors(url)))

    def test_committed_license_key_is_rejected(self) -> None:
        raw = "ACF_PRO_LICENSE_KEY: EXAMPLE-NOT-A-REAL-KEY"
        self.assertTrue(any("ACF_PRO_LICENSE_KEY value" in error for error in validator.hygiene_errors(raw)))

    def test_declared_secret_name_alone_is_allowed(self) -> None:
        raw = "secret_name: ACF_PRO_LICENSE_KEY\ncommitted: false\n"
        self.assertEqual(validator.hygiene_errors(raw), [])


class FreezeTest(unittest.TestCase):
    def test_freeze_requires_every_unknown_resolved(self) -> None:
        data = observe_theme(load_canonical())
        data["status"] = "FROZEN"
        data["freeze"] = {"ready": True, "frozen_at": "2026-09-01", "notes": []}
        self.assertTrue(any("requires every unknown resolved" in error for error in check(data)))

    def test_freeze_requires_resolved_decisions(self) -> None:
        data = observe_theme(load_canonical())
        data["status"] = "FROZEN"
        data["freeze"] = {"ready": True, "frozen_at": "2026-09-01", "notes": []}
        for entry in data["unknowns"]:
            entry["state"] = "RESOLVED"
        errors = check(data)
        self.assertTrue(any("ownership resolved" in error for error in errors))
        self.assertTrue(any(".reuse resolved" in error for error in errors))
        self.assertTrue(any(".implementation_unit resolved" in error for error in errors))

    def test_frozen_status_requires_freeze_ready(self) -> None:
        data = observe_theme(load_canonical())
        data["status"] = "FROZEN"
        self.assertTrue(any("status FROZEN requires freeze.ready true" in error for error in check(data)))


class SchemaTest(unittest.TestCase):
    def test_unknown_enum_value_is_rejected(self) -> None:
        data = load_canonical()
        data["content_decisions"][0]["content_ownership"] = "MAYBE"
        self.assertTrue(any("content_decisions[0].content_ownership" in error for error in check(data)))

    def test_section_id_must_be_a_slug(self) -> None:
        data = load_canonical()
        data["content_decisions"][0]["section_id"] = "Header"
        self.assertTrue(any("section_id" in error for error in check(data)))

    def test_secret_boundary_cannot_declare_a_committed_key(self) -> None:
        data = load_canonical()
        data["qa_reuse"]["acf_secret_boundary"]["committed"] = True
        self.assertTrue(any("acf_secret_boundary.committed" in error for error in check(data)))


class CliTest(unittest.TestCase):
    def test_missing_record_path_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(validator.main([str(Path(tmp) / "absent.yaml")]), 1)

    def test_canonical_record_passes_through_cli(self) -> None:
        self.assertEqual(validator.main([str(CANONICAL_RECORD)]), 0)


if __name__ == "__main__":
    unittest.main()
