from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = json.loads((ROOT / "schemas" / "section.schema.json").read_text(encoding="utf-8"))


class ObservationCoverageSchemaTests(unittest.TestCase):
    def manifest(self, version: int = 9) -> dict:
        return {
            "schema_version": version,
            "reference_id": "REF-TEST",
            "page_id": "page",
            "shared_contract": "",
            "shared_contract_sha256": "",
            "figma_structure_profile": "",
            "figma_structure_profile_sha256": "",
            "foundation_commit": "foundation",
            "sections": [
                {
                    "section_id": "S01",
                    "name": "Hero",
                    "order": 10,
                    "figma": {
                        "logical_role": "HERO",
                        "pc_node_id": "1:1",
                        "sp_node_id": "1:2",
                        "other_node_ids": [],
                        "semantic_name_source": "FIGMA",
                        "boundary_source": "FIGMA_TOP_LEVEL",
                        "boundary_confidence": "HIGH",
                        "boundary_evidence": [],
                        "pc_sp_mapping_confidence": "HIGH",
                        "mapping_evidence": [],
                    },
                    "evidence": {"screenshots": [], "metadata_capture": "meta"},
                    "dependencies": {
                        "section_ids": [],
                        "shared_components": [],
                        "tokens": [],
                        "fonts": [],
                        "assets": [],
                        "integration_coupling": "LOW",
                        "coupling_notes": [],
                    },
                    "responsive": {
                        "uses_shared_breakpoints": True,
                        "invariants": [],
                        "transitions": [],
                        "unknowns": [],
                        "breakpoint_exception_proposals": [],
                    },
                    "observation_coverage": {
                        "source_presence": {
                            "TEXT": "PRESENT",
                            "RASTER_MEDIA": "PRESENT",
                            "VECTOR_LOGO": "NONE",
                            "BACKGROUND": "PRESENT",
                            "DECORATION": "NONE",
                            "INTERACTION_STATE": "UNDETERMINED",
                            "RESPONSIVE_VARIANT": "PRESENT",
                        },
                        "source_evidence": ["Figma nodes 1:1 / 1:2"],
                        "runtime_review": {
                            "sp": {"status": "PASS", "evidence": ["sp-section.png"]},
                            "pc": {"status": "PASS", "evidence": ["pc-section.png"]},
                        },
                        "known_gaps": [],
                    },
                    "implementation": {
                        "component_path": "hero.php",
                        "style_path": "hero.css",
                        "allowed_paths": ["hero.php", "hero.css"],
                        "shared_files_read_only": True,
                    },
                    "worker": {
                        "status": "COMPLETE",
                        "parallel_group": "",
                        "contract_sha256": "hash",
                        "isolation": {
                            "mode": "SERIAL_SHARED_TREE",
                            "ref": "branch",
                            "parallel_safe": False,
                            "notes": [],
                        },
                        "agent": "test",
                        "model": "test",
                        "base_commit": "foundation",
                        "output_commit": "output",
                        "proposed_shared_changes": [],
                    },
                }
            ],
            "integration": {
                "status": "COMPLETE",
                "root_composition_path": "page.php",
                "required_checks": [],
                "observation_coverage": {
                    "sp_full_page": "PASS",
                    "pc_full_page": "PASS",
                    "evidence": ["sp-full.png", "pc-full.png"],
                    "known_gaps": [],
                },
            },
        }

    def errors(self, value: dict) -> list:
        return list(Draft202012Validator(SCHEMA).iter_errors(value))

    def test_v9_complete_manifest_accepts_resolved_observation_coverage(self) -> None:
        self.assertEqual([], self.errors(self.manifest()))

    def test_v9_requires_section_observation_coverage(self) -> None:
        value = self.manifest()
        del value["sections"][0]["observation_coverage"]
        self.assertTrue(self.errors(value))

    def test_complete_section_requires_sp_review_when_sp_reference_exists(self) -> None:
        value = self.manifest()
        value["sections"][0]["observation_coverage"]["runtime_review"]["sp"] = {
            "status": "PENDING",
            "evidence": [],
        }
        self.assertTrue(self.errors(value))

    def test_complete_section_rejects_known_gap(self) -> None:
        value = self.manifest()
        value["sections"][0]["observation_coverage"]["known_gaps"] = [
            {"category": "RASTER_MEDIA", "reason": "Hero photo not materialized"}
        ]
        self.assertTrue(self.errors(value))

    def test_complete_integration_requires_full_page_coverage(self) -> None:
        value = self.manifest()
        value["integration"]["observation_coverage"]["sp_full_page"] = "PENDING"
        self.assertTrue(self.errors(value))

    def test_v8_historical_manifest_is_grandfathered(self) -> None:
        value = self.manifest(version=8)
        del value["sections"][0]["observation_coverage"]
        del value["integration"]["status"]
        del value["integration"]["observation_coverage"]
        self.assertEqual([], self.errors(value))


if __name__ == "__main__":
    unittest.main()
