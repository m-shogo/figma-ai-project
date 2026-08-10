from __future__ import annotations

import unittest

from scripts.validate_breakpoint_contract import validate_contract


def contract(*, mode: str = "GLOBAL_SPECIFIED", source: str = "COMPANY", values: list[dict] | None = None, validation_viewports: list | None = None, frozen: bool = True) -> dict:
    return {
        "freeze": {"ready": frozen},
        "breakpoints": {
            "mode": mode,
            "source": source,
            "values": values
            if values is not None
            else [
                {
                    "name": "mobile",
                    "media_query": "(max-width: 767px)",
                    "min_width_px": None,
                    "max_width_px": 767,
                }
            ],
            "validation_viewports": validation_viewports
            if validation_viewports is not None
            else [{"name": "mobile-boundary", "width": 767}],
        },
    }


class BreakpointContractTests(unittest.TestCase):
    def test_valid_specified_contract_passes(self) -> None:
        self.assertEqual([], validate_contract(contract()))

    def test_draft_contract_is_not_forced_to_have_values(self) -> None:
        self.assertEqual(
            [],
            validate_contract(
                contract(
                    mode="UNKNOWN",
                    source="UNKNOWN",
                    values=[],
                    validation_viewports=[],
                    frozen=False,
                )
            ),
        )

    def test_unknown_source_is_rejected_when_frozen(self) -> None:
        errors = validate_contract(contract(source="UNKNOWN"))
        self.assertTrue(any("non-UNKNOWN source" in error for error in errors))

    def test_empty_breakpoint_semantics_are_rejected(self) -> None:
        errors = validate_contract(
            contract(
                values=[
                    {
                        "name": "mobile",
                        "media_query": "",
                        "min_width_px": None,
                        "max_width_px": None,
                    }
                ]
            )
        )
        self.assertTrue(any("requires media_query and/or" in error for error in errors))

    def test_duplicate_names_are_rejected(self) -> None:
        value = {
            "name": "mobile",
            "media_query": "(max-width: 767px)",
            "min_width_px": None,
            "max_width_px": 767,
        }
        errors = validate_contract(contract(values=[value, dict(value)]))
        self.assertTrue(any("duplicate breakpoint name" in error for error in errors))

    def test_min_cannot_exceed_max(self) -> None:
        errors = validate_contract(
            contract(
                values=[
                    {
                        "name": "range",
                        "media_query": "",
                        "min_width_px": 1024,
                        "max_width_px": 767,
                    }
                ]
            )
        )
        self.assertTrue(any("min_width_px cannot exceed max_width_px" in error for error in errors))

    def test_boundary_validation_viewports_are_required(self) -> None:
        errors = validate_contract(contract(validation_viewports=[]))
        self.assertTrue(any("requires validation_viewports" in error for error in errors))

    def test_non_specified_modes_do_not_require_breakpoint_values(self) -> None:
        self.assertEqual(
            [],
            validate_contract(
                contract(
                    mode="INTRINSIC_ONLY",
                    source="UNKNOWN",
                    values=[],
                    validation_viewports=[],
                )
            ),
        )


if __name__ == "__main__":
    unittest.main()
