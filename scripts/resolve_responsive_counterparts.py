#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path
from typing import Any

import yaml

DEVICE_WORDS = {
    "pc", "desktop", "web", "sp", "mobile", "mob", "phone",
    "prototype", "design", "screen", "view", "frame",
}
GENERIC_WORDS = {
    "frame", "group", "rectangle", "image", "img", "pic", "bg", "inner",
    "container", "wrapper", "content", "contents", "main", "component",
    "instance", "layer", "auto", "layout",
}


def load_data(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    value = json.loads(text) if path.suffix.lower() == ".json" else yaml.safe_load(text)
    if not isinstance(value, dict):
        raise ValueError("top-level input must be an object")
    return value


def normalize_text(value: Any) -> list[str]:
    text = str(value or "").lower().replace("_", " ").replace("-", " ").replace("/", " ")
    tokens = re.findall(r"[\w\u3040-\u30ff\u3400-\u9fff]+", text, flags=re.UNICODE)
    return [t for t in tokens if len(t) > 1 and t not in DEVICE_WORDS and t not in GENERIC_WORDS]


def canonical_name(frame: dict[str, Any]) -> str:
    return " ".join(normalize_text(frame.get("name", "")))


def token_set(frame: dict[str, Any]) -> set[str]:
    tokens: set[str] = set(normalize_text(frame.get("name", "")))
    for item in frame.get("semantic_tokens", []) or []:
        if isinstance(item, dict):
            item = item.get("token", "")
        tokens.update(normalize_text(item))
    for item in frame.get("text_samples", []) or []:
        tokens.update(normalize_text(item))
    for item in frame.get("descendant_names", []) or []:
        tokens.update(normalize_text(item))
    return tokens


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def ratio_similarity(a: float | None, b: float | None) -> float:
    if not a or not b or a <= 0 or b <= 0:
        return 0.0
    ratio = min(a, b) / max(a, b)
    return max(0.0, min(1.0, ratio))


def order_similarity(a: int | None, a_count: int, b: int | None, b_count: int) -> float:
    if a is None or b is None or a_count <= 1 or b_count <= 1:
        return 0.0
    pa = a / (a_count - 1)
    pb = b / (b_count - 1)
    return max(0.0, 1.0 - abs(pa - pb))


def score_pair(pc: dict[str, Any], sp: dict[str, Any], pc_count: int, sp_count: int) -> tuple[float, list[str]]:
    evidence: list[str] = []
    score = 0.0

    pc_name = canonical_name(pc)
    sp_name = canonical_name(sp)
    if pc_name and sp_name and pc_name == sp_name:
        # A device suffix/prefix-only difference such as join vs join_sp is strong
        # evidence, but margin still prevents duplicate names from being auto-selected.
        score += 0.72
        evidence.append("canonical_name_exact")
    else:
        name_sim = jaccard(set(pc_name.split()), set(sp_name.split()))
        if name_sim:
            score += 0.28 * name_sim
            evidence.append(f"name_tokens={name_sim:.2f}")

    semantic = jaccard(token_set(pc), token_set(sp))
    if semantic:
        score += 0.34 * semantic
        evidence.append(f"semantic_tokens={semantic:.2f}")

    family_pc = " ".join(normalize_text(pc.get("page_family_hint", "")))
    family_sp = " ".join(normalize_text(sp.get("page_family_hint", "")))
    if family_pc and family_sp and family_pc == family_sp:
        score += 0.28
        evidence.append("page_family_hint_exact")

    order_sim = order_similarity(pc.get("order"), pc_count, sp.get("order"), sp_count)
    if order_sim:
        score += 0.08 * order_sim
        evidence.append(f"order={order_sim:.2f}")

    h_sim = ratio_similarity(pc.get("height"), sp.get("height"))
    if h_sim:
        score += 0.04 * math.sqrt(h_sim)
        evidence.append(f"height_ratio={h_sim:.2f}")

    return min(1.0, score), evidence


def confidence(score: float, margin: float) -> str:
    if score >= 0.78 and margin >= 0.15:
        return "HIGH"
    if score >= 0.55 and margin >= 0.08:
        return "MEDIUM"
    return "LOW"


def resolve(data: dict[str, Any]) -> dict[str, Any]:
    frames = data.get("frames", [])
    if not isinstance(frames, list):
        raise ValueError("frames must be an array")
    pcs = [f for f in frames if isinstance(f, dict) and f.get("page_role") == "PC"]
    sps = [f for f in frames if isinstance(f, dict) and f.get("page_role") == "SP"]
    if not pcs or not sps:
        raise ValueError("input must contain at least one PC and one SP frame")

    matches: list[dict[str, Any]] = []
    for pc in pcs:
        ranked: list[tuple[float, dict[str, Any], list[str]]] = []
        for sp in sps:
            score, evidence = score_pair(pc, sp, len(pcs), len(sps))
            ranked.append((score, sp, evidence))
        ranked.sort(key=lambda item: item[0], reverse=True)
        best_score, best_sp, best_evidence = ranked[0]
        second = ranked[1][0] if len(ranked) > 1 else 0.0
        margin = best_score - second
        conf = confidence(best_score, margin)
        matches.append({
            "pc_node_id": pc.get("node_id"),
            "pc_name": pc.get("name"),
            "sp_node_id": best_sp.get("node_id"),
            "sp_name": best_sp.get("name"),
            "score": round(best_score, 4),
            "margin": round(margin, 4),
            "confidence": conf,
            "decision": "AUTO_CANDIDATE" if conf == "HIGH" else ("INSPECT_MORE" if conf == "MEDIUM" else "HUMAN_REVIEW"),
            "evidence": best_evidence,
            "alternatives": [
                {"sp_node_id": sp.get("node_id"), "sp_name": sp.get("name"), "score": round(score, 4)}
                for score, sp, _ in ranked[1:4]
            ],
        })

    return {
        "schema_version": 1,
        "reference_id": data.get("reference_id", ""),
        "policy": {
            "high": "may be used as an automatic candidate, but remains evidence rather than Figma truth until runtime/visual checks agree",
            "medium": "inspect Figma descendants/text/components/screenshots before deciding",
            "low": "keep UNDETERMINED and request human input only if further observation cannot resolve it",
        },
        "matches": matches,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Rank likely PC/SP Figma frame counterparts from observed frame fingerprints")
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = resolve(load_data(args.input))
    rendered = yaml.safe_dump(result, sort_keys=False, allow_unicode=True)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
