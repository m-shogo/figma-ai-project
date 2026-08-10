from __future__ import annotations

import unittest
from unittest.mock import patch

import scripts.recommend_section_next_actions as next_actions


def section(
    *,
    status: str = "PLANNED",
    boundary: str = "HIGH",
    mapping: str = "HIGH",
    allowed_paths: list[str] | None = None,
    worker_hash: str = "contract-hash",
    base_commit: str = "foundation",
    group: str = "wave-01",
    isolation_mode: str = "BRANCH_WORKTREE",
) -> dict:
    return {
        "section_id": "S01",
        "figma": {
            "boundary_confidence": boundary,
            "pc_sp_mapping_confidence": mapping,
        },
        "dependencies": {
            "section_ids": [],
        },
        "implementation": {
            "allowed_paths": allowed_paths if allowed_paths is not None else ["src/sections/S01"],
        },
        "worker": {
            "status": status,
            "contract_sha256": worker_hash,
            "base_commit": base_commit,
            "parallel_group": group,
            "isolation": {"mode": isolation_mode},
        },
    }


def profile(mode: str = "HYBRID") -> dict:
    return {
        "sections": [
            {
                "section_id": "S01",
                "recommended_translation_mode": mode,
            }
        ]
    }


def manifest(item: dict) -> dict:
    return {
        "reference_id": "REF-1",
        "shared_contract_sha256": "contract-hash",
        "foundation_commit": "foundation",
        "sections": [item],
    }


def frozen_contract() -> dict:
    return {
        "freeze": {"ready": True},
        "foundation": {"status": "VERIFIED"},
    }


class SectionNextActionTests(unittest.TestCase):
    def recommend(self, item: dict, prof: dict | None = None, contract: dict | None = None) -> dict:
        profile_sections = {
            value["section_id"]: value for value in (prof or profile())["sections"]
        }
        return next_actions.recommend_section(
            item,
            profile_sections=profile_sections,
            contract=frozen_contract() if contract is None else contract,
            manifest=manifest(item),
        )

    def test_low_boundary_deepens_discovery_first(self) -> None:
        result = self.recommend(section(boundary="LOW"))
        self.assertEqual("DEEPEN_DISCOVERY", result["next_action"])

    def test_low_pc_sp_mapping_is_separate_action(self) -> None:
        result = self.recommend(section(mapping="LOW"))
        self.assertEqual("DEEPEN_PC_SP_MAPPING", result["next_action"])

    def test_missing_profile_requires_structure_profile(self) -> None:
        result = next_actions.recommend_section(
            section(),
            profile_sections={},
            contract=frozen_contract(),
            manifest=manifest(section()),
        )
        self.assertEqual("PROFILE_STRUCTURE", result["next_action"])

    def test_unknown_translation_mode_must_be_resolved(self) -> None:
        result = self.recommend(section(), profile("UNKNOWN"))
        self.assertEqual("RESOLVE_TRANSLATION_MODE", result["next_action"])

    def test_unfrozen_contract_builds_or_verifies_foundation(self) -> None:
        result = self.recommend(
            section(),
            contract={"freeze": {"ready": False}, "foundation": {"status": "NOT_BUILT"}},
        )
        self.assertEqual("BUILD_SHARED_FOUNDATION", result["next_action"])

        result = self.recommend(
            section(),
            contract={"freeze": {"ready": False}, "foundation": {"status": "BUILT"}},
        )
        self.assertEqual("VERIFY_SHARED_FOUNDATION", result["next_action"])

    def test_ready_worker_with_matching_lineage_runs_gate(self) -> None:
        result = self.recommend(section(status="READY"))
        self.assertEqual("RUN_PRODUCTION_GATE", result["next_action"])
        self.assertEqual([], result["blockers"])

    def test_ready_worker_with_stale_hash_is_prepared_not_run(self) -> None:
        result = self.recommend(section(status="READY", worker_hash="stale"))
        self.assertEqual("PREPARE_WORKER_EXECUTION", result["next_action"])
        self.assertTrue(any("hash" in blocker for blocker in result["blockers"]))

    def test_ready_worker_without_isolation_is_not_run(self) -> None:
        result = self.recommend(section(status="READY", isolation_mode="UNASSIGNED"))
        self.assertEqual("PREPARE_WORKER_EXECUTION", result["next_action"])
        self.assertTrue(any("isolation" in blocker for blocker in result["blockers"]))

    def test_complete_section_becomes_integration_candidate(self) -> None:
        result = self.recommend(section(status="COMPLETE"))
        self.assertEqual("INTEGRATION_CANDIDATE", result["next_action"])

    def test_blocked_section_stays_explicit(self) -> None:
        result = self.recommend(section(status="BLOCKED"))
        self.assertEqual("RESOLVE_BLOCKER", result["next_action"])


if __name__ == "__main__":
    unittest.main()
