from __future__ import annotations

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
AGENTS = ROOT / "AGENTS.md"
ADAPTERS = ROOT / "docs" / "agent-adapters.md"
WP_POLICY = ROOT / "docs" / "wordpress-acf-policy.md"
RUNTIME_README = ROOT / "experiments" / "wordpress-acf-runtime" / "README.md"
THEME_RULES = ROOT / "experiments" / "budokan-wordpress" / "THEME_RULES.md"
CURRENT_AUTHORITY = ROOT / "experiments" / "budokan-wordpress" / "CURRENT_AUTHORITY.md"
CURSOR_RULES = ROOT / ".cursor" / "rules"


class PortableKnowledgeLivesInGitTests(unittest.TestCase):
    def test_root_agents_declares_git_as_standing_memory(self) -> None:
        agents = AGENTS.read_text(encoding="utf-8")
        self.assertIn("この Git repository が全 AI の standing memory", agents)
        self.assertIn("experiments/budokan-wordpress/CURRENT_AUTHORITY.md", agents)
        self.assertIn("99-local-limits.ini", agents)
        self.assertIn("body.home", agents)
        self.assertIn("portable な Human-approved contract を `.cursor/rules` / chat memory だけに置く", agents)
        self.assertIn("状態変化で箱をずらさない", agents)

    def test_quick_contract_owns_interaction_box_hygiene(self) -> None:
        quick = (ROOT / "docs" / "frontend-quick-contract.md").read_text(encoding="utf-8")
        self.assertIn("状態変化で箱をずらさない", quick)
        self.assertIn("hover / focus / active / open で初めて", quick)

    def test_adapters_forbid_cursor_only_portable_contracts(self) -> None:
        adapters = ADAPTERS.read_text(encoding="utf-8")
        self.assertIn("Human-approved な portable contract を `.cursor/rules` だけに置かない", adapters)

    def test_wordpress_policy_owns_explicit_params_and_no_invent(self) -> None:
        policy = WP_POLICY.read_text(encoding="utf-8")
        self.assertIn("get_footer(null, array('map' => true))", policy)
        self.assertIn("新しい ACF / CPT / スラッグを、Figma に見えたという理由だけで発明しない", policy)

    def test_runtime_readme_owns_php_limits(self) -> None:
        readme = RUNTIME_README.read_text(encoding="utf-8")
        self.assertIn("99-local-limits.ini", readme)
        self.assertIn("デフォルト 2M のまま起動しない", readme)
        self.assertIn("00-local-runtime-guard.php", readme)
        self.assertIn("WP_MEMORY_LIMIT", readme)

    def test_budokan_authority_owns_menu_gate_and_acf(self) -> None:
        authority = CURRENT_AUTHORITY.read_text(encoding="utf-8")
        rules = THEME_RULES.read_text(encoding="utf-8")
        self.assertIn("メニューは **作成済み**", authority)
        self.assertIn("acf-export.json", authority)
        self.assertIn("get_footer(null, array('map' => true))", rules)

    def test_cursor_rules_are_not_always_apply_portable_contracts(self) -> None:
        if not CURSOR_RULES.exists():
            return
        always_apply = []
        for path in sorted(CURSOR_RULES.glob("*.mdc")):
            text = path.read_text(encoding="utf-8")
            if "alwaysApply: true" in text:
                always_apply.append(path.name)
        self.assertEqual(
            always_apply,
            [],
            "portable contracts belong in Git; Cursor alwaysApply rules are not standing memory: "
            + ", ".join(always_apply),
        )


if __name__ == "__main__":
    unittest.main()
