#!/usr/bin/env python3
from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import component_candidates as cc
import fast_visual_qa as fvq


class ComponentCandidateTests(unittest.TestCase):
    def fixture(self):
        tmp = tempfile.TemporaryDirectory()
        root = Path(tmp.name)
        files = {
            "src/components/CampaignHero.tsx": "export function CampaignHero(){ return <section>campaign hero banner</section> }",
            "src/components/Footer.tsx": "export function Footer(){ return <footer>footer</footer> }",
            "src/blocks/HeroCard.php": "<?php // hero card ?>",
            "experiments/ref/v2/Hero.tsx": "export const Hero = () => 'protected hero';",
            "legacy/Hero.php": "<?php // legacy hero ?>",
        }
        for index in range(30):
            files[f"vendor/package-{index}/Hero.js"] = "export const Hero = 'unrelated vendor';"
        for relative, content in files.items():
            path = root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
        return tmp, root

    def scope(self):
        return {
            "include": ["src/**", "experiments/**"],
            "exclude": ["legacy/**", "vendor/**"],
            "protected": ["experiments/ref/v2/**", "experiments/ref/v3/**"],
        }

    def test_discovery_finds_scoped_candidate_without_auto_reuse(self):
        tmp, root = self.fixture()
        try:
            result = cc.discover_candidates(root, "Campaign Hero", self.scope())
            self.assertEqual("src/components/CampaignHero.tsx", result["candidates"][0]["path"])
            self.assertEqual("compatibility-observation-required", result["decision"])
            self.assertTrue(result["candidates"][0]["requiresCompatibilityObservation"])
        finally:
            tmp.cleanup()

    def test_protected_directory_is_pruned_before_file_read(self):
        tmp, root = self.fixture()
        try:
            result = cc.discover_candidates(root, "Hero", self.scope())
            self.assertIn("experiments/ref/v2", result["scan"]["protectedRootsSkipped"])
            self.assertNotIn("experiments/ref/v2/Hero.tsx", result["scan"]["filesRead"])
            self.assertNotIn("legacy/Hero.php", result["scan"]["filesRead"])
        finally:
            tmp.cleanup()

    def test_include_prefix_avoids_unrelated_repo_walk(self):
        tmp, root = self.fixture()
        try:
            result = cc.discover_candidates(root, "Hero", {"include": ["src/**"], "exclude": [], "protected": []})
            self.assertEqual(["src"], result["scan"]["roots"])
            self.assertLessEqual(result["scan"]["filesystemFilesVisited"], 3)
            self.assertTrue(all(not path.startswith("vendor/") for path in result["scan"]["filesRead"]))
        finally:
            tmp.cleanup()

    def test_alias_can_recover_project_naming_difference(self):
        tmp, root = self.fixture()
        try:
            result = cc.discover_candidates(root, "Main Visual", self.scope(), aliases=["campaign hero"])
            paths = [item["path"] for item in result["candidates"]]
            self.assertIn("src/components/CampaignHero.tsx", paths)
        finally:
            tmp.cleanup()

    def test_candidate_budget_stops_selected_file_scan(self):
        tmp, root = self.fixture()
        try:
            result = cc.discover_candidates(root, "Hero", self.scope(), max_files=1)
            self.assertLessEqual(len(result["scan"]["filesRead"]), 1)
            self.assertTrue(result["scan"]["truncatedByBudget"])
        finally:
            tmp.cleanup()

    def test_filesystem_scan_budget_is_explicit(self):
        tmp, root = self.fixture()
        try:
            result = cc.discover_candidates(root, "Hero", {"include": ["**/*"], "exclude": [], "protected": []}, max_files=200, max_scan_files=4)
            self.assertLessEqual(result["scan"]["filesystemFilesVisited"], 4)
            self.assertTrue(result["scan"]["truncatedByBudget"])
        finally:
            tmp.cleanup()

    def test_discovery_then_compatibility_mapping_keeps_name_separate_from_reuse(self):
        discovery = {"name": "Hero", "visual": 0.96, "semantic": 0.4, "behavior": 0.95}
        compatible = {"name": "CampaignHero", "visual": 0.88, "semantic": 0.9, "behavior": 0.9}
        result = fvq.map_component([discovery, compatible])
        self.assertEqual("reuse", result["decision"])
        self.assertEqual("CampaignHero", result["best"]["name"])


if __name__ == "__main__":
    unittest.main()
