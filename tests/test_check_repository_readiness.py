from __future__ import annotations

import io
import json
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import check_repository_readiness as readiness  # noqa: E402


def make_result(
    name: str,
    *,
    returncode: int = 0,
    stdout: str = "",
    stderr: str = "",
) -> readiness.CheckResult:
    return readiness.CheckResult(
        name=name,
        command=["python", name],
        returncode=returncode,
        stdout=stdout,
        stderr=stderr,
    )


class RepositoryReadinessTests(unittest.TestCase):
    @patch("check_repository_readiness.subprocess.run")
    def test_run_check_preserves_failure_output(self, run: Mock) -> None:
        run.return_value = Mock(returncode=1, stdout="bad record\n", stderr="trace\n")
        result = readiness.run_check("records", ("scripts/validate_records.py",))
        self.assertFalse(result.passed)
        self.assertTrue(result.failed)
        self.assertEqual("FAIL", result.status)
        self.assertEqual(result.returncode, 1)
        self.assertIn("bad record", result.stdout)
        self.assertIn("trace", result.stderr)
        run.assert_called_once()

    @patch("check_repository_readiness.subprocess.run")
    def test_run_check_uses_current_python_and_repo_root(self, run: Mock) -> None:
        run.return_value = Mock(returncode=0, stdout="", stderr="")
        result = readiness.run_check("unit_tests", ("-m", "unittest", "discover"))
        self.assertTrue(result.passed)
        self.assertFalse(result.skipped)
        self.assertEqual("PASS", result.status)
        args, kwargs = run.call_args
        self.assertEqual(args[0][0], sys.executable)
        self.assertEqual(kwargs["cwd"], readiness.ROOT)
        self.assertFalse(kwargs["check"])
        self.assertTrue(kwargs["capture_output"])

    def test_check_result_distinguishes_pass_skip_and_fail(self) -> None:
        passed = make_result("passed", stdout="PASS detail\n")
        skipped = make_result("skipped", stdout="SKIP no evidence yet\n")
        failed = make_result("failed", returncode=1, stdout="FAIL broken\n")

        self.assertEqual("PASS", passed.status)
        self.assertTrue(passed.passed)
        self.assertFalse(passed.skipped)
        self.assertFalse(passed.failed)

        self.assertEqual("SKIP", skipped.status)
        self.assertFalse(skipped.passed)
        self.assertTrue(skipped.skipped)
        self.assertFalse(skipped.failed)
        self.assertTrue(skipped.successful)

        self.assertEqual("FAIL", failed.status)
        self.assertFalse(failed.passed)
        self.assertFalse(failed.skipped)
        self.assertTrue(failed.failed)
        self.assertFalse(failed.successful)

    def test_text_summary_keeps_skip_non_failing_and_prints_reason(self) -> None:
        fake_results = {
            "normal": make_result("normal", stdout="PASS normal\n"),
            "optional": make_result("optional", stdout="SKIP no replay pair yet\n"),
        }

        def fake_run(name: str, _args: tuple[str, ...]) -> readiness.CheckResult:
            return fake_results[name]

        output = io.StringIO()
        with (
            patch.object(readiness, "CHECKS", (("normal", ("normal",)), ("optional", ("optional",)))),
            patch.object(readiness, "run_check", side_effect=fake_run),
            patch.object(sys, "argv", ["check_repository_readiness.py"]),
            redirect_stdout(output),
        ):
            self.assertEqual(0, readiness.main())

        text = output.getvalue()
        self.assertIn("PASS normal", text)
        self.assertIn("SKIP optional", text)
        self.assertIn("SKIP no replay pair yet", text)
        self.assertIn("Summary: 1 passed / 1 skipped / 0 failed", text)

    def test_json_summary_exposes_skip_separately(self) -> None:
        fake_results = {
            "normal": make_result("normal"),
            "optional": make_result("optional", stdout="SKIP no FIRST PASS yet\n"),
        }

        def fake_run(name: str, _args: tuple[str, ...]) -> readiness.CheckResult:
            return fake_results[name]

        output = io.StringIO()
        with (
            patch.object(readiness, "CHECKS", (("normal", ("normal",)), ("optional", ("optional",)))),
            patch.object(readiness, "run_check", side_effect=fake_run),
            patch.object(sys, "argv", ["check_repository_readiness.py", "--json"]),
            redirect_stdout(output),
        ):
            self.assertEqual(0, readiness.main())

        payload = json.loads(output.getvalue())
        self.assertEqual(1, payload["passed"])
        self.assertEqual(1, payload["skipped"])
        self.assertEqual(0, payload["failed"])
        self.assertEqual(2, payload["successful"])
        self.assertEqual("SKIP", payload["results"][1]["status"])
        self.assertTrue(payload["results"][1]["successful"])

    def test_fail_fast_stops_only_on_failure_not_skip(self) -> None:
        fake_results = {
            "skip": make_result("skip", stdout="SKIP not ready\n"),
            "fail": make_result("fail", returncode=1, stdout="FAIL broken\n"),
            "never": make_result("never"),
        }
        calls: list[str] = []

        def fake_run(name: str, _args: tuple[str, ...]) -> readiness.CheckResult:
            calls.append(name)
            return fake_results[name]

        output = io.StringIO()
        with (
            patch.object(
                readiness,
                "CHECKS",
                (("skip", ("skip",)), ("fail", ("fail",)), ("never", ("never",))),
            ),
            patch.object(readiness, "run_check", side_effect=fake_run),
            patch.object(sys, "argv", ["check_repository_readiness.py", "--fail-fast"]),
            redirect_stdout(output),
        ):
            self.assertEqual(1, readiness.main())

        self.assertEqual(["skip", "fail"], calls)
        self.assertIn("Summary: 0 passed / 1 skipped / 1 failed", output.getvalue())

    def test_check_list_contains_all_high_level_safety_lanes(self) -> None:
        names = {name for name, _ in readiness.CHECKS}
        expected = {
            "frontend_implementation_policy",
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
            "first_pass_evidence",
            "clean_replay_pairs",
            "unit_tests",
        }
        self.assertTrue(expected <= names)


if __name__ == "__main__":
    unittest.main()
