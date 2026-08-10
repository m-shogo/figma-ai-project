#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RADAR = ROOT / "research/update-radar/latest.json"
AGENT_LANES = {"codex": "CODEX", "claude-code": "CLAUDE_CODE", "cursor": "CURSOR"}
BASE_LANES = {"FIGMA", "MCP", "WEB_PLATFORM", "ACCESSIBILITY"}


def load_yaml(path: Path) -> dict:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"expected object: {path}")
    return value


def load_json(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"expected object: {path}")
    return value


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def successful_sources(snapshot: dict, lane: str) -> list[dict]:
    return [
        row for row in snapshot.get("sources", [])
        if isinstance(row, dict) and row.get("lane") == lane
        and row.get("fingerprint") and not row.get("error")
    ]


def required_lanes(run: dict, snapshot: dict) -> set[str]:
    client = str(run.get("agent", {}).get("client", "")).strip().casefold()
    agent_lane = AGENT_LANES.get(client)
    if not agent_lane:
        raise ValueError(f"unsupported agent client for automated radar preflight: {client}")
    lanes = set(BASE_LANES) | {agent_lane}
    active = {str(value) for value in snapshot.get("active_lanes", [])}
    lanes |= active & {"SAFARI_WEBKIT", "CHROMIUM", "FIREFOX_GECKO"}
    return lanes


def apply(run: dict, snapshot: dict, radar_path: Path, max_age_hours: float) -> dict:
    generated_at = str(snapshot.get("generated_at", "")).strip()
    if not generated_at:
        raise ValueError("radar snapshot has no generated_at")
    age = (datetime.now(timezone.utc) - parse_time(generated_at)).total_seconds() / 3600
    if age > max_age_hours:
        raise ValueError(f"radar snapshot is stale: {age:.1f}h > {max_age_hours:.1f}h")

    lanes = required_lanes(run, snapshot)
    active = {str(value) for value in snapshot.get("active_lanes", [])}
    missing = sorted(lane for lane in lanes if lane not in active or not successful_sources(snapshot, lane))
    if missing:
        raise ValueError("required update lanes unavailable: " + ", ".join(missing))

    source_ids = {
        str(row.get("source_id")) for row in snapshot.get("sources", [])
        if isinstance(row, dict) and row.get("fingerprint") and not row.get("error")
    }
    if "figma-release-notes" not in source_ids:
        raise ValueError("Figma release notes were not fetched successfully")
    if not ({"figma-mcp-docs", "figma-mcp-tools"} & source_ids):
        raise ValueError("Figma MCP docs were not fetched successfully")

    warnings = [
        f"{row.get('source_id')}: {row.get('error')}"
        for row in snapshot.get("fetch_errors", []) if isinstance(row, dict)
    ]
    changes = [
        row for row in snapshot.get("changes", [])
        if isinstance(row, dict) and row.get("lane") in lanes
    ]
    rules_to_retest = sorted({
        str(category)
        for row in changes
        for category in row.get("retest_categories", [])
        if str(category).strip()
    })

    preflight = dict(run.get("tooling_preflight", {}))
    preflight.update({
        "mode": "AUTOMATED_UPDATE_RADAR",
        "checked_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "update_radar_path": radar_path.resolve().relative_to(ROOT).as_posix(),
        "update_radar_sha256": file_hash(radar_path),
        "update_radar_generated_at": generated_at,
        "update_radar_max_age_hours": max_age_hours,
        "official_sources_complete": True,
        "active_lanes": sorted(lanes),
        "source_warnings": warnings,
        "figma_release_notes_checked": True,
        "figma_mcp_docs_checked": True,
        "agent_docs_checked": True,
        "community_scan_checked": False,
        "changes_relevant_to_run": changes,
        "rules_to_retest": rules_to_retest,
        "blockers_or_limits": [],
    })
    updated = dict(run)
    updated["tooling_preflight"] = preflight
    return updated


def atomic_write(path: Path, value: dict) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            yaml.safe_dump(value, handle, sort_keys=False, allow_unicode=True)
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("run_record", type=Path)
    parser.add_argument("--radar", type=Path, default=DEFAULT_RADAR)
    parser.add_argument("--max-age-hours", type=float, default=36.0)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    run_path = args.run_record if args.run_record.is_absolute() else ROOT / args.run_record
    radar_path = args.radar if args.radar.is_absolute() else ROOT / args.radar
    updated = apply(load_yaml(run_path), load_json(radar_path), radar_path, args.max_age_hours)
    if args.apply:
        atomic_write(run_path, updated)
        print(f"UPDATED {run_path.relative_to(ROOT)}")
    else:
        print(f"DRY-RUN {run_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())