from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import yaml

from scripts.validate_section_discovery import validate_manifest


def section(
    *,
    status: str = "READY",
    boundary_confidence: str = "HIGH",
    mapping_confidence: str = "HIGH",
    boundary_evidence: list[str] | None = None,
    mapping_evidence: list[str] | None = None,
    sp_node_id: str = "sp-node",
) -> dict:
    return {
        "section_id": "S01",
        "figma": {
            "boundary_confidence": boundary_confidence,
            "boundary_evidence": boundary_evidence if boundary_evidence is not None else ["top-level semantic frame"],
            "pc_sp_mapping_confidence": mapping_confidence,
            "mapping_evidence": mapping_evidence if mapping_evidence is not None else ["same heading and asset"],
            "sp_node_id": sp_node_id,
        },
        "worker": {"status": status, "parallel_group": "wave-01"},
    }


def manifest(item: dict) -> dict:
    return {"sections": [item]}


class SectionDiscoveryValidationTests(unittest.TestCase):
    def validate(self, data: dict) -> list[str]:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "section-manifest.yaml"
            path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
            return validate_manifest(path)

    def test_medium_or_high_confidence_can_enter_ready_with_evidence(self) -> None:
        self.assertEqual([], self.validate(manifest(section())))
        self.assertEqual(
            [],
            self.validate(
                manifest(
                    section(
                        boundary_confidence="MEDIUM",
                        mapping_confidence="MEDIUM",
                    )
                )
            ),
        )

    def test_low_boundary_confidence_cannot_enter_ready(self) -> None:
        errors = self.validate(
            manifest(section(boundary_confidence="LOW", boundary_evidence=[]))
        )
        self.assertTrue(any("LOW boundary confidence cannot enter READY" in error for error in errors))

    def test_low_mapping_confidence_cannot_enter_running(self) -> None:
        errors = self.validate(
            manifest(
                section(
                    status="RUNNING",
                    mapping_confidence="LOW",
                    mapping_evidence=[],
                )
            )
        )
        self.assertTrue(any("LOW PC/SP mapping confidence cannot enter RUNNING" in error for error in errors))

    def test_planned_low_confidence_is_allowed_for_more_research(self) -> None:
        errors = self.validate(
            manifest(
                section(
                    status="PLANNED",
                    boundary_confidence="LOW",
                    mapping_confidence="LOW",
                    boundary_evidence=[],
                    mapping_evidence=[],
                )
            )
        )
        self.assertEqual([], errors)

    def test_claimed_high_boundary_confidence_requires_evidence(self) -> None:
        errors = self.validate(manifest(section(boundary_evidence=[])))
        self.assertTrue(any("boundary confidence requires non-empty boundary_evidence" in error for error in errors))

    def test_claimed_mapping_confidence_requires_evidence_and_sp_node(self) -> None:
        errors = self.validate(
            manifest(section(mapping_evidence=[], sp_node_id=""))
        )
        self.assertTrue(any("mapping confidence requires non-empty mapping_evidence" in error for error in errors))
        self.assertTrue(any("mapping requires sp_node_id" in error for error in errors))

    def test_not_applicable_mapping_requires_no_sp_node(self) -> None:
        errors = self.validate(
            manifest(
                section(
                    mapping_confidence="NOT_APPLICABLE",
                    mapping_evidence=[],
                    sp_node_id="sp-node",
                )
            )
        )
        self.assertTrue(any("NOT_APPLICABLE but sp_node_id is present" in error for error in errors))

    def test_completed_historical_low_confidence_is_retained(self) -> None:
        errors = self.validate(
            manifest(
                section(
                    status="COMPLETE",
                    boundary_confidence="LOW",
                    mapping_confidence="LOW",
                    boundary_evidence=[],
                    mapping_evidence=[],
                )
            )
        )
        self.assertEqual([], errors)


if __name__ == "__main__":
    unittest.main()
