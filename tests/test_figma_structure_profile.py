from __future__ import annotations

import unittest

from scripts.validate_figma_structure_profiles import semantic_errors


def signal(
    state: str = "OBSERVED",
    confidence: str = "MEDIUM",
    evidence: list[str] | None = None,
    **extra,
) -> dict:
    value = {
        "state": state,
        "confidence": confidence,
        "evidence": evidence if evidence is not None else ["inspected exact section node"],
    }
    value.update(extra)
    return value


def profile_section(
    *,
    section_id: str = "S01",
    mode: str = "HYBRID",
    reasoning: list[str] | None = None,
    trusted: list[str] | None = None,
    untrusted: list[str] | None = None,
    codebase_reuse: list[str] | None = None,
) -> dict:
    return {
        "section_id": section_id,
        "figma_node_ids": ["1:2"],
        "signals": {
            "components": signal(
                confidence="MEDIUM",
                evidence=["component instances observed"],
                instance_count=2,
                detached_or_repeated_patterns=[],
            ),
            "variables": signal(
                state="UNDETERMINED",
                confidence="LOW",
                evidence=["bindings inspected; complete alias coverage unavailable"],
                bound_property_coverage=None,
                modes_observed=[],
            ),
            "auto_layout": signal(
                confidence="HIGH",
                evidence=["nested auto layout"],
                container_coverage=0.9,
                absolute_child_ratio=0.1,
                generation="UPDATED_2026",
            ),
            "semantic_naming": signal(
                confidence="LOW",
                evidence=["mixed semantic and generic names"],
                generic_name_ratio=0.4,
            ),
            "code_connect": signal(
                state="NONE",
                confidence="HIGH",
                evidence=["inspected section components; no mapping found"],
                mapped_component_coverage=0.0,
            ),
            "assets": signal(
                confidence="MEDIUM",
                evidence=["exact image fill available"],
                exact_sources_available=["hero"],
            ),
            "responsive_mapping": signal(
                confidence="MEDIUM",
                evidence=["same copy and asset across PC/SP"],
            ),
        },
        "recommended_translation_mode": mode,
        "mode_reasoning_evidence": reasoning if reasoning is not None else ["mixed structured and visual evidence"],
        "trusted_structure": trusted if trusted is not None else ["Auto Layout geometry"],
        "untrusted_or_missing_structure": untrusted if untrusted is not None else ["variable alias coverage"],
        "codebase_reuse_priority": codebase_reuse if codebase_reuse is not None else [],
        "unresolved_questions": [],
    }


def profile(sections: list[dict]) -> dict:
    return {"sections": sections}


class FigmaStructureProfileTests(unittest.TestCase):
    def test_valid_hybrid_profile_passes(self) -> None:
        self.assertEqual([], semantic_errors(profile([profile_section()])))

    def test_duplicate_section_ids_are_rejected(self) -> None:
        errors = semantic_errors(profile([profile_section(), profile_section()]))
        self.assertTrue(any("section_id values must be unique" in error for error in errors))

    def test_observed_or_undetermined_requires_evidence(self) -> None:
        item = profile_section()
        item["signals"]["components"]["evidence"] = []
        errors = semantic_errors(profile([item]))
        self.assertTrue(any("components state OBSERVED requires" in error for error in errors))

    def test_none_requires_inspection_evidence(self) -> None:
        item = profile_section()
        item["signals"]["code_connect"]["evidence"] = []
        errors = semantic_errors(profile([item]))
        self.assertTrue(any("code_connect state NONE requires" in error for error in errors))

    def test_undetermined_is_allowed_with_evidence(self) -> None:
        self.assertEqual([], semantic_errors(profile([profile_section()])))

    def test_unknown_mode_is_allowed_during_incomplete_profiling(self) -> None:
        item = profile_section(mode="UNKNOWN", reasoning=[], trusted=[], untrusted=[])
        self.assertEqual([], semantic_errors(profile([item])))

    def test_structure_first_requires_trusted_structure(self) -> None:
        errors = semantic_errors(
            profile([profile_section(mode="STRUCTURE_FIRST", trusted=[])])
        )
        self.assertTrue(any("STRUCTURE_FIRST requires trusted_structure" in error for error in errors))

    def test_structure_first_requires_observed_auto_layout(self) -> None:
        item = profile_section(mode="STRUCTURE_FIRST")
        item["signals"]["auto_layout"]["state"] = "UNDETERMINED"
        item["signals"]["auto_layout"]["generation"] = "UNDETERMINED"
        errors = semantic_errors(profile([item]))
        self.assertTrue(any("STRUCTURE_FIRST requires observed Auto Layout" in error for error in errors))

    def test_visual_first_requires_missing_or_untrusted_structure(self) -> None:
        errors = semantic_errors(
            profile([profile_section(mode="VISUAL_FIRST", untrusted=[])])
        )
        self.assertTrue(any("VISUAL_FIRST requires untrusted_or_missing_structure" in error for error in errors))

    def test_codebase_first_requires_reuse_priority(self) -> None:
        errors = semantic_errors(
            profile([profile_section(mode="CODEBASE_FIRST", codebase_reuse=[])])
        )
        self.assertTrue(any("CODEBASE_FIRST requires codebase_reuse_priority" in error for error in errors))

    def test_non_unknown_mode_requires_reasoning(self) -> None:
        errors = semantic_errors(profile([profile_section(reasoning=[])]))
        self.assertTrue(any("requires mode_reasoning_evidence" in error for error in errors))

    def test_code_connect_none_cannot_claim_positive_coverage(self) -> None:
        item = profile_section()
        item["signals"]["code_connect"]["mapped_component_coverage"] = 0.5
        errors = semantic_errors(profile([item]))
        self.assertTrue(any("code_connect state NONE conflicts" in error for error in errors))

    def test_auto_layout_none_requires_generation_none(self) -> None:
        item = profile_section()
        auto = item["signals"]["auto_layout"]
        auto["state"] = "NONE"
        auto["confidence"] = "HIGH"
        auto["evidence"] = ["inspected section containers; no Auto Layout observed"]
        auto["container_coverage"] = 0.0
        auto["generation"] = "UPDATED_2026"
        errors = semantic_errors(profile([item]))
        self.assertTrue(any("auto_layout state NONE requires generation NONE" in error for error in errors))

    def test_figma_node_ids_are_required_semantically(self) -> None:
        item = profile_section()
        item["figma_node_ids"] = []
        errors = semantic_errors(profile([item]))
        self.assertTrue(any("figma_node_ids must not be empty" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
