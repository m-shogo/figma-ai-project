from __future__ import annotations

import io
import json
import sys
from contextlib import redirect_stdout
from unittest.mock import patch
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import scan_wordpress_target as target_scan  # noqa: E402


def make_project(root: Path, name: str, *, author: str = "", css: str = "global/variables.css", vite: bool = False) -> Path:
    project = root / name
    theme = project / "theme"
    (theme / "css").mkdir(parents=True)
    (theme / "inc").mkdir()
    (theme / "style.css").write_text(
        f"/*\nTheme Name: {name}\n" + (f"Author: {author}\n" if author else "") + "Version: 2.0\n*/\n",
        encoding="utf-8",
    )
    (theme / "index.php").write_text("<?php\n", encoding="utf-8")
    (theme / "inc" / "front.php").write_text("<?php\n", encoding="utf-8")
    (theme / "css" / "style.css").write_text(f"@import './{css}?v=1';\n", encoding="utf-8")
    if vite:
        (project / "vite.config.mjs").write_text("export default {}\n", encoding="utf-8")
    return project


class ThemeLineageHintsTests(unittest.TestCase):
    def test_author_is_hint_not_company_policy_and_project_vite_is_seen(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            project = make_project(Path(tmp), "school", author="Codia Inc.", vite=True)
            r = target_scan.scan(project)
            t = r["themes"][0]["lineage_hints"]
            self.assertEqual(t["author_hint"], "Codia Inc.")
            self.assertEqual(t["author_evidence"], "theme/style.css")
            self.assertEqual(t["company_policy_binding"], "UNDETERMINED")
            self.assertEqual(t["theme_baseline_binding"], "UNDETERMINED")
            self.assertIn("vite.config.mjs", t["project_build_hints"])
            self.assertIn("front.php", t["inc_php_modules"])
            self.assertIn("global/variables.css", t["css_import_paths"])

    def test_common_author_and_structure_still_do_not_prove_same_theme_base(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            a = target_scan.scan(make_project(root, "budokan", author="Codia Inc."))
            b = target_scan.scan(make_project(root, "school", author="Codia Inc.", vite=True))
            c = target_scan.compare_theme_lineages(a, b)
            self.assertEqual(c["state"], "EVIDENCE_HINTS_ONLY")
            self.assertTrue(c["same_theme_author_hint"])
            self.assertEqual(c["structural_jaccard"], 1.0)
            self.assertEqual(c["company_policy_binding"], "UNDETERMINED")
            self.assertEqual(c["theme_baseline_binding"], "UNDETERMINED")
            self.assertNotEqual(c["left_build_hints"], c["right_build_hints"])

    def test_different_authors_cannot_be_automatically_grouped(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            a = target_scan.scan(make_project(root, "a", author="Vendor A"))
            b = target_scan.scan(make_project(root, "b", author="Vendor B"))
            c = target_scan.compare_theme_lineages(a, b)
            self.assertFalse(c["same_theme_author_hint"])
            self.assertEqual(c["company_policy_binding"], "UNDETERMINED")

    def test_missing_author_does_not_claim_company(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            a = target_scan.scan(make_project(root, "no-author"))
            b = target_scan.scan(make_project(root, "also-no-author"))
            self.assertEqual(a["themes"][0]["lineage_hints"]["author_hint"], "")
            self.assertFalse(target_scan.compare_theme_lineages(a, b)["same_theme_author_hint"])

    def test_auto_discovers_other_project_themes_from_project_directory(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            current = make_project(root, "school", author="Codia Inc.", vite=True)
            make_project(root, "budokan", author="Codia Inc.")
            make_project(root, "unrelated", author="Other Vendor", css="layout/other.css")
            output = io.StringIO()
            with patch.object(sys, "argv", ["scan", str(current), "--compare-projects-dir", str(root)]), redirect_stdout(output):
                code = target_scan.main()
            self.assertEqual(code, 0)
            comparisons = json.loads(output.getvalue())["known_theme_comparisons"]
            self.assertEqual(len(comparisons), 2)
            self.assertEqual(comparisons[0]["project"], "budokan")
            self.assertTrue(comparisons[0]["same_theme_author_hint"])
            self.assertEqual(comparisons[0]["company_policy_binding"], "UNDETERMINED")
            self.assertEqual(comparisons[1]["project"], "unrelated")
            self.assertFalse(comparisons[1]["same_theme_author_hint"])

    def test_three_scope_routes_do_not_apply_sibling_theme_rules(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            current = make_project(root, "school", author="Codia Inc.", vite=True)
            sibling = make_project(root, "budokan", author="Codia Inc.")
            (current / "docs").mkdir()
            (sibling / "docs").mkdir()
            (current / "docs" / "CURRENT_AUTHORITY.md").write_text("# Current authority\\n", encoding="utf-8")
            (sibling / "docs" / "THEME_RULES.md").write_text("# Budokan-specific rules\\n", encoding="utf-8")
            output = io.StringIO()
            with patch.object(sys, "argv", ["scan", str(current), "--compare-projects-dir", str(root)]), redirect_stdout(output):
                self.assertEqual(target_scan.main(), 0)
            data = json.loads(output.getvalue())
            routes = data["rule_scope_routes"]
            self.assertEqual(routes["scope_levels"], ["COMMON", "THEME", "PROJECT"])
            self.assertIn("docs/CURRENT_AUTHORITY.md", routes["project"]["project_docs"])
            self.assertEqual(routes["theme"]["local_rule_file"], "")
            self.assertEqual(routes["theme"]["local_selection"], "NO_SEPARATE_LOCAL_THEME_RULES")
            self.assertFalse(routes["theme"]["reusable_from_other_project"])
            self.assertEqual(len(routes["theme"]["related_theme_rule_candidates"]), 1)
            self.assertEqual(routes["theme"]["related_theme_rule_candidates"][0]["selection"], "REVIEW_ONLY_NOT_APPLIED")
            self.assertEqual(routes["company_policy"]["selection"], "REQUIRES_AUTHORIZED_COMPANY_POLICY")

    def test_local_theme_rules_are_local_not_universal(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            current = make_project(Path(tmp), "budokan", author="Codia Inc.")
            (current / "docs").mkdir()
            (current / "docs" / "THEME_RULES.md").write_text("# Theme rule\\n", encoding="utf-8")
            routes = target_scan.scope_rule_routes(current, target_scan.scan(current))
            self.assertEqual(routes["theme"]["local_rule_file"], "docs/THEME_RULES.md")
            self.assertEqual(routes["theme"]["local_selection"], "PROJECT_OWNED_ONLY")

    def test_unresolved_theme_does_not_activate_local_rules(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            project = make_project(Path(tmp), "school", author="Codia Inc.")
            (project / "docs").mkdir()
            (project / "docs" / "THEME_RULES.md").write_text("# Local theme rules\\n", encoding="utf-8")
            (project / "docs" / "CURRENT_AUTHORITY.md").write_text("# Project authority\\n", encoding="utf-8")
            # Second plausible Theme exists in a reference folder: never select by author or path alone.
            other = project / "reference" / "candidate"
            other.mkdir(parents=True)
            (other / "style.css").write_text("/*\\nTheme Name: Another Theme\\nAuthor: Codia Inc.\\n*/\\n", encoding="utf-8")
            scanned = target_scan.scan(project)
            self.assertEqual(scanned["selection_state"], "MULTIPLE_CANDIDATES")
            routes = target_scan.scope_rule_routes(project, scanned)
            self.assertEqual(routes["theme"]["local_rule_file"], "")
            self.assertEqual(routes["theme"]["local_selection"], "UNDETERMINED_THEME_SELECTION")
            self.assertEqual(routes["theme"]["related_theme_rule_candidates"], [])
            self.assertIn("docs/CURRENT_AUTHORITY.md", routes["project"]["project_docs"])
            self.assertNotIn("docs/THEME_RULES.md", routes["project"]["project_docs"])

    def test_real_projects_keep_theme_and_project_knowledge_isolated(self) -> None:
        budokan = ROOT / "projects" / "nipponbudokan"
        jwsnj = ROOT / "projects" / "jwsnj"
        for project in (budokan, jwsnj):
            self.assertTrue((project / "theme" / "style.css").is_file())
        budokan_scan = target_scan.scan(budokan)
        jwsnj_scan = target_scan.scan(jwsnj)
        self.assertEqual(budokan_scan["selection_state"], "UNAMBIGUOUS")
        self.assertEqual(jwsnj_scan["selection_state"], "UNAMBIGUOUS")
        self.assertEqual(budokan_scan["themes"][0]["lineage_hints"]["author_hint"], "Codia Inc.")
        self.assertEqual(jwsnj_scan["themes"][0]["lineage_hints"]["author_hint"], "Codia Inc.")
        compared = target_scan.compare_theme_lineages(jwsnj_scan, budokan_scan)
        self.assertTrue(compared["same_theme_author_hint"])
        self.assertEqual(compared["theme_baseline_binding"], "UNDETERMINED")
        self.assertIn("vite.config.mjs", jwsnj_scan["themes"][0]["lineage_hints"]["project_build_hints"])
        self.assertNotIn("vite.config.mjs", budokan_scan["themes"][0]["lineage_hints"]["project_build_hints"])
        b_routes = target_scan.scope_rule_routes(budokan, budokan_scan)
        j_routes = target_scan.scope_rule_routes(jwsnj, jwsnj_scan, related=[{
            "project": "nipponbudokan",
            "evidence_path": str(budokan / "theme"),
            **compared,
        }])
        self.assertEqual(b_routes["theme"]["local_rule_file"], "docs/THEME_RULES.md")
        self.assertNotIn("docs/THEME_RULES.md", b_routes["project"]["project_docs"])
        self.assertEqual(j_routes["theme"]["local_rule_file"], "")
        self.assertTrue(j_routes["theme"]["related_theme_rule_candidates"])
        self.assertEqual(j_routes["theme"]["related_theme_rule_candidates"][0]["selection"], "REVIEW_ONLY_NOT_APPLIED")

    def test_multiple_themes_are_not_silently_selected(self) -> None:
        r = {"themes": [{}, {}]}
        self.assertEqual(target_scan.compare_theme_lineages(r, r)["state"], "UNDETERMINED")


if __name__ == "__main__":
    unittest.main()
