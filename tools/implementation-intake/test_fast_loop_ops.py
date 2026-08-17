#!/usr/bin/env python3
from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import fast_loop_ops as ops
import fast_visual_qa as fvq


class FastLoopOpsTests(unittest.TestCase):
    def test_cache_put_and_plan_reuse_unchanged_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            cache_path = Path(tmp) / "cache.json"
            ops.put_cache(cache_path, "figma:hero", "rev-1", {"height": 400})
            plan = ops.plan_cache(cache_path, [
                {"key": "figma:hero", "sourceHash": "rev-1"},
                {"key": "figma:news", "sourceHash": "rev-2"},
            ], 1)
            self.assertEqual(["figma:hero"], plan["reuse"])
            self.assertEqual(["figma:news"], plan["observe"])

    def test_changed_source_hash_invalidates_cache(self):
        with tempfile.TemporaryDirectory() as tmp:
            cache_path = Path(tmp) / "cache.json"
            ops.put_cache(cache_path, "repo:header", "sha-1", {"files": ["header.php"]})
            plan = ops.plan_cache(cache_path, [{"key": "repo:header", "sourceHash": "sha-2"}], 1)
            self.assertEqual([], plan["reuse"])
            self.assertEqual(["repo:header"], plan["observe"])

    def test_record_keeps_only_small_strategy_metrics(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = Path(tmp) / "ledger.json"
            entry = ops.record_experiment(
                ledger,
                project_id="fixture-a",
                strategy="section-first",
                metrics={"implementationSeconds": 90, "repairCount": 2, "giantDebugPayload": "drop-me"},
                feedback={"helpfulQa": ["section-boundary"], "wastedQa": ["deep-text-probe"]},
                at="2026-08-15T00:00:00Z",
            )
            self.assertNotIn("giantDebugPayload", entry["measurement"]["metrics"])
            self.assertEqual(["section-boundary"], entry["feedback"]["helpfulQa"])
            self.assertTrue(ledger.is_file())

    def test_summary_compares_observed_strategy_means_without_declaring_winner(self):
        ledger = {"version": 1, "entries": [
            {
                "measurement": fvq.strategy_measurement("section-first", {"implementationSeconds": 100, "repairCount": 2, "finalVisualScore": 96}),
                "feedback": fvq.learning_feedback({"helpfulQa": ["section-boundary"], "reworkSections": ["hero"]}),
            },
            {
                "measurement": fvq.strategy_measurement("section-first", {"implementationSeconds": 80, "repairCount": 1, "finalVisualScore": 98}),
                "feedback": fvq.learning_feedback({"helpfulQa": ["section-boundary"], "wastedQa": ["deep-probe"]}),
            },
            {
                "measurement": fvq.strategy_measurement("full-first-repair", {"implementationSeconds": 130, "repairCount": 4, "finalVisualScore": 95}),
                "feedback": fvq.learning_feedback({"lateDiscoveries": ["shared-container"]}),
            },
        ]}
        summary = ops.summarize_experiments(ledger)
        self.assertEqual(2, summary["strategies"]["section-first"]["runs"])
        self.assertEqual(90.0, summary["strategies"]["section-first"]["meanMetrics"]["implementationSeconds"])
        self.assertEqual(2, summary["strategies"]["section-first"]["helpfulQaCounts"]["section-boundary"])
        self.assertNotIn("winner", summary)
        self.assertIn("do not promote", summary["interpretation"])

    def test_empty_ledger_summary_is_valid(self):
        summary = ops.summarize_experiments({"version": 1, "entries": []})
        self.assertEqual(0, summary["totalRuns"])
        self.assertEqual({}, summary["strategies"])


if __name__ == "__main__":
    unittest.main()
