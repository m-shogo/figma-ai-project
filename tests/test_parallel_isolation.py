from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import yaml

from scripts.validate_parallel_isolation import validate_manifest


def worker_section(
    section_id: str,
    *,
    group: str = "wave-01",
    contract_hash: str = "contract-hash",
    mode: str = "BRANCH_WORKTREE",
    ref: str | None = None,
    parallel_safe: bool = True,
    notes: list[str] | None = None,
    status: str = "READY",
) -> dict:
    return {
        "section_id": section_id,
        "worker": {
            "status": status,
            "parallel_group": group,
            "contract_sha256": contract_hash,
            "isolation": {
                "mode": mode,
                "ref": ref if ref is not None else f"isolation-{section_id}",
                "parallel_safe": parallel_safe,
                "notes": notes or [],
            },
            "agent": "test-agent",
            "model": "test-model",
            "base_commit": "foundation",
            "output_commit": "",
            "proposed_shared_changes": [],
        },
    }


def manifest(sections: list[dict], *, contract_hash: str = "contract-hash") -> dict:
    return {
        "schema_version": 6,
        "reference_id": "REF-TEST",
        "page_id": "PAGE-TEST",
        "shared_contract": "contracts/test/shared-contract.yaml",
        "shared_contract_sha256": contract_hash,
        "foundation_commit": "foundation",
        "sections": sections,
        "integration": {"root_composition_path": "", "required_checks": []},
    }


class ParallelIsolationTests(unittest.TestCase):
    def validate(self, data: dict) -> list[str]:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory).resolve() / "section-manifest.yaml"
            path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            return validate_manifest(path)

    def test_distinct_worktrees_are_parallel_safe(self) -> None:
        errors = self.validate(
            manifest(
                [
                    worker_section("S01", ref="worktree-s01"),
                    worker_section("S02", ref="worktree-s02"),
                ]
            )
        )
        self.assertEqual([], errors)

    def test_worker_contract_hash_must_match_manifest(self) -> None:
        errors = self.validate(
            manifest([worker_section("S01", contract_hash="stale-hash")])
        )
        self.assertTrue(any("contract hash is stale" in error for error in errors))

    def test_duplicate_isolation_ref_is_rejected(self) -> None:
        errors = self.validate(
            manifest(
                [
                    worker_section("S01", ref="same-worktree"),
                    worker_section("S02", ref="same-worktree"),
                ]
            )
        )
        self.assertTrue(any("share isolation.ref" in error for error in errors))

    def test_serial_shared_tree_cannot_be_used_concurrently(self) -> None:
        errors = self.validate(
            manifest(
                [
                    worker_section(
                        "S01",
                        mode="SERIAL_SHARED_TREE",
                        ref="shared-tree",
                        parallel_safe=False,
                    ),
                    worker_section("S02", ref="worktree-s02"),
                ]
            )
        )
        self.assertTrue(any("SERIAL_SHARED_TREE" in error for error in errors))

    def test_known_parallel_mode_requires_explicit_safety_flag(self) -> None:
        errors = self.validate(
            manifest(
                [
                    worker_section("S01", ref="worktree-s01", parallel_safe=False),
                    worker_section("S02", ref="worktree-s02"),
                ]
            )
        )
        self.assertTrue(any("parallel_safe=true" in error for error in errors))

    def test_other_isolation_is_not_safe_by_name_alone(self) -> None:
        errors = self.validate(
            manifest(
                [
                    worker_section(
                        "S01",
                        mode="OTHER",
                        ref="future-tool-s01",
                        parallel_safe=False,
                        notes=["Future tool under evaluation"],
                    ),
                    worker_section("S02", ref="worktree-s02"),
                ]
            )
        )
        self.assertTrue(any("OTHER isolation without explicit parallel_safe=true" in error for error in errors))

    def test_other_isolation_requires_safety_notes(self) -> None:
        errors = self.validate(
            manifest(
                [
                    worker_section(
                        "S01",
                        mode="OTHER",
                        ref="future-tool-s01",
                        parallel_safe=True,
                        notes=[],
                    ),
                    worker_section("S02", ref="worktree-s02"),
                ]
            )
        )
        self.assertTrue(any("safety notes" in error or "requires notes" in error for error in errors))

    def test_future_isolation_can_be_adopted_with_explicit_evidence(self) -> None:
        errors = self.validate(
            manifest(
                [
                    worker_section(
                        "S01",
                        mode="OTHER",
                        ref="future-tool-s01",
                        parallel_safe=True,
                        notes=[
                            "Provides isolated filesystem and Git ref per worker; verified in current tool version."
                        ],
                    ),
                    worker_section("S02", ref="worktree-s02"),
                ]
            )
        )
        self.assertEqual([], errors)


if __name__ == "__main__":
    unittest.main()
