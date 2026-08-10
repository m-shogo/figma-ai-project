from __future__ import annotations

import copy
import sys
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from validate_parallel_isolation import validate_manifest as validate_isolation  # noqa: E402
from validate_parallel_paths import validate_manifest as validate_paths  # noqa: E402
from validate_section_discovery import validate_manifest as validate_discovery  # noqa: E402


def section(section_id: str, path: str, ref: str) -> dict:
    return {
        "section_id": section_id,
        "name": section_id,
        "order": 10,
        "figma": {
            "logical_role": "content",
            "pc_node_id": f"pc-{section_id}",
            "sp_node_id": f"sp-{section_id}",
            "other_node_ids": [],
            "semantic_name_source": "FIGMA",
            "boundary_source": "FIGMA_TOP_LEVEL",
            "boundary_confidence": "HIGH",
            "boundary_evidence": ["top-level semantic frame"],
            "pc_sp_mapping_confidence": "HIGH",
            "mapping_evidence": ["same heading and asset"],
        },
        "evidence": {"screenshots": [], "metadata_capture": ""},
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
        "implementation": {
            "component_path": path,
            "style_path": f"{path}/style.css",
            "allowed_paths": [path],
            "shared_files_read_only": True,
        },
        "worker": {
            "status": "READY",
            "parallel_group": "wave-01",
            "contract_sha256": "contract-hash",
            "isolation": {
                "mode": "BRANCH_WORKTREE",
                "ref": ref,
                "parallel_safe": True,
                "notes": [],
            },
            "agent": "test",
            "model": "test",
            "base_commit": "foundation",
            "output_commit": "",
            "proposed_shared_changes": [],
        },
    }


def base_manifest() -> dict:
    return {
        "schema_version": 7,
        "reference_id": "REF-1",
        "page_id": "PAGE-1",
        "shared_contract": "",
        "shared_contract_sha256": "contract-hash",
        "foundation_commit": "foundation",
        "sections": [
            section("S01", "src/sections/Header", "section/S01"),
            section("S02", "src/sections/Hero", "section/S02"),
        ],
        "integration": {"root_composition_path": "", "required_checks": []},
    }


def validate_with(fn, data: dict) -> list[str]:
    with tempfile.NamedTemporaryFile("w", suffix=".yaml", encoding="utf-8", delete=False) as handle:
        yaml.safe_dump(data, handle, sort_keys=False, allow_unicode=True)
        path = Path(handle.name)
    try:
        return fn(path)
    finally:
        path.unlink(missing_ok=True)


class ParallelValidatorTests(unittest.TestCase):
    def test_valid_parallel_manifest_passes_specialized_validators(self) -> None:
        data = base_manifest()
        self.assertEqual(validate_with(validate_paths, data), [])
        self.assertEqual(validate_with(validate_isolation, data), [])
        self.assertEqual(validate_with(validate_discovery, data), [])

    def test_write_scope_overlap_is_rejected(self) -> None:
        data = base_manifest()
        data["sections"][0]["implementation"]["allowed_paths"] = ["src/sections"]
        errors = validate_with(validate_paths, data)
        self.assertTrue(any("write scope overlap" in error for error in errors), errors)

    def test_dependency_cycle_is_rejected(self) -> None:
        data = base_manifest()
        data["sections"][0]["dependencies"]["section_ids"] = ["S02"]
        data["sections"][1]["dependencies"]["section_ids"] = ["S01"]
        errors = validate_with(validate_paths, data)
        self.assertTrue(any("dependency cycle" in error for error in errors), errors)

    def test_stale_worker_contract_hash_is_rejected(self) -> None:
        data = base_manifest()
        data["sections"][1]["worker"]["contract_sha256"] = "old-hash"
        errors = validate_with(validate_isolation, data)
        self.assertTrue(any("contract hash is stale" in error for error in errors), errors)

    def test_shared_isolation_ref_is_rejected(self) -> None:
        data = base_manifest()
        data["sections"][1]["worker"]["isolation"]["ref"] = "section/S01"
        errors = validate_with(validate_isolation, data)
        self.assertTrue(any("share isolation.ref" in error for error in errors), errors)

    def test_low_boundary_confidence_cannot_run_concurrently(self) -> None:
        data = base_manifest()
        data["sections"][0]["figma"]["boundary_confidence"] = "LOW"
        errors = validate_with(validate_discovery, data)
        self.assertTrue(any("LOW boundary confidence" in error for error in errors), errors)

    def test_high_confidence_requires_evidence(self) -> None:
        data = base_manifest()
        data["sections"][0]["figma"]["boundary_evidence"] = []
        errors = validate_with(validate_discovery, data)
        self.assertTrue(any("requires non-empty boundary_evidence" in error for error in errors), errors)

    def test_other_isolation_requires_explicit_safety_notes(self) -> None:
        data = base_manifest()
        isolation = data["sections"][0]["worker"]["isolation"]
        isolation["mode"] = "OTHER"
        isolation["parallel_safe"] = True
        isolation["notes"] = []
        errors = validate_with(validate_isolation, data)
        self.assertTrue(any("requires safety notes" in error or "requires notes" in error for error in errors), errors)


if __name__ == "__main__":
    unittest.main()
