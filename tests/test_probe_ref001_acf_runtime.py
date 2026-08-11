from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from typing import Sequence

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import probe_ref001_acf_runtime as probe  # noqa: E402


class FakeRunner:
    def __init__(self, responses: list[probe.CommandResult]) -> None:
        self.responses = list(responses)
        self.calls: list[list[str]] = []

    def run(self, args: Sequence[str], *, timeout: int) -> probe.CommandResult:
        self.calls.append(list(args))
        if not self.responses:
            raise AssertionError(f"unexpected command: {args}")
        return self.responses.pop(0)


def make_import_file(directory: str) -> Path:
    path = Path(directory) / "acf-import.json"
    path.write_text(
        json.dumps(
            [
                {"key": "group_ref001_top_page", "title": "Top"},
                {"key": "group_ref001_courses", "title": "Courses"},
            ]
        ),
        encoding="utf-8",
    )
    return path


class VersionTests(unittest.TestCase):
    def test_parse_version(self) -> None:
        self.assertEqual((6, 8, 0), probe.parse_version("6.8"))
        self.assertEqual((6, 8, 1), probe.parse_version("ACF 6.8.1"))
        self.assertIsNone(probe.parse_version("unknown"))

    def test_site_url_rejects_credentials(self) -> None:
        with self.assertRaisesRegex(ValueError, "credentials"):
            probe.validate_site_url("https://user:pass@example.test")


class ImportFileTests(unittest.TestCase):
    def test_load_item_keys(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = make_import_file(tmp)
            self.assertEqual(
                ["group_ref001_top_page", "group_ref001_courses"],
                probe.load_item_keys(path),
            )

    def test_rejects_non_importable_payload(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "empty.json"
            path.write_text('[{"key":"field_x"}]', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "no importable"):
                probe.load_item_keys(path)


class RuntimeProbeTests(unittest.TestCase):
    def test_missing_wp_cli_is_blocked_without_followup_commands(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            runner = FakeRunner([probe.CommandResult(127, "", "command not found")])
            result = probe.probe_runtime(
                runner=runner,
                wp_binary="wp",
                wp_path=Path(tmp),
                site_url="",
                import_file=make_import_file(tmp),
            )
        self.assertEqual("BLOCKED", result["status"])
        self.assertEqual(["WP_CLI_UNAVAILABLE"], result["blockers"])
        self.assertEqual(1, len(runner.calls))

    def test_old_acf_and_missing_command_are_reported(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            runner = FakeRunner(
                [
                    probe.CommandResult(0, "WP-CLI 2.12.0"),
                    probe.CommandResult(0),
                    probe.CommandResult(0, "6.8.3"),
                    probe.CommandResult(0, "6.7.9"),
                    probe.CommandResult(1),
                ]
            )
            result = probe.probe_runtime(
                runner=runner,
                wp_binary="wp",
                wp_path=Path(tmp),
                site_url="https://example.test",
                import_file=make_import_file(tmp),
            )
        self.assertEqual("BLOCKED", result["status"])
        self.assertIn("ACF_VERSION_BELOW_6_8_CLI_IMPORT_REQUIREMENT", result["blockers"])
        self.assertIn("ACF_JSON_IMPORT_COMMAND_UNAVAILABLE", result["blockers"])

    def test_ready_runtime_does_not_mutate(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            runner = FakeRunner(
                [
                    probe.CommandResult(0, "WP-CLI 2.12.0"),
                    probe.CommandResult(0),
                    probe.CommandResult(0, "6.8.3"),
                    probe.CommandResult(0, "6.8.2"),
                    probe.CommandResult(0),
                ]
            )
            result = probe.probe_runtime(
                runner=runner,
                wp_binary="wp",
                wp_path=Path(tmp),
                site_url="",
                import_file=make_import_file(tmp),
            )
        self.assertEqual("READY", result["status"])
        self.assertEqual("NOT_RUN", result["cli_import_smoke"])
        self.assertEqual("NOT_RUN", result["admin_ui_interactive_smoke"])
        self.assertEqual(5, len(runner.calls))

    def test_execute_import_requires_disposable_ack(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            runner = FakeRunner(
                [
                    probe.CommandResult(0, "WP-CLI 2.12.0"),
                    probe.CommandResult(0),
                    probe.CommandResult(0, "6.8.3"),
                    probe.CommandResult(0, "6.8.2"),
                    probe.CommandResult(0),
                ]
            )
            result = probe.probe_runtime(
                runner=runner,
                wp_binary="wp",
                wp_path=Path(tmp),
                site_url="",
                import_file=make_import_file(tmp),
                execute_import=True,
                acknowledge_disposable=False,
            )
        self.assertEqual("BLOCKED", result["status"])
        self.assertEqual(["DISPOSABLE_RUNTIME_ACK_REQUIRED"], result["blockers"])
        self.assertEqual(5, len(runner.calls))

    def test_cli_import_and_readback_pass(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            runner = FakeRunner(
                [
                    probe.CommandResult(0, "WP-CLI 2.12.0"),
                    probe.CommandResult(0),
                    probe.CommandResult(0, "6.8.3"),
                    probe.CommandResult(0, "6.8.2"),
                    probe.CommandResult(0),
                    probe.CommandResult(0, "Imported field-group: Top\nImported field-group: Courses"),
                    probe.CommandResult(0, "group_ref001_top_page:1\ngroup_ref001_courses:1"),
                ]
            )
            result = probe.probe_runtime(
                runner=runner,
                wp_binary="wp",
                wp_path=Path(tmp),
                site_url="",
                import_file=make_import_file(tmp),
                execute_import=True,
                acknowledge_disposable=True,
            )
        self.assertEqual("PASS", result["status"])
        self.assertEqual("PASS", result["cli_import_smoke"])
        self.assertEqual("NOT_RUN", result["admin_ui_interactive_smoke"])
        self.assertTrue(result["checks"]["imported_items_readback"]["ok"])
        self.assertIn("acf", runner.calls[5])

    def test_import_failure_is_fail_not_blocked(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            runner = FakeRunner(
                [
                    probe.CommandResult(0, "WP-CLI 2.12.0"),
                    probe.CommandResult(0),
                    probe.CommandResult(0, "6.8.3"),
                    probe.CommandResult(0, "6.8.2"),
                    probe.CommandResult(0),
                    probe.CommandResult(1, "", "invalid JSON"),
                ]
            )
            result = probe.probe_runtime(
                runner=runner,
                wp_binary="wp",
                wp_path=Path(tmp),
                site_url="",
                import_file=make_import_file(tmp),
                execute_import=True,
                acknowledge_disposable=True,
            )
        self.assertEqual("FAIL", result["status"])
        self.assertEqual("FAIL", result["cli_import_smoke"])
        self.assertIn("ACF_JSON_IMPORT_FAILED", result["blockers"])


if __name__ == "__main__":
    unittest.main()
