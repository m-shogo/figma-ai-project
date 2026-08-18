from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import capture_target_git_baseline as baseline  # noqa: E402


class QueueRunner:
    def __init__(self, *results: baseline.CommandResult) -> None:
        self.results = list(results)
        self.commands: list[list[str]] = []

    def run(self, args, *, timeout: int) -> baseline.CommandResult:
        self.commands.append(list(args))
        if not self.results:
            raise AssertionError("unexpected command")
        return self.results.pop(0)


class RemoteSanitizationTests(unittest.TestCase):
    def test_https_credentials_query_and_fragment_are_removed(self) -> None:
        value, redacted, kind = baseline.sanitize_remote_url(
            "https://token-user:secret@github.com/m-shogo/site.git?access_token=x#fragment"
        )
        self.assertEqual(value, "https://github.com/m-shogo/site.git")
        self.assertTrue(redacted)
        self.assertEqual(kind, "URL")
        self.assertNotIn("secret", value)
        self.assertNotIn("access_token", value)

    def test_plain_https_remote_is_preserved_without_secret_parts(self) -> None:
        value, redacted, kind = baseline.sanitize_remote_url("https://github.com/m-shogo/site.git")
        self.assertEqual(value, "https://github.com/m-shogo/site.git")
        self.assertFalse(redacted)
        self.assertEqual(kind, "URL")

    def test_ssh_scp_remote_is_preserved(self) -> None:
        value, redacted, kind = baseline.sanitize_remote_url("git@github.com:m-shogo/site.git")
        self.assertEqual(value, "git@github.com:m-shogo/site.git")
        self.assertFalse(redacted)
        self.assertEqual(kind, "SSH_SCP")

    def test_local_remote_path_is_not_persisted(self) -> None:
        value, redacted, kind = baseline.sanitize_remote_url("/Users/example/private/site")
        self.assertEqual(value, "")
        self.assertTrue(redacted)
        self.assertEqual(kind, "LOCAL_OR_UNCLASSIFIED")


class CaptureTests(unittest.TestCase):
    def test_git_unavailable_is_explicit(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = baseline.capture(Path(tmp).resolve(), executable_lookup=lambda _: None)
        self.assertEqual(result["state"], "GIT_UNAVAILABLE")
        self.assertIsNone(result["dirty"])

    def test_non_git_directory_is_explicit(self) -> None:
        runner = QueueRunner(baseline.CommandResult(128, "", "not a git repository"))
        with tempfile.TemporaryDirectory() as tmp:
            result = baseline.capture(
                Path(tmp).resolve(), runner=runner, executable_lookup=lambda _: "/usr/bin/git"
            )
        self.assertEqual(result["state"], "NOT_GIT_REPOSITORY")

    def test_clean_repository_captures_head_branch_and_sanitized_origin(self) -> None:
        runner = QueueRunner(
            baseline.CommandResult(0, "true"),
            baseline.CommandResult(0, "a" * 40),
            baseline.CommandResult(0, "main"),
            baseline.CommandResult(0, ""),
            baseline.CommandResult(0, "https://token:secret@github.com/m-shogo/site.git"),
        )
        with tempfile.TemporaryDirectory() as tmp:
            result = baseline.capture(
                Path(tmp).resolve(), runner=runner, executable_lookup=lambda _: "/usr/bin/git"
            )

        self.assertEqual(result["state"], "OBSERVED")
        self.assertEqual(result["head"], "a" * 40)
        self.assertEqual(result["branch"], "main")
        self.assertFalse(result["detached"])
        self.assertFalse(result["dirty"])
        self.assertEqual(result["changed_entry_count"], 0)
        self.assertEqual(result["origin"]["value"], "https://github.com/m-shogo/site.git")
        self.assertTrue(result["origin"]["credentials_or_sensitive_parts_redacted"])

    def test_dirty_repository_records_count_without_persisting_changed_paths(self) -> None:
        runner = QueueRunner(
            baseline.CommandResult(0, "true"),
            baseline.CommandResult(0, "b" * 40),
            baseline.CommandResult(0, "feature/test"),
            baseline.CommandResult(0, " M wp-content/themes/x/private.php\n?? .env.local"),
            baseline.CommandResult(0, "git@github.com:m-shogo/site.git"),
        )
        with tempfile.TemporaryDirectory() as tmp:
            result = baseline.capture(
                Path(tmp).resolve(), runner=runner, executable_lookup=lambda _: "/usr/bin/git"
            )

        serialized = str(result)
        self.assertTrue(result["dirty"])
        self.assertEqual(result["changed_entry_count"], 2)
        self.assertNotIn("private.php", serialized)
        self.assertNotIn(".env.local", serialized)

    def test_detached_head_is_recorded_not_rejected(self) -> None:
        runner = QueueRunner(
            baseline.CommandResult(0, "true"),
            baseline.CommandResult(0, "c" * 40),
            baseline.CommandResult(0, ""),
            baseline.CommandResult(0, ""),
            baseline.CommandResult(2, "", "no origin"),
        )
        with tempfile.TemporaryDirectory() as tmp:
            result = baseline.capture(
                Path(tmp).resolve(), runner=runner, executable_lookup=lambda _: "/usr/bin/git"
            )
        self.assertTrue(result["detached"])
        self.assertFalse(result["dirty"])
        self.assertEqual(result["head"], "c" * 40)


if __name__ == "__main__":
    unittest.main()
