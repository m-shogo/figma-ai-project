from __future__ import annotations

import unittest

from scripts.validate_breakpoint_viewports import validate_contract


def contract(*, viewports: list | None = None, values: list | None = None) -> dict:
    return {
        "freeze": {"ready": True},
        "breakpoints": {
            "mode": "GLOBAL_SPECIFIED",
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
            "validation_viewports": viewports
            if viewports is not None
            else [
                {
                    "name": "mobile-boundary",
                    "breakpoint": "mobile",
                    "width_px": 767,
                    "relation": "AT",
                }
            ],
        },
    }


class BreakpointViewportTests(unittest.TestCase):
    def test_valid_mapping_passes(self) -> None:
        self.assertEqual([], validate_contract(contract()))

    def test_unknown_breakpoint_reference_is_rejected(self) -> None:
        errors = validate_contract(
            contract(
                viewports=[
                    {
                        "name": "wrong",
                        "breakpoint": "tablet",
                        "width_px": 767,
                        "relation": "AT",
                    }
                ]
            )
        )
        self.assertTrue(any("unknown breakpoint" in error for error in errors))

    def test_each_breakpoint_requires_a_viewport(self) -> None:
        errors = validate_contract(
            contract(
                values=[
                    {"name": "mobile", "media_query": "(max-width: 767px)"},
                    {"name": "tablet", "media_query": "(max-width: 1023px)"},
                ],
                viewports=[
                    {
                        "name": "mobile-boundary",
                        "breakpoint": "mobile",
                        "width_px": 767,
                        "relation": "AT",
                    }
                ],
            )
        )
        self.assertTrue(any("'tablet' has no mapped validation viewport" in error for error in errors))

    def test_duplicate_viewport_names_are_rejected(self) -> None:
        viewport = {
            "name": "boundary",
            "breakpoint": "mobile",
            "width_px": 767,
            "relation": "AT",
        }
        errors = validate_contract(contract(viewports=[viewport, dict(viewport)]))
        self.assertTrue(any("duplicate validation viewport name" in error for error in errors))

    def test_width_must_be_nonnegative_integer(self) -> None:
        errors = validate_contract(
            contract(
                viewports=[
                    {
                        "name": "mobile-boundary",
                        "breakpoint": "mobile",
                        "width_px": -1,
                        "relation": "AT",
                    }
                ]
            )
        )
        self.assertTrue(any("cannot be negative" in error for error in errors))

    def test_relation_must_be_known(self) -> None:
        errors = validate_contract(
            contract(
                viewports=[
                    {
                        "name": "mobile-boundary",
                        "breakpoint": "mobile",
                        "width_px": 767,
                        "relation": "NEAR",
                    }
                ]
            )
        )
        self.assertTrue(any("relation must be one of" in error for error in errors))

    def test_draft_contract_is_not_forced(self) -> None:
        data = contract(viewports=[])
        data["freeze"]["ready"] = False
        self.assertEqual([], validate_contract(data))


if __name__ == "__main__":
    unittest.main()
