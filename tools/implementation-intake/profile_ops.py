#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import json
import re
from pathlib import Path
from typing import Any

import intake

SENSITIVE_KEY = re.compile(r"(secret|token|password|passwd|license.?key|api.?key|private.?key|authorization|cookie)", re.I)


def redact(value: Any, path: str = "") -> tuple[Any, list[str]]:
    findings: list[str] = []
    if isinstance(value, dict):
        out = {}
        for key, child in value.items():
            child_path = f"{path}.{key}" if path else key
            if SENSITIVE_KEY.search(str(key)):
                out[key] = "<redacted>"
                findings.append(child_path)
            else:
                out[key], child_findings = redact(child, child_path)
                findings.extend(child_findings)
        return out, findings
    if isinstance(value, list):
        out = []
        for idx, child in enumerate(value):
            clean, child_findings = redact(child, f"{path}[{idx}]")
            out.append(clean); findings.extend(child_findings)
        return out, findings
    if isinstance(value, str) and re.search(r"https?://[^/\s:@]+:[^/\s@]+@", value):
        findings.append(path)
        return "<redacted-url-credentials>", findings
    return value, findings


def three_way_value(base: Any, left: Any, right: Any) -> tuple[Any, bool]:
    if left == right:
        return copy.deepcopy(left), False
    if left == base:
        return copy.deepcopy(right), False
    if right == base:
        return copy.deepcopy(left), False
    return copy.deepcopy(base), True


def index_by_id(items: list[Any]) -> dict[str, Any]:
    return {item.get("id"): item for item in items if isinstance(item, dict) and isinstance(item.get("id"), str)}


def merge_profiles(base: dict[str, Any], left: dict[str, Any], right: dict[str, Any]) -> dict[str, Any]:
    merged = copy.deepcopy(base)
    conflicts: list[dict[str, Any]] = []
    merged["answers"] = {}
    keys = sorted(set(base.get("answers", {})) | set(left.get("answers", {})) | set(right.get("answers", {})))
    for key in keys:
        value, conflict = three_way_value(base.get("answers", {}).get(key), left.get("answers", {}).get(key), right.get("answers", {}).get(key))
        if conflict:
            conflicts.append({"path": f"answers.{key}", "base": base.get("answers", {}).get(key), "left": left.get("answers", {}).get(key), "right": right.get("answers", {}).get(key)})
        elif value is not None:
            merged["answers"][key] = value

    b, l, r = index_by_id(base.get("collections", [])), index_by_id(left.get("collections", [])), index_by_id(right.get("collections", []))
    collections = []
    for key in sorted(set(b) | set(l) | set(r)):
        value, conflict = three_way_value(b.get(key), l.get(key), r.get(key))
        if conflict:
            conflicts.append({"path": f"collections.{key}", "base": b.get(key), "left": l.get(key), "right": r.get(key)})
        elif value is not None:
            collections.append(value)
    merged["collections"] = collections

    # Append-only ledgers are unioned rather than overwritten.
    for ledger in ("decisionHistory", "overrideLedger"):
        seen: set[str] = set(); rows = []
        for source in (base, left, right):
            for row in source.get(ledger, []):
                marker = json.dumps(row, ensure_ascii=False, sort_keys=True)
                if marker not in seen:
                    seen.add(marker); rows.append(copy.deepcopy(row))
        if rows:
            merged[ledger] = rows
    return {"merged": merged, "conflicts": conflicts, "pass": not conflicts}


def compatibility(profile: dict[str, Any]) -> dict[str, Any]:
    version = profile.get("version")
    known = {1}
    return {
        "version": version,
        "supported": version in known,
        "action": "use-as-is" if version in known else "migration-required",
        "principle": "Unknown top-level fields must be preserved by migrations and profile operations.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Safe operations for implementation profiles")
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("sanitize"); p.add_argument("profile"); p.add_argument("--output", required=True)
    p = sub.add_parser("merge"); p.add_argument("base"); p.add_argument("left"); p.add_argument("right"); p.add_argument("--output", required=True)
    p = sub.add_parser("compat"); p.add_argument("profile"); p.add_argument("--output")
    args = parser.parse_args()
    if args.command == "sanitize":
        profile = intake.load_json(Path(args.profile)); clean, findings = redact(profile); intake.write_json(Path(args.output), {"profile": clean, "redactedPaths": findings, "safe": not findings}); return 2 if findings else 0
    if args.command == "merge":
        result = merge_profiles(intake.load_json(Path(args.base)), intake.load_json(Path(args.left)), intake.load_json(Path(args.right))); intake.write_json(Path(args.output), result); return 3 if result["conflicts"] else 0
    result = compatibility(intake.load_json(Path(args.profile)))
    if args.output: intake.write_json(Path(args.output), result)
    else: print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["supported"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
