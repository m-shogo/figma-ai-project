from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import check_repository_readiness as readiness  # noqa: E402


class RepositoryReadinessTests(unittest.TestCase):
    @patch("check_repository_readiness.subprocess.run")
    def test_run_check_preserves_failure_output(self, run: Mock) -> None:
        run.return_value = Mock(returncode=1, stdout="bad record\n", stderr="trace\n")
        result = readiness.run_check("records", ("scripts/validate_records.py",))
        self.assertFalse(result.passed)
        self.assertEqual(result.returncode, 1)
        self.assertIn("bad record", result.stdout)
        self.assertIn("trace", result.stderr)
        run.assert_called_once()

    @patch("check_repository_readiness.subprocess.run")
    def test_run_check_uses_current_python_and_repo_root(self, run: Mock) -> None:
        run.return_value = Mock(returncode=0, stdout="", stderr="")
        result = readiness.run_check("unit_tests", ("-m", "unittest", "discover"))
        self.assertTrue(result.passed)
        args, kwargs = run.call_args
        self.assertEqual(args[0][0], sys.executable)
        self.assertEqual(kwargs["cwd"], readiness.ROOT)
        self.assertFalse(kwargs["check"])
        self.assertTrue(kwargs["capture_output"])

    def test_check_list_contains_all_high_level_safety_lanes(self) -> None:
        names = {name for name, _ in readiness.CHECKS}
        expected = {
            "records",
            "global_figma_profile",
            "section_figma_profiles",
            "section_profile_lineage",
            "component_token_resolution",
            "breakpoint_contract",
            "section_discovery",
            "parallel_paths",
            "parallel_isolation",
            "run_lineage",
            "unit_tests",
        }
        self.assertTrue(expected <= names)


if __name__ == "__main__":
    unittest.main()
