from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import probe_wordpress_acf_runtime as probe  # noqa: E402


class FakeWp:
    def __init__(self, responses: dict[tuple[str, ...], probe.CommandResult]) -> None:
        self.responses = responses
        self.commands: list[tuple[str, ...]] = []

    def __call__(self, command: list[str] | tuple[str, ...]) -> probe.CommandResult:
        key = tuple(command[1:])
        self.commands.append(tuple(command))
        return self.responses.get(key, probe.CommandResult(1, "", "missing fixture"))


def ready_responses() -> dict[tuple[str, ...], probe.CommandResult]:
    return {
        ("core", "version"): probe.CommandResult(0, "6.9.1"),
        ("option", "get", "siteurl"): probe.CommandResult(0, "https://example.test"),
        ("eval", "echo get_stylesheet();"): probe.CommandResult(0, "example-theme"),
        ("plugin", "get", "advanced-custom-fields-pro", "--field=status"): probe.CommandResult(1),
        ("plugin", "get", "advanced-custom-fields", "--field=status"): probe.CommandResult(0, "active"),
        ("plugin", "get", "advanced-custom-fields", "--field=version"): probe.CommandResult(0, "6.6.1"),
        (
            "eval",
            'echo function_exists("acf_get_field_groups") ? "1" : "0";',
        ): probe.CommandResult(0, "1"),
        ("user", "list", "--role=administrator", "--format=count"): probe.CommandResult(0, "1"),
    }


class WordPressAcfRuntimeProbeTests(unittest.TestCase):
    def test_missing_wp_cli_is_blocked_without_claiming_ui_smoke(self) -> None:
        result = probe.probe(executable_lookup=lambda _: None)
        self.assertEqual(result["status"], "BLOCKED")
        self.assertEqual(result["runtime_state"], "CLI_UNAVAILABLE")
        self.assertFalse(result["capabilities"]["admin_ui_smoke_executed"])

    def test_wp_cli_without_bootstrap_is_distinct_blocker(self) -> None:
        fake = FakeWp({("core", "version"): probe.CommandResult(1)})
        result = probe.probe(runner=fake, executable_lookup=lambda _: "/usr/local/bin/wp")
        self.assertEqual(result["runtime_state"], "WORDPRESS_BOOTSTRAP_UNAVAILABLE")
        self.assertTrue(result["capabilities"]["wp_cli"])
        self.assertFalse(result["capabilities"]["wordpress_bootstrap"])

    def test_ready_runtime_still_keeps_admin_ui_unverified(self) -> None:
        fake = FakeWp(ready_responses())
        result = probe.probe(runner=fake, executable_lookup=lambda _: "/usr/local/bin/wp")
        self.assertEqual(result["status"], "READY")
        self.assertEqual(result["runtime_state"], "RUNTIME_READY_UI_UNVERIFIED")
        self.assertTrue(result["capabilities"]["acf_plugin_active"])
        self.assertTrue(result["capabilities"]["acf_api_loaded"])
        self.assertTrue(result["capabilities"]["administrator_present"])
        self.assertFalse(result["capabilities"]["admin_ui_smoke_executed"])
        self.assertIn("does not mean", result["claim_boundary"])

    def test_inactive_acf_is_blocked(self) -> None:
        responses = ready_responses()
        responses[("plugin", "get", "advanced-custom-fields", "--field=status")] = probe.CommandResult(0, "inactive")
        responses[("eval", 'echo function_exists("acf_get_field_groups") ? "1" : "0";')] = probe.CommandResult(0, "0")
        fake = FakeWp(responses)
        result = probe.probe(runner=fake, executable_lookup=lambda _: "/usr/local/bin/wp")
        self.assertEqual(result["status"], "BLOCKED")
        self.assertTrue(any("not active" in reason for reason in result["blocking_reasons"]))

    def test_acf_pro_is_preferred_when_both_slugs_could_exist(self) -> None:
        responses = ready_responses()
        responses[("plugin", "get", "advanced-custom-fields-pro", "--field=status")] = probe.CommandResult(0, "active")
        responses[("plugin", "get", "advanced-custom-fields-pro", "--field=version")] = probe.CommandResult(0, "6.6.1-pro")
        fake = FakeWp(responses)
        result = probe.probe(runner=fake, executable_lookup=lambda _: "/usr/local/bin/wp")
        self.assertEqual(result["runtime"]["acf_plugin_slug"], "advanced-custom-fields-pro")
        self.assertEqual(result["runtime"]["acf_version"], "6.6.1-pro")

    def test_missing_admin_keeps_runtime_blocked_for_admin_ui_readiness(self) -> None:
        responses = ready_responses()
        responses[("user", "list", "--role=administrator", "--format=count")] = probe.CommandResult(0, "0")
        fake = FakeWp(responses)
        result = probe.probe(runner=fake, executable_lookup=lambda _: "/usr/local/bin/wp")
        self.assertEqual(result["status"], "BLOCKED")
        self.assertTrue(any("administrator" in reason for reason in result["blocking_reasons"]))


if __name__ == "__main__":
    unittest.main()
