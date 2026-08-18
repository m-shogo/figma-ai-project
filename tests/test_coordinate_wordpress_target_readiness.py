from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import coordinate_wordpress_target_readiness as coordinator  # noqa: E402


def recon(*, state: str = "UNAMBIGUOUS", path: str = "wp-content/themes/sample-theme") -> dict:
    themes = [{"path": path, "theme_name": "Sample Theme"}] if state == "UNAMBIGUOUS" else []
    return {"selection_state": state, "themes": themes}


def git_state(*, state: str = "OBSERVED", dirty: bool | None = False) -> dict:
    return {
        "state": state,
        "head": "d" * 40 if state == "OBSERVED" else "",
        "branch": "main" if state == "OBSERVED" else "",
        "detached": False,
        "dirty": dirty,
        "changed_entry_count": 0 if dirty is False else (1 if dirty is True else None),
        "origin": {"value": "https://github.com/example/site.git", "kind": "URL", "credentials_or_sensitive_parts_redacted": False},
    }


def runtime(*, status: str = "READY", state: str = "RUNTIME_READY_UI_UNVERIFIED", theme: str = "sample-theme") -> dict:
    return {
        "status": status,
        "runtime_state": state,
        "capabilities": {"admin_ui_smoke_executed": False},
        "blocking_reasons": [] if status == "READY" else ["runtime blocked"],
        "runtime": {"active_theme_stylesheet": theme},
    }


def ref001(*, status: str = "READY", blockers: list[str] | None = None) -> dict:
    return {
        "status": status,
        "execution_mode": "PREFLIGHT_ONLY",
        "blockers": blockers or [],
        "admin_ui_interactive_smoke": "NOT_RUN",
    }


