from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml

import scripts.validate_execution_output_contract as output_contract
from scripts.validate_execution_output_contract import (
    extract_media_query_thresholds,
    validate_css_text,
    validate_output_plan,
    validate_run_output_contract,
)


def contract(*, override: str = "PROPOSE_ONLY") -> dict:
    return {
        "breakpoints": {
            "mode": "GLOBAL_SPECIFIED",
            "source": "OWNER",
            "worker_override": override,
            "values": [
                {
                    "name": "mobile",
                    "media_query": "(max-width: 767px)",
                    "min_width_px": None,
                    "max_width_px": 767,
                },
                {
                    "name": "desktop",
                    "media_query": "(min-width: 768px)",
                    "min_width_px": 768,
                    "max_width_px": None,
                },
            ],
        }
    }


def wordpress_profile() -> dict:
    return {
        "effective": {"family": "WORDPRESS", "rendering_mode": "SERVER_RENDERED_PHP"},
        "platform": {"wordpress": {"acf": {"enabled": True}}},
        "delivery_requirements": {
            "acf": {
                "required": True,
                "export_json": {"required": True, "target_repo_path": "acf-export.json"},
                "import_or_sync_smoke_required": True,
            }
        },
    }


def manifest(component_path: str) -> dict:
    return {
        "sections": [
            {
                "section_id": "S01",
                "implementation": {
                    "component_path": component_path,
                    "style_path": "sections/hero.css",
                    "allowed_paths": [component_path, "sections/hero.css"],
                },
                "worker": {"status": "READY"},
                "responsive": {"breakpoint_exception_proposals": []},
            }
        ]
    }


class ExecutionOutputContractTests(unittest.TestCase):
    def test_wordpress_server_rendered_php_rejects_static_only_output(self) -> None:
        errors = validate_output_plan(manifest("sections/hero.html"), wordpress_profile())
        self.assertTrue(any("requires PHP template ownership" in error for error in errors))

    def test_wordpress_server_rendered_php_accepts_php_owner(self) -> None:
        self.assertEqual([], validate_output_plan(manifest("sections/hero.php"), wordpress_profile()))

    def test_unowned_1100_media_threshold_fails(self) -> None:
        errors = validate_css_text("@media (min-width: 1100px) { .x { display:block } }", contract())
        self.assertTrue(any("unowned viewport threshold 1100px" in error for error in errors))

    def test_owned_767_and_768_thresholds_pass(self) -> None:
        css = "@media (max-width: 767px){.a{display:block}} @media (min-width: 768px){.b{display:block}}"
        self.assertEqual([], validate_css_text(css, contract()))

    def test_intrinsic_responsiveness_does_not_create_breakpoints(self) -> None:
        css = ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr));gap:clamp(1rem,2vw,2rem)}"
        self.assertEqual([], validate_css_text(css, contract()))

    def test_owner_approved_exception_can_allow_threshold(self) -> None:
        section = {
            "responsive": {
                "breakpoint_exception_proposals": [
                    {
                        "status": "APPROVED",
                        "source": "OWNER",
                        "threshold_px": 1100,
                        "evidence": ["owner-approved"],
                    }
                ]
            }
        }
        errors = validate_css_text(
            "@media (min-width: 1100px){.x{display:block}}",
            contract(override="OWNER_ALLOWED"),
            section=section,
        )
        self.assertEqual([], errors)

    def test_owner_exception_without_evidence_is_rejected(self) -> None:
        section = {
            "responsive": {
                "breakpoint_exception_proposals": [
                    {"status": "APPROVED", "source": "OWNER", "threshold_px": 1100}
                ]
            }
        }
        errors = validate_css_text(
            "@media (min-width: 1100px){.x{display:block}}",
            contract(override="OWNER_ALLOWED"),
            section=section,
        )
        self.assertTrue(any("unowned viewport threshold 1100px" in error for error in errors))

    def test_page_run_rejects_known_static_html_output_for_php_profile(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            profile = wordpress_profile() | {"profile_id": "IMPL-TEST"}
            (root / "profile.yaml").write_text(yaml.safe_dump(profile), encoding="utf-8")
            run = {
                "coordination": {"implementation_profile_path": "profile.yaml"},
                "code": {"target_route": "experiments/example/index.html"},
            }
            with patch.object(output_contract, "ROOT", root):
                errors = validate_run_output_contract(run)
        self.assertTrue(any("contradicts SERVER_RENDERED_PHP" in error for error in errors))

    def test_page_run_does_not_guess_from_url_like_route(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            profile = wordpress_profile() | {"profile_id": "IMPL-TEST"}
            (root / "profile.yaml").write_text(yaml.safe_dump(profile), encoding="utf-8")
            run = {
                "coordination": {"implementation_profile_path": "profile.yaml"},
                "code": {"target_route": "/"},
            }
            with patch.object(output_contract, "ROOT", root):
                self.assertEqual([], validate_run_output_contract(run))

    def test_modern_range_syntax_extracts_threshold(self) -> None:
        self.assertEqual({768.0}, extract_media_query_thresholds("(width >= 768px)"))
        self.assertEqual({767.0}, extract_media_query_thresholds("(767px >= width)"))


if __name__ == "__main__":
    unittest.main()
