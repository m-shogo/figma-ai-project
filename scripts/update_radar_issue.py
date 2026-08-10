#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LATEST_JSON = ROOT / "research" / "update-radar" / "latest.json"
LATEST_MD = ROOT / "research" / "update-radar" / "latest.md"
ISSUE_TITLE = "[AUTO] Update Radar — RETEST candidates"
AUTO_MARKER = "<!-- figma-ai-project:update-radar -->"


def run_gh(*args: str, input_text: str | None = None) -> str:
    env = dict(os.environ)
    if not env.get("GH_TOKEN"):
        raise RuntimeError("GH_TOKEN is required")
    completed = subprocess.run(
        ["gh", *args],
        cwd=ROOT,
        env=env,
        text=True,
        input=input_text,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or completed.stdout.strip() or "gh command failed")
    return completed.stdout.strip()


def load_snapshot() -> dict:
    if not LATEST_JSON.is_file():
        raise RuntimeError(f"missing radar snapshot: {LATEST_JSON}")
    value = json.loads(LATEST_JSON.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise RuntimeError("latest radar snapshot must be a JSON object")
    return value


def find_open_issue() -> int | None:
    raw = run_gh("issue", "list", "--state", "open", "--limit", "100", "--json", "number,title")
    rows = json.loads(raw or "[]")
    for row in rows:
        if row.get("title") == ISSUE_TITLE:
            return int(row["number"])
    return None


def body(snapshot: dict) -> str:
    report = LATEST_MD.read_text(encoding="utf-8") if LATEST_MD.is_file() else ""
    summary = snapshot.get("summary", {})
    preamble = "\n".join(
        [
            AUTO_MARKER,
            "This issue is maintained automatically by `.github/workflows/update-radar.yml`.",
            "Do not turn a source update directly into Company Policy. Changed sources are RETEST candidates until reproduced against the active environment contract.",
            "",
            f"Changed sources: **{summary.get('changed_count', 0)}** · Fetch errors: **{summary.get('error_count', 0)}**",
            "",
        ]
    )
    return preamble + report


def main() -> int:
    snapshot = load_snapshot()
    summary = snapshot.get("summary", {})
    changed = int(summary.get("changed_count", 0) or 0)
    errors = int(summary.get("error_count", 0) or 0)

    # Initial fingerprint seeding is intentionally quiet. The rolling issue exists only
    # when there is an actual upstream change or a broken source that needs attention.
    if changed == 0 and errors == 0:
        print("RADAR_ISSUE no actionable changes")
        return 0

    issue = find_open_issue()
    issue_body = body(snapshot)
    if issue is None:
        created = run_gh("issue", "create", "--title", ISSUE_TITLE, "--body", issue_body)
        print(f"RADAR_ISSUE created {created}")
    else:
        run_gh("issue", "edit", str(issue), "--body", issue_body)
        print(f"RADAR_ISSUE updated #{issue}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"RADAR_ISSUE_ERROR {type(exc).__name__}: {exc}", file=sys.stderr)
        raise SystemExit(1)
