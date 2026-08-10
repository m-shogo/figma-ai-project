from __future__ import annotations

import unittest

from scripts.suggest_translation_mode import suggest


def sig(value: str) -> dict:
    return {"confidence": value, "evidence": []}


def section(
    *,
    components: str = "LOW",
    variables: str = "LOW",
    auto_layout: str = "LOW",
    naming: str = "LOW",
    code_connect: str = "NONE",
    assets: str = "LOW",
    responsive: str = "LOW",
    reuse: list[str] | None = None,
    weak: list[str] | None = None,
) -> dict:
    return {
        "section_id": "S01",
        "signals": {
            "components": sig(components),
            "variables": sig(variables),
            "auto_layout": sig(auto_layout),
            "semantic_naming": sig(naming),
            "code_connect": sig(code_connect),
            "assets": sig(assets),
            "responsive_mapping": sig(responsive),
        },
        "codebase_reuse_priority": reuse or [],
        "untrusted_or_missing_structure": weak or [],
    }


class TranslationModeSuggestionTests(unittest.TestCase):
    def test_structure_first_for_strong_layout_and_components(self) -> None:
        result = suggest(
            section(
                components="HIGH",
                variables="MEDIUM",
                auto_layout="HIGH",
                naming="MEDIUM",
                responsive="MEDIUM",
            )
        )
        self.assertEqual("STRUCTURE_FIRST", result["suggested_mode"])

    def test_codebase_first_for_explicit_reuse_with_weak_figma_component_mapping(self) -> None:
        result = suggest(
            section(
                components="LOW",
                auto_layout="MEDIUM",
                reuse=["ProductionHeader"],
            )
        )
        self.assertEqual("CODEBASE_FIRST", result["suggested_mode"])

    def test_visual_first_requires_broadly_weak_structure_and_recorded_weakness(self) -> None:
        result = suggest(
            section(
                components="LOW",
                variables="NONE",
                auto_layout="LOW",
                naming="NONE",
                assets="MEDIUM",
                weak=["flat imported frames", "generic names"],
            )
        )
        self.assertEqual("VISUAL_FIRST", result["suggested_mode"])

    def test_hybrid_for_mixed_evidence(self) -> None:
        result = suggest(
            section(
                components="LOW",
                variables="LOW",
                auto_layout="MEDIUM",
                naming="LOW",
                assets="MEDIUM",
                responsive="MEDIUM",
            )
        )
        self.assertEqual("HYBRID", result["suggested_mode"])

    def test_unknown_when_evidence_is_insufficient(self) -> None:
        result = suggest(section())
        self.assertEqual("UNKNOWN", result["suggested_mode"])
        self.assertTrue(result["cautions"])

    def test_suggestion_is_always_advisory(self) -> None:
        result = suggest(section(auto_layout="MEDIUM", assets="MEDIUM"))
        self.assertTrue(result["advisory_only"])


if __name__ == "__main__":
    unittest.main()