class CoordinatorTests(unittest.TestCase):
    def test_without_wp_path_remains_blocked_and_never_claims_admin_ui(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, \
            patch.object(coordinator.target_scan, "scan", return_value=recon()), \
            patch.object(coordinator.git_baseline, "capture", return_value=git_state()):
            result = coordinator.coordinate(target_repo=Path(tmp).resolve())

        self.assertEqual(result["status"], "BLOCKED")
        self.assertIn("WORDPRESS_RUNTIME_NOT_SUPPLIED", result["binding_readiness"]["blockers"])
        self.assertEqual(result["binding_readiness"]["starting_commit"], "d" * 40)
        self.assertFalse(result["completion_readiness"]["ready"])
        self.assertFalse(result["completion_readiness"]["admin_ui_smoke_executed"])
        self.assertIn("ADMIN_UI_SMOKE_NOT_RUN", result["completion_readiness"]["blockers"])

    def test_matching_static_runtime_theme_and_clean_git_can_be_ready_for_binding_review(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, \
            patch.object(coordinator.target_scan, "scan", return_value=recon()), \
            patch.object(coordinator.git_baseline, "capture", return_value=git_state()), \
            patch.object(coordinator.runtime_probe, "probe", return_value=runtime()), \
            patch.object(coordinator.ref001_probe, "validate_site_url", return_value=""), \
            patch.object(coordinator.ref001_probe, "probe_runtime", return_value=ref001()):
            result = coordinator.coordinate(
                target_repo=Path(tmp).resolve(),
                wp_path=Path(tmp).resolve() / "wordpress",
                runtime_executable_lookup=lambda _: "/usr/local/bin/wp",
            )

        self.assertEqual(result["status"], "READY_FOR_PRODUCTION_BINDING_REVIEW")
        self.assertTrue(result["binding_readiness"]["ready"])
        self.assertEqual(result["binding_readiness"]["theme_consistency"], "MATCH")
        self.assertEqual(result["binding_readiness"]["starting_commit"], "d" * 40)
        self.assertFalse(result["completion_readiness"]["ready"])
        self.assertEqual(result["completion_readiness"]["blockers"], ["ADMIN_UI_SMOKE_NOT_RUN"])

    def test_dirty_git_worktree_blocks_binding(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, \
            patch.object(coordinator.target_scan, "scan", return_value=recon()), \
            patch.object(coordinator.git_baseline, "capture", return_value=git_state(dirty=True)), \
            patch.object(coordinator.runtime_probe, "probe", return_value=runtime()), \
            patch.object(coordinator.ref001_probe, "validate_site_url", return_value=""), \
            patch.object(coordinator.ref001_probe, "probe_runtime", return_value=ref001()):
            result = coordinator.coordinate(target_repo=Path(tmp).resolve(), wp_path=Path(tmp).resolve() / "wordpress")

        self.assertIn("TARGET_GIT_WORKTREE_DIRTY", result["binding_readiness"]["blockers"])
        self.assertFalse(result["binding_readiness"]["ready"])

    def test_missing_git_baseline_blocks_binding(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, \
            patch.object(coordinator.target_scan, "scan", return_value=recon()), \
            patch.object(coordinator.git_baseline, "capture", return_value=git_state(state="NOT_GIT_REPOSITORY", dirty=None)), \
            patch.object(coordinator.runtime_probe, "probe", return_value=runtime()), \
            patch.object(coordinator.ref001_probe, "validate_site_url", return_value=""), \
            patch.object(coordinator.ref001_probe, "probe_runtime", return_value=ref001()):
            result = coordinator.coordinate(target_repo=Path(tmp).resolve(), wp_path=Path(tmp).resolve() / "wordpress")

        self.assertIn("TARGET_GIT_BASELINE_NOT_GIT_REPOSITORY", result["binding_readiness"]["blockers"])
        self.assertEqual(result["binding_readiness"]["starting_commit"], "")

    def test_theme_mismatch_blocks_binding(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, \
            patch.object(coordinator.target_scan, "scan", return_value=recon()), \
            patch.object(coordinator.git_baseline, "capture", return_value=git_state()), \
            patch.object(coordinator.runtime_probe, "probe", return_value=runtime(theme="other-theme")), \
            patch.object(coordinator.ref001_probe, "validate_site_url", return_value=""), \
            patch.object(coordinator.ref001_probe, "probe_runtime", return_value=ref001()):
            result = coordinator.coordinate(target_repo=Path(tmp).resolve(), wp_path=Path(tmp).resolve() / "wordpress")

        self.assertFalse(result["binding_readiness"]["ready"])
        self.assertEqual(result["binding_readiness"]["theme_consistency"], "MISMATCH")
        self.assertIn("STATIC_RUNTIME_THEME_MISMATCH", result["binding_readiness"]["blockers"])

    def test_runtime_blocker_is_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, \
            patch.object(coordinator.target_scan, "scan", return_value=recon()), \
            patch.object(coordinator.git_baseline, "capture", return_value=git_state()), \
            patch.object(
                coordinator.runtime_probe,
                "probe",
                return_value=runtime(status="BLOCKED", state="WORDPRESS_BOOTSTRAP_UNAVAILABLE", theme=""),
            ), \
            patch.object(coordinator.ref001_probe, "validate_site_url", return_value=""), \
            patch.object(coordinator.ref001_probe, "probe_runtime", return_value=ref001()):
            result = coordinator.coordinate(target_repo=Path(tmp).resolve(), wp_path=Path(tmp).resolve() / "wordpress")

        self.assertIn(
            "WORDPRESS_RUNTIME_WORDPRESS_BOOTSTRAP_UNAVAILABLE",
            result["binding_readiness"]["blockers"],
        )

    def test_ref001_import_preflight_blockers_are_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, \
            patch.object(coordinator.target_scan, "scan", return_value=recon()), \
            patch.object(coordinator.git_baseline, "capture", return_value=git_state()), \
            patch.object(coordinator.runtime_probe, "probe", return_value=runtime()), \
            patch.object(coordinator.ref001_probe, "validate_site_url", return_value=""), \
            patch.object(
                coordinator.ref001_probe,
                "probe_runtime",
                return_value=ref001(status="BLOCKED", blockers=["ACF_JSON_IMPORT_COMMAND_UNAVAILABLE"]),
            ):
            result = coordinator.coordinate(target_repo=Path(tmp).resolve(), wp_path=Path(tmp).resolve() / "wordpress")

        self.assertIn("ACF_JSON_IMPORT_COMMAND_UNAVAILABLE", result["binding_readiness"]["blockers"])
        self.assertFalse(result["completion_readiness"]["admin_ui_smoke_executed"])

    def test_multiple_static_theme_candidates_block_binding_even_if_runtime_is_ready(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, \
            patch.object(coordinator.target_scan, "scan", return_value=recon(state="MULTIPLE_CANDIDATES")), \
            patch.object(coordinator.git_baseline, "capture", return_value=git_state()), \
            patch.object(coordinator.runtime_probe, "probe", return_value=runtime()), \
            patch.object(coordinator.ref001_probe, "validate_site_url", return_value=""), \
            patch.object(coordinator.ref001_probe, "probe_runtime", return_value=ref001()):
            result = coordinator.coordinate(target_repo=Path(tmp).resolve(), wp_path=Path(tmp).resolve() / "wordpress")

        self.assertIn("THEME_SELECTION_MULTIPLE_CANDIDATES", result["binding_readiness"]["blockers"])
        self.assertEqual(result["binding_readiness"]["theme_consistency"], "UNDETERMINED")


if __name__ == "__main__":
    unittest.main()
