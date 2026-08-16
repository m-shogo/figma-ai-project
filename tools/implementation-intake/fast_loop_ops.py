#!/usr/bin/env python3
"""Small operational CLI for Fast Loop evidence cache and experiment learning."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from statistics import fmean
from typing import Any

import fast_visual_qa as fvq


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_or(path: Path, default: Any) -> Any:
    return fvq.load(path) if path.is_file() else default


def put_cache(cache_path: Path, key: str, source_hash: str, value: Any) -> dict[str, Any]:
    cache = fvq.EvidenceCache(cache_path)
    cache.put(key, source_hash, value)
    cache.save()
    return {"key": key, "sourceHash": source_hash, "stored": True}


def plan_cache(cache_path: Path, items: list[dict[str, Any]], budget: int) -> dict[str, Any]:
    return fvq.reobservation_plan(items, fvq.EvidenceCache(cache_path), max(0, budget))


def record_experiment(
    ledger_path: Path,
    *,
    project_id: str,
    strategy: str,
    metrics: dict[str, Any],
    feedback: dict[str, Any],
    at: str | None = None,
) -> dict[str, Any]:
    ledger = load_or(ledger_path, {"version": 1, "entries": []})
    entry = {
        "at": at or now_iso(),
        "projectId": project_id,
        "measurement": fvq.strategy_measurement(strategy, metrics),
        "feedback": fvq.learning_feedback(feedback),
    }
    ledger.setdefault("version", 1)
    ledger.setdefault("entries", []).append(entry)
    fvq.save(ledger_path, ledger)
    return entry


def summarize_experiments(ledger: dict[str, Any]) -> dict[str, Any]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for entry in ledger.get("entries", []):
        measurement = entry.get("measurement") or {}
        strategy = str(measurement.get("strategy") or "unknown")
        grouped.setdefault(strategy, []).append(entry)

    strategies: dict[str, Any] = {}
    for strategy, entries in sorted(grouped.items()):
        metric_values: dict[str, list[float]] = {}
        helpful: dict[str, int] = {}
        wasted: dict[str, int] = {}
        late: dict[str, int] = {}
        rework: dict[str, int] = {}
        for entry in entries:
            metrics = (entry.get("measurement") or {}).get("metrics") or {}
            for key, value in metrics.items():
                if isinstance(value, (int, float)) and not isinstance(value, bool):
                    metric_values.setdefault(key, []).append(float(value))
            feedback = entry.get("feedback") or {}
            for source, target in (
                (feedback.get("helpfulQa") or [], helpful),
                (feedback.get("wastedQa") or [], wasted),
                (feedback.get("lateDiscoveries") or [], late),
                (feedback.get("reworkSections") or [], rework),
            ):
                for value in source:
                    target[str(value)] = target.get(str(value), 0) + 1
        strategies[strategy] = {
            "runs": len(entries),
            "meanMetrics": {key: round(fmean(values), 3) for key, values in sorted(metric_values.items()) if values},
            "helpfulQaCounts": helpful,
            "wastedQaCounts": wasted,
            "lateDiscoveryCounts": late,
            "reworkSectionCounts": rework,
        }
    return {
        "strategies": strategies,
        "totalRuns": sum(item["runs"] for item in strategies.values()),
        "interpretation": "observational; do not promote a universal QA strategy from small or non-comparable samples",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Fast Loop evidence-cache and strategy-learning operations")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("cache-put")
    p.add_argument("cache", type=Path)
    p.add_argument("--key", required=True)
    p.add_argument("--source-hash", required=True)
    p.add_argument("--value", type=Path, required=True)

    p = sub.add_parser("cache-plan")
    p.add_argument("cache", type=Path)
    p.add_argument("items", type=Path)
    p.add_argument("--budget", type=int, default=3)
    p.add_argument("--output", type=Path)

    p = sub.add_parser("record")
    p.add_argument("ledger", type=Path)
    p.add_argument("--project", required=True)
    p.add_argument("--strategy", required=True)
    p.add_argument("--metrics", type=Path, required=True)
    p.add_argument("--feedback", type=Path, required=True)
    p.add_argument("--at")

    p = sub.add_parser("summary")
    p.add_argument("ledger", type=Path)
    p.add_argument("--output", type=Path)

    args = parser.parse_args(argv)
    if args.command == "cache-put":
        result = put_cache(args.cache, args.key, args.source_hash, fvq.load(args.value))
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "cache-plan":
        result = plan_cache(args.cache, fvq.load(args.items), args.budget)
        if args.output:
            fvq.save(args.output, result)
        else:
            print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "record":
        result = record_experiment(
            args.ledger,
            project_id=args.project,
            strategy=args.strategy,
            metrics=fvq.load(args.metrics),
            feedback=fvq.load(args.feedback),
            at=args.at,
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "summary":
        result = summarize_experiments(load_or(args.ledger, {"version": 1, "entries": []}))
        if args.output:
            fvq.save(args.output, result)
        else:
            print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
