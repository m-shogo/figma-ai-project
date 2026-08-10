from __future__ import annotations

import unittest

from scripts.validate_structure_execution import validate_pair


def manifest(*, status: str = "READY", section_id: str = "S01") -> dict:
    return {
        "reference_id": "REF-1",
        "sections": [
            {
                "section_id": section_id,
                "figma": {
                    "pc_node_id": "pc-1",
                    "sp_node_id": "sp-1",
                    "other_node_ids": [],
                },
                "worker": {"status": status},
            }
        ],
    }


def signal(confidence: str) -> dict:
    return {"confidence": confidence, "evidence": ["evidence"] if confidence != "NONE" else []}


def profile(
    *,
    mode: str = "HYBRID",
    reference_id: str = "REF-1",
    section_id: str = "S01",
    nodes: list[str] | None = None,
) -> dict:
    return {
        "reference_id": reference_id,
        "sections": [
            {
                "section_id": section_id,
                "figma_node_ids": nodes if nodes is not None else ["pc-1", "sp-1"],
                "signals": {
                    "components": signal("MEDIUM"),
                    "variables": signal("LOW"),
                    "auto_layout": signal("HIGH"),
                    "semantic_naming": signal("LOW"),
                    "code_connect": signal("NONE"),
                    "assets": signal("MEDIUM"),
                    "responsive_mapping": signal("MEDIUM"),
                },
                "recommended_translation_mode": mode,
                "mode_reasoning_evidence": ["reason"],
                "trusted_structure": ["auto layout"],
                "untrusted_or_missing_structure": ["raw color"],
                "codebase_reuse_priority": ["Button"] if mode == "CODEBASE_FIRST" else [],
                "unresolved_questions": [],
            }
        ],
    }


class StructureExecutionTests(unittest.TestCase):
    def test_ready_section_with_resolved_hybrid_profile_passes(self) -> None:
        self.assertEqual([], validate_pair(manifest(), profile()))

    def test_planned_section_does_not_require_execution_profile(self) -> None:
        self.assertEqual(
            [],
            validate_pair(manifest(status="PLANNED"), {"reference_id": "REF-1", "sections": []}),
        )

    def test_reference_id_must_match(self) -> None:
        errors = validate_pair(manifest(), profile(reference_id="REF-2"))
        self.assertTrue(any("reference_id mismatch" in error for error in errors))

    def test_ready_section_requires_profile_entry(self) -> None:
        errors = validate_pair(manifest(), {"reference_id": "REF-1", "sections": []})
        self.assertTrue(any("requires a structure profile entry" in error for error in errors))

    def test_unknown_translation_mode_cannot_execute(self) -> None:
        errors = validate_pair(manifest(), profile(mode="UNKNOWN"))
        self.assertTrue(any("translation mode must be resolved" in error for error in errors))

    def test_profile_must_cover_actual_section_node(self) -> None:
        errors = validate_pair(manifest(), profile(nodes=["different-node"]))
        self.assertTrue(any("does not reference any Figma node" in error for error in errors))

    def test_structure_first_requires_multiple_strong_structure_signals(self) -> None:
        item = profile(mode="STRUCTURE_FIRST")
        signals = item["sections"][0]["signals"]
        signals["components"] = signal("LOW")
        signals["variables"] = signal("LOW")
        signals["semantic_naming"] = signal("LOW")
        errors = validate_pair(manifest(), item)
        self.assertTrue(any("STRUCTURE_FIRST needs at least two" in error for error in errors))

    def test_codebase_first_requires_reuse_priority(self) -> None:
        item = profile(mode="CODEBASE_FIRST")
        item["sections"][0]["codebase_reuse_priority"] = []
        errors = validate_pair(manifest(), item)
        self.assertTrue(any("CODEBASE_FIRST requires explicit codebase_reuse_priority" in error for error in errors))

    def test_visual_first_requires_weak_structure_evidence(self) -> None:
        item = profile(mode="VISUAL_FIRST")
        item["sections"][0]["untrusted_or_missing_structure"] = []
        errors = validate_pair(manifest(), item)
        self.assertTrue(any("VISUAL_FIRST requires explicit weak/missing" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
