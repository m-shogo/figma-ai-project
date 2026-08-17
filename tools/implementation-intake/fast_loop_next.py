#!/usr/bin/env python3
"""Optional Fast Loop capabilities activated by observed risk/evidence."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

LENGTH_RE = re.compile(r"^\s*(-?(?:\d+(?:\.\d+)?|\.\d+))\s*(px|rem|em|%|vw|vh|vmin|vmax|cqw|cqh|cqi|cqb|cqmin|cqmax)\s*$", re.I)
NUMBER_RE = re.compile(r"^\s*(-?(?:\d+(?:\.\d+)?|\.\d+))\s*$")
DECL_RE = re.compile(r"^\s*([-\+])\s*([A-Za-z-]+)\s*:\s*([^;]+);")
FILE_RE = re.compile(r"^\+\+\+\s+b/(.+)$")
SAFE_ID_RE = re.compile(r"[^A-Za-z0-9_.-]+")
FIGMA_ASSET_HOST = "www.figma.com"
FIGMA_ASSET_PREFIX = "/api/mcp/asset/"


def typed_css_value(value: str) -> dict[str, Any]:
    raw = str(value)
    match = LENGTH_RE.match(raw)
    if match:
        return {"kind": "length", "value": float(match.group(1)), "unit": match.group(2).lower(), "raw": raw}
    match = NUMBER_RE.match(raw)
    if match:
        return {"kind": "number", "value": float(match.group(1)), "unit": None, "raw": raw}
    lower = raw.strip().lower()
    if lower.startswith(("#", "rgb(", "rgba(", "hsl(")):
        return {"kind": "color", "value": lower, "unit": None, "raw": raw}
    return {"kind": "token", "value": raw.strip(), "unit": None, "raw": raw}


def compare_typed_css_values(expected: str, actual: str) -> dict[str, Any]:
    a, b = typed_css_value(expected), typed_css_value(actual)
    if a["kind"] != b["kind"]:
        return {"comparable": False, "reason": "different-kinds", "expected": a, "actual": b}
    if a["kind"] in {"length", "number"}:
        if a["unit"] != b["unit"]:
            return {"comparable": False, "reason": "unit-conversion-required", "expected": a, "actual": b}
        return {"comparable": True, "delta": b["value"] - a["value"], "unit": a["unit"], "expected": a, "actual": b}
    return {"comparable": True, "equal": a["value"] == b["value"], "expected": a, "actual": b}


def browser_qa_plan(risk_signals: list[str] | None = None, required_browsers: list[str] | None = None) -> dict[str, Any]:
    signals = {str(x).lower() for x in (risk_signals or [])}
    required = [str(x).lower() for x in (required_browsers or [])]
    browsers = ["chromium"]
    reasons: dict[str, list[str]] = {"chromium": ["canonical-fast-loop-browser"]}
    webkit_risks = {"safari", "webkit", "font", "svg", "sticky", "dvh", "svh", "form", "backdrop-filter", "mask"}
    firefox_risks = {"firefox", "grid", "subgrid", "form", "svg", "writing-mode", "scrollbar"}
    if signals & webkit_risks or "webkit" in required:
        browsers.append("webkit")
        reasons["webkit"] = sorted(signals & webkit_risks) or ["company-policy-required"]
    if signals & firefox_risks or "firefox" in required:
        browsers.append("firefox")
        reasons["firefox"] = sorted(signals & firefox_risks) or ["company-policy-required"]
    for name in required:
        if name in {"chromium", "webkit", "firefox"} and name not in browsers:
            browsers.append(name)
            reasons[name] = ["company-policy-required"]
    return {"browsers": browsers, "reasons": reasons, "mode": "risk-gated-cross-browser" if len(browsers) > 1 else "canonical-only"}


def interaction_state_plan(states: list[dict[str, Any]] | None) -> dict[str, Any]:
    rows = []
    for i, state in enumerate(states or []):
        state_id = str(state.get("id") or f"state-{i+1}")
        actions = state.get("actions") or []
        if not isinstance(actions, list):
            raise ValueError(f"{state_id}: actions must be a list")
        rows.append({"id": state_id, "actions": actions, "assertions": state.get("assertions") or [], "capture": state.get("capture", True)})
    if not rows:
        rows = [{"id": "default", "actions": [], "assertions": [], "capture": True}]
    return {"states": rows, "count": len(rows)}


def responsive_continuum_plan(minimum: int, maximum: int, known_breakpoints: list[int] | None = None, max_probes: int = 11) -> list[int]:
    if minimum <= 0 or maximum <= minimum:
        raise ValueError("invalid width range")
    points = {minimum, maximum}
    for bp in known_breakpoints or []:
        points.update(v for v in (bp - 1, bp, bp + 1) if minimum <= v <= maximum)
    while len(points) < max_probes:
        ordered = sorted(points)
        gaps = sorted(((b - a, a, b) for a, b in zip(ordered, ordered[1:])), reverse=True)
        if not gaps or gaps[0][0] <= 1:
            break
        _, a, b = gaps[0]
        points.add(round((a + b) / 2))
    return sorted(points)[:max_probes]


def responsive_transition_evidence(observations: list[dict[str, Any]]) -> dict[str, Any]:
    rows = sorted(observations, key=lambda x: (float(x.get("viewportWidth", 0)), float(x.get("containerWidth", 0))))
    transitions = []
    for prev, cur in zip(rows, rows[1:]):
        if prev.get("signature") == cur.get("signature"):
            continue
        vdelta = abs(float(cur.get("viewportWidth", 0)) - float(prev.get("viewportWidth", 0)))
        cdelta = abs(float(cur.get("containerWidth", 0)) - float(prev.get("containerWidth", 0)))
        cause = "container-driven" if vdelta <= 1 < cdelta else "viewport-driven" if cdelta <= 1 < vdelta else "mixed-or-undetermined"
        transitions.append({"from": prev.get("signature"), "to": cur.get("signature"), "viewport": [prev.get("viewportWidth"), cur.get("viewportWidth")], "container": [prev.get("containerWidth"), cur.get("containerWidth")], "cause": cause})
    return {"transitions": transitions, "count": len(transitions)}


def figma_instruction_evidence(payload: dict[str, Any]) -> dict[str, Any]:
    annotations, dev = payload.get("annotations"), payload.get("devResources")
    mapping, error = payload.get("codeConnect"), payload.get("codeConnectError")
    available = payload.get("codeConnectAvailable")
    code_state = "OBSERVED" if mapping else "UNDETERMINED" if error or available is False else "UNKNOWN"
    return {
        "annotations": {"state": "OBSERVED" if annotations else "UNKNOWN", "items": annotations or []},
        "devResources": {"state": "OBSERVED" if dev else "UNKNOWN", "items": dev or []},
        "codeConnect": {"state": code_state, "authority": "existing-code-component" if mapping else None, "items": mapping or [], "error": error},
        "variables": {"state": "OBSERVED" if payload.get("variables") else "UNKNOWN", "items": payload.get("variables") or {}},
        "autoLayout": {"state": "OBSERVED" if payload.get("autoLayout") else "UNKNOWN", "value": payload.get("autoLayout")},
        "rule": "UNKNOWN-and-UNDETERMINED-are-not-NONE",
    }


def font_provenance_diff(figma: dict[str, Any], runtime: dict[str, Any]) -> dict[str, Any]:
    expected = str(figma.get("family") or "").strip().lower()
    computed = str(runtime.get("computedFamily") or "").strip().lower()
    loaded = {str(x).strip().lower() for x in runtime.get("loadedFamilies") or []}
    family_match = bool(expected) and expected in computed
    loaded_match = bool(expected) and any(expected == item or expected in item for item in loaded)
    return {
        "expectedFamily": figma.get("family"),
        "computedFamily": runtime.get("computedFamily"),
        "familyMatch": family_match,
        "loadedMatch": loaded_match,
        "fallbackSuspected": bool(expected) and not family_match,
        "sources": runtime.get("fontFaceSources") or [],
        "nextAction": "inspect-font-loading-or-license-provenance" if expected and not family_match else "aligned-or-no-family-evidence",
    }


def repair_optimizer(baseline_score: float, candidates: list[dict[str, Any]], max_candidates: int = 5, min_gain: float = 0.05) -> dict[str, Any]:
    rows = []
    for candidate in candidates[:max_candidates]:
        score = float(candidate.get("score", baseline_score))
        runtime_ok = bool(candidate.get("runtimeOk", True))
        gain = baseline_score - score
        rows.append({**candidate, "gain": gain, "accepted": runtime_ok and gain >= min_gain})
    rows.sort(key=lambda x: (not x["accepted"], x.get("score", baseline_score)))
    best = next((x for x in rows if x["accepted"]), None)
    return {"baselineScore": baseline_score, "tested": len(rows), "maxCandidates": max_candidates, "best": best, "candidates": rows, "nextAction": "apply-best-measured-candidate" if best else "re-diagnose-no-bounded-candidate-earned-acceptance"}


def extract_css_adjustments(diff_text: str) -> list[dict[str, Any]]:
    current_file, pending_old, rows = None, {}, []
    for line in diff_text.splitlines():
        file_match = FILE_RE.match(line)
        if file_match:
            current_file, pending_old = file_match.group(1), {}
            continue
        match = DECL_RE.match(line)
        if not match or not current_file:
            continue
        sign, prop, value = match.groups()
        prop, value = prop.lower(), value.strip()
        if sign == "-":
            pending_old[prop] = value
        elif prop in pending_old and pending_old[prop] != value:
            rows.append({"file": current_file, "property": prop, "before": pending_old.pop(prop), "after": value, "kind": "human-final-adjustment"})
    return rows


def human_learning_record(diff_text: str, project_id: str, reference_id: str | None = None, author: str = "human", domain: str = "web-page") -> dict[str, Any]:
    changes = extract_css_adjustments(diff_text)
    return {"projectId": project_id, "referenceId": reference_id, "author": author, "domain": domain, "changes": changes, "changeCount": len(changes), "evidenceMaturity": "E1", "transferScope": "project-specific-until-repeated", "portablePromotion": False, "nextAction": "compare-with-ai-repair-history-and-repeat-before-promotion" if changes else "no-css-adjustment-evidence"}


def evidence_maturity(records: list[dict[str, Any]]) -> dict[str, Any]:
    if not records:
        return {"level": "E0", "portablePromotion": False, "reason": "no-local-evidence"}
    runs = {x.get("runId") for x in records if x.get("runId")}
    refs = {x.get("referenceId") for x in records if x.get("referenceId")}
    agents = {x.get("agent") for x in records if x.get("agent")}
    domains = {x.get("domain") for x in records if x.get("domain")}
    replay = any(bool(x.get("cleanReplay")) for x in records)
    level = "E5" if len(refs) >= 3 and len(runs) >= 4 and len(domains) >= 2 else "E4" if len(refs) >= 2 and len(runs) >= 3 else "E3" if len(runs) >= 2 or len(agents) >= 2 else "E2" if replay else "E1"
    return {"level": level, "portablePromotion": level == "E5", "projectDefaultEligible": level in {"E3", "E4", "E5"}, "counts": {"runs": len(runs), "references": len(refs), "agents": len(agents), "domains": len(domains)}, "rule": "one-success-or-failure-never-becomes-a-portable-global-rule"}


def validate_ephemeral_url(url: str) -> None:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != FIGMA_ASSET_HOST or not parsed.path.startswith(FIGMA_ASSET_PREFIX):
        raise ValueError("only the Figma MCP ephemeral asset endpoint is accepted")


def _sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def materialize_bytes(data: bytes, output_root: Path, logical_id: str, extension: str, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
    if not data:
        raise ValueError("cannot materialize empty bytes")
    logical = SAFE_ID_RE.sub("-", logical_id.strip()).strip("-._")
    if not logical:
        raise ValueError("invalid logical id")
    if not extension.startswith("."):
        extension = "." + extension
    digest = _sha(data)
    rel = Path("sha256") / digest[:2] / f"{digest}{extension.lower()}"
    dest = output_root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        dest.write_bytes(data)
    elif _sha(dest.read_bytes()) != digest:
        raise ValueError("content-address collision")
    record = {"logicalId": logical[:120], "sha256": digest, "sizeBytes": len(data), "path": rel.as_posix(), "extension": extension.lower(), "metadata": metadata or {}}
    if FIGMA_ASSET_PREFIX in json.dumps(record):
        raise ValueError("ephemeral asset URL leaked into record")
    return record


def materialize_file(source: Path, output_root: Path, logical_id: str, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
    return materialize_bytes(source.read_bytes(), output_root, logical_id, source.suffix or ".bin", metadata)


def download_ephemeral_from_env(env_name: str = "FIGMA_EPHEMERAL_ASSET_URL", timeout: int = 30) -> tuple[bytes, str]:
    url = os.environ.get(env_name, "")
    if not url:
        raise ValueError(f"missing environment variable: {env_name}")
    validate_ephemeral_url(url)
    req = urllib.request.Request(url, headers={"User-Agent": "figma-ai-project-asset-materializer/1"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        data = response.read()
        kind = (response.headers.get("Content-Type") or "").split(";", 1)[0].lower()
    extension = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif", "image/svg+xml": ".svg"}.get(kind, ".bin")
    return data, extension


def bridge_manifest(source_file: str, digest: str, task_id: str, repo: str, branch: str, path: str, overwrite: bool = False, commit_message: str | None = None, purpose: str | None = None) -> dict[str, Any]:
    if "/" in source_file or "\\" in source_file or ".." in source_file:
        raise ValueError("sourceFile must be a filename")
    if not re.fullmatch(r"[a-f0-9]{64}", digest):
        raise ValueError("invalid sha256")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo):
        raise ValueError("repo must be owner/name")
    if path.startswith("/") or ".." in Path(path).parts or "//" in path:
        raise ValueError("unsafe destination path")
    out: dict[str, Any] = {"version": 1, "taskId": task_id, "repo": repo, "branch": branch, "path": path, "sourceFile": source_file, "sha256": digest, "overwrite": bool(overwrite), "createdBy": "figma-ai-project", "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}
    if commit_message:
        out["commitMessage"] = commit_message[:300]
    if purpose:
        out["purpose"] = purpose[:500]
    return out


def plan_capabilities(contract: dict[str, Any]) -> dict[str, Any]:
    browser = browser_qa_plan(contract.get("riskSignals"), contract.get("requiredBrowsers"))
    states = interaction_state_plan(contract.get("interactionStates"))
    responsive = contract.get("responsiveContinuum")
    continuum = responsive_continuum_plan(int(responsive["min"]), int(responsive["max"]), [int(x) for x in responsive.get("knownBreakpoints", [])], int(responsive.get("maxProbes", 11))) if responsive else None
    figma = figma_instruction_evidence(contract.get("figmaEvidence") or {})
    interactive = states["count"] > 1 or any(row["actions"] for row in states["states"])
    semantic = bool(contract.get("semanticRisk") or interactive)
    activated = {"typed-css-evidence", "evidence-maturity"}
    if contract.get("traceOnFailure", True): activated.add("trace-on-failure")
    if interactive: activated.add("interaction-state-matrix")
    if semantic: activated.add("aria-semantic")
    if len(browser["browsers"]) > 1: activated.add("cross-browser-risk-gate")
    if contract.get("containerSelectors"): activated.add("container-responsive-evidence")
    if continuum: activated.add("responsive-continuum")
    if contract.get("assetMaterialization"): activated.add("asset-materializer")
    if contract.get("humanRepairLearning"): activated.add("human-repair-learning")
    if contract.get("repairCandidates"): activated.add("bounded-repair-optimizer")
    if contract.get("layoutShiftRisk", interactive): activated.add("layout-shift-recorder")
    if contract.get("fontRisk", True): activated.add("font-provenance")
    if figma["annotations"]["state"] == "OBSERVED" or figma["devResources"]["state"] == "OBSERVED": activated.add("figma-instruction-evidence")
    if figma["codeConnect"]["state"] == "OBSERVED": activated.add("code-connect-authority")
    advanced_capture = None
    if contract.get("implementation") and contract.get("viewport"):
        advanced_capture = {"implementation": contract["implementation"], "viewport": contract["viewport"], "browsers": browser["browsers"], "trace": {"onFailure": contract.get("traceOnFailure", True)}, "semantic": {"ariaSnapshot": semantic}, "fontProvenance": bool(contract.get("fontRisk", True)), "containerSelectors": contract.get("containerSelectors") or [], "states": states["states"]}
    return {"schemaVersion": 1, "kind": "fast-loop-next-capability-plan", "activated": sorted(activated), "browserPlan": browser, "interactionPlan": states, "responsiveWidths": continuum, "figmaEvidence": figma, "advancedCapture": advanced_capture, "policy": {"allOnByDefault": False, "failureTraceOnly": True, "oneRunCannotCreatePortableRule": True, "unknownIsNotNone": True}}


def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    plan = sub.add_parser("plan")
    plan.add_argument("contract")
    plan.add_argument("--output")

    mat = sub.add_parser("materialize-file")
    mat.add_argument("source")
    mat.add_argument("--output-root", required=True)
    mat.add_argument("--logical-id", required=True)

    env = sub.add_parser("materialize-env-url")
    env.add_argument("--env", default="FIGMA_EPHEMERAL_ASSET_URL")
    env.add_argument("--output-root", required=True)
    env.add_argument("--logical-id", required=True)
    env.add_argument("--extension")

    bridge = sub.add_parser("bridge-manifest")
    bridge.add_argument("--source-file", required=True)
    bridge.add_argument("--sha256", required=True)
    bridge.add_argument("--task-id", required=True)
    bridge.add_argument("--repo", required=True)
    bridge.add_argument("--branch", required=True)
    bridge.add_argument("--path", required=True)
    bridge.add_argument("--output")

    human = sub.add_parser("human-learning")
    human.add_argument("diff")
    human.add_argument("--project-id", required=True)
    human.add_argument("--reference-id")
    human.add_argument("--output")

    args = parser.parse_args()
    if args.command == "plan":
        result = plan_capabilities(json.loads(Path(args.contract).read_text()))
    elif args.command == "materialize-file":
        result = materialize_file(Path(args.source), Path(args.output_root), args.logical_id)
    elif args.command == "materialize-env-url":
        data, ext = download_ephemeral_from_env(args.env)
        result = materialize_bytes(data, Path(args.output_root), args.logical_id, args.extension or ext)
    elif args.command == "bridge-manifest":
        result = bridge_manifest(args.source_file, args.sha256, args.task_id, args.repo, args.branch, args.path)
    else:
        result = human_learning_record(Path(args.diff).read_text(), args.project_id, args.reference_id)

    payload = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    output = getattr(args, "output", None)
    if output:
        Path(output).write_text(payload)
    else:
        print(payload, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
