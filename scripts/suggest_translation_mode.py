#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
RANK = {"NONE": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if ROOT != path and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    if not path.is_file():
        raise ValueError(f"file does not exist: {value}")
    return path


def confidence(section: dict[str, Any], name: str) -> int:
    raw = str(section.get("signals", {}).get(name, {}).get("confidence", "NONE"))
    return RANK.get(raw, 0)


def suggest(section: dict[str, Any]) -> dict[str, Any]:
    components = confidence(section, "components")
    variables = confidence(section, "variables")
    auto_layout = confidence(section, "auto_layout")
    naming = confidence(section, "semantic_naming")
    code_connect = confidence(section, "code_connect")
    assets = confidence(section, "assets")
    responsive = confidence(section, "responsive_mapping")
    reuse = section.get("codebase_reuse_priority", [])
    weak = section.get("untrusted_or_missing_structure", [])

    structured_scores = [components, variables, auto_layout, naming]
    strong_count = sum(score >= RANK["MEDIUM"] for score in structured_scores)
    weak_count = sum(score <= RANK["LOW"] for score in structured_scores)

    reasons: list[str] = []
    cautions: list[str] = []

    # This is an advisory heuristic, never an automatic source of truth.
    if reuse and components <= RANK["LOW"] and code_connect <= RANK["LOW"]:
        mode = "CODEBASE_FIRST"
        reasons.append("existing production reuse priorities are explicit while Figma component mapping is weak")
    elif auto_layout >= RANK["MEDIUM"] and components >= RANK["MEDIUM"] and strong_count >= 2:
        mode = "STRUCTURE_FIRST"
        reasons.append("layout and component structure both have MEDIUM/HIGH confidence")
        if variables >= RANK["MEDIUM"]:
            reasons.append("Variables also provide structured token evidence")
        if code_connect >= RANK["MEDIUM"]:
            reasons.append("Code Connect strengthens production component mapping")
    elif weak_count >= 3 and weak:
        mode = "VISUAL_FIRST"
        reasons.append("most core Figma structure signals are NONE/LOW with explicit weak/missing structure evidence")
        if assets >= RANK["MEDIUM"]:
            reasons.append("exact assets can still be reused while layout is reconstructed")
    elif strong_count >= 1 or responsive >= RANK["MEDIUM"] or assets >= RANK["MEDIUM"]:
        mode = "HYBRID"
        reasons.append("some structured Figma evidence is usable but not strong enough for full structure-first translation")
    else:
        mode = "UNKNOWN"
        cautions.append("insufficient evidence; retrieve more targeted Figma/codebase context before selecting a mode")

    if mode == "STRUCTURE_FIRST" and naming <= RANK["LOW"]:
        cautions.append("semantic naming is weak; do not over-trust layer names")
    if mode in {"STRUCTURE_FIRST", "HYBRID"} and variables <= RANK["LOW"]:
        cautions.append("Variables are weak; verify token mapping against the production codebase")
    if responsive <= RANK["LOW"]:
        cautions.append("PC/SP structural mapping is weak; resolve section mapping before production execution")

    return {
        "section_id": section.get("section_id", ""),
        "suggested_mode": mode,
        "reasons": reasons,
        "cautions": cautions,
        "advisory_only": True,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Suggest per-section Figma translation modes from recorded evidence. Advisory only."
    )
    parser.add_argument("profile", help="Repository-relative Figma structure-profile YAML")
    parser.add_argument("--section", action="append", default=[], help="Limit output to section ID; repeatable")
    args = parser.parse_args()

    try:
        data = load_yaml(repo_path(args.profile))
        selected = set(args.section)
        suggestions = [
            suggest(section)
            for section in data.get("sections", [])
            if not selected or str(section.get("section_id", "")) in selected
        ]
    except Exception as exc:
        print(json.dumps({"ok": False, "errors": [str(exc)]}, ensure_ascii=False, indent=2))
        return 1

    print(
        json.dumps(
            {
                "ok": True,
                "profile": args.profile,
                "suggestions": suggestions,
                "note": "Suggestions are advisory. Preserve evidence and explicitly confirm the selected mode before READY/RUNNING.",
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
