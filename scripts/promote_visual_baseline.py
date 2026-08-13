#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE_DIR = ROOT / "review-dashboard" / "baselines" / "ref001"
BASELINE_JSON = BASELINE_DIR / "baseline.json"
CURRENT_DIR = ROOT / "experiments" / "ref001-blind-clean-20260812" / "evidence" / "final" / "latest"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Promote current deterministic REF-001 captures to the human-approved regression baseline"
    )
    parser.add_argument("--approved-commit", required=True, help="Commit SHA explicitly approved by a human reviewer")
    parser.add_argument("--approved-after-pr", type=int, default=None, help="Optional PR number associated with approval")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not BASELINE_JSON.is_file():
        raise SystemExit(f"missing baseline registry: {BASELINE_JSON}")

    sources = {
        "pc": CURRENT_DIR / "first-pass-1380.png",
        "sp": CURRENT_DIR / "first-pass-375.png",
    }
    targets = {
        "pc": BASELINE_DIR / "web-pc.png",
        "sp": BASELINE_DIR / "web-sp.png",
    }
    for viewport, source in sources.items():
        if not source.is_file():
            raise SystemExit(f"missing current {viewport} deterministic capture: {source}")
        shutil.copy2(source, targets[viewport])

    payload = json.loads(BASELINE_JSON.read_text(encoding="utf-8"))
    payload["approved_source_commit"] = args.approved_commit
    payload["approved_after_pr"] = args.approved_after_pr
    payload["captures"] = {
        "pc": "review-dashboard/baselines/ref001/web-pc.png",
        "sp": "review-dashboard/baselines/ref001/web-sp.png",
    }
    policy = payload.setdefault("policy", {})
    policy["hard_gate"] = False
    policy["promotion_requires_human_approval"] = True
    BASELINE_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(
        "PASS promoted REF-001 visual baseline: "
        f"commit={args.approved_commit} pr={args.approved_after_pr or '-'}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
