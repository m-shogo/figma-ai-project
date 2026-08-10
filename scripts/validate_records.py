#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
REFERENCE_SCHEMA = ROOT / "schemas" / "reference.schema.json"
SHARED_SCHEMA = ROOT / "schemas" / "shared-contract.schema.json"
SECTION_SCHEMA = ROOT / "schemas" / "section.schema.json"
RUN_SCHEMA = ROOT / "schemas" / "run.schema.json"


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def fmt_path(parts: list[Any]) -> str:
    if not parts:
        return "<root>"
    output = ""
    for part in parts:
        output += f"[{part}]" if isinstance(part, int) else (("." if output else "") + str(part))
    return output


def validate_schema(data: dict[str, Any], schema: dict[str, Any]) -> list[str]:
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(data), key=lambda error: list(error.absolute_path))
    return [f"{fmt_path(list(error.absolute_path))}: {error.message}" for error in errors]


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if ROOT != path and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    return path


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def semantic_reference_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    freeze = data.get("freeze", {})
    if freeze.get("ready"):
        if data.get("status") != "REFERENCE_READY":
            errors.append("freeze.ready=true requires status=REFERENCE_READY")
        if not data.get("frames"):
            errors.append("REFERENCE_READY requires at least one frozen frame")
        figma = data.get("figma", {})
        if not figma.get("file_key"):
            errors.append("REFERENCE_READY requires figma.file_key")
        if not figma.get("node_ids"):
            errors.append("REFERENCE_READY requires at least one figma.node_ids entry")
        if not data.get("code_baseline", {}).get("starting_commit"):
            errors.append("REFERENCE_READY requires code_baseline.starting_commit")
        for i, frame in enumerate(data.get("frames", [])):
            if frame.get("figma_width") is None:
                errors.append(f"frames[{i}].figma_width is required when reference is ready")
            if frame.get("acceptance_viewport", {}).get("width") is None:
                errors.append(f"frames[{i}].acceptance_viewport.width is required when reference is ready")
    return errors


def semantic_shared_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    freeze = data.get("freeze", {})
    if not freeze.get("ready"):
        return errors

    if data.get("status") != "FROZEN":
        errors.append("freeze.ready=true requires shared contract status=FROZEN")

    codebase = data.get("codebase", {})
    foundation = data.get("foundation", {})
    breakpoints = data.get("breakpoints", {})
    parallel = data.get("parallel_execution", {})

    if not codebase.get("starting_commit"):
        errors.append("frozen shared contract requires codebase.starting_commit")
    if foundation.get("status") != "VERIFIED":
        errors.append("frozen shared contract requires foundation.status=VERIFIED")
    if not foundation.get("commit"):
        errors.append("frozen shared contract requires foundation.commit")
    if not foundation.get("base_commit"):
        errors.append("frozen shared contract requires foundation.base_commit")
    if codebase.get("starting_commit") and foundation.get("base_commit"):
        if codebase["starting_commit"] != foundation["base_commit"]:
            errors.append("foundation.base_commit must equal codebase.starting_commit")

    if breakpoints.get("mode") == "UNKNOWN":
        errors.append("frozen shared contract cannot keep breakpoints.mode=UNKNOWN")
    if breakpoints.get("mode") in {"GLOBAL_SPECIFIED", "SECTION_SPECIFIED"}:
        if breakpoints.get("source") == "UNKNOWN":
            errors.append("specified breakpoints require a non-UNKNOWN source")
        if not breakpoints.get("values"):
            errors.append("specified breakpoints require at least one breakpoint value")

    if parallel.get("shared_files_read_only_for_workers") is not True:
        errors.append("frozen shared contract requires shared files to be read-only for section workers")
    return errors


def load_linked_shared_contract(data: dict[str, Any]) -> tuple[Path | None, dict[str, Any] | None, list[str]]:
    errors: list[str] = []
    value = data.get("shared_contract", "")
    if not value:
        return None, None, errors
    try:
        path = repo_path(value)
    except ValueError as exc:
        return None, None, [str(exc)]
    if not path.is_file():
        return path, None, [f"shared_contract does not exist: {value}"]
    try:
        contract = load_yaml(path)
    except Exception as exc:
        return path, None, [f"cannot load shared_contract {value}: {exc}"]
    return path, contract, errors


def semantic_section_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    sections = data.get("sections", [])
    ids = [section.get("section_id") for section in sections]
    if len(ids) != len(set(ids)):
        errors.append("section_id values must be unique")
    orders = [section.get("order") for section in sections]
    if len(orders) != len(set(orders)):
        errors.append("section order values must be unique")

    active_statuses = {"READY", "RUNNING", "COMPLETE"}
    active = [section for section in sections if section.get("worker", {}).get("status") in active_statuses]
    contract_path, contract, link_errors = load_linked_shared_contract(data)
    errors.extend(link_errors)

    if data.get("shared_contract_sha256"):
        if contract_path and contract_path.is_file():
            actual = file_sha256(contract_path)
            if actual != data["shared_contract_sha256"]:
                errors.append("shared_contract_sha256 does not match the linked shared contract")
    elif active:
        errors.append("active section workers require shared_contract_sha256")

    if active and not data.get("foundation_commit"):
        errors.append("active section workers require foundation_commit")
    if active and contract is None:
        errors.append("active section workers require a readable shared_contract")

    if contract is not None:
        if contract.get("reference_id") != data.get("reference_id"):
            errors.append("section manifest reference_id must match shared contract reference_id")
        if active:
            if contract.get("status") != "FROZEN" or contract.get("freeze", {}).get("ready") is not True:
                errors.append("active section workers require a frozen shared contract")
            contract_foundation = contract.get("foundation", {}).get("commit")
            if contract_foundation != data.get("foundation_commit"):
                errors.append("section manifest foundation_commit must match shared contract foundation.commit")

    global_breakpoints = bool(contract and contract.get("breakpoints", {}).get("mode") == "GLOBAL_SPECIFIED")

    for i, section in enumerate(sections):
        worker = section.get("worker", {})
        status = worker.get("status")
        if status not in active_statuses:
            continue
        implementation = section.get("implementation", {})
        responsive = section.get("responsive", {})

        if implementation.get("shared_files_read_only") is not True:
            errors.append(f"sections[{i}] active worker requires shared_files_read_only=true")
        if not implementation.get("allowed_paths"):
            errors.append(f"sections[{i}] active worker requires non-empty allowed_paths")
        if worker.get("base_commit") != data.get("foundation_commit"):
            errors.append(f"sections[{i}] worker.base_commit must equal foundation_commit")
        if status == "COMPLETE" and not worker.get("output_commit"):
            errors.append(f"sections[{i}] COMPLETE worker requires output_commit")
        if global_breakpoints and responsive.get("uses_shared_breakpoints") is not True:
            errors.append(f"sections[{i}] must use shared breakpoints from the global contract")

    return errors


def semantic_run_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []

    status = data.get("status")
    if status in {"RUNNING", "COMPLETE"}:
        preflight = data.get("tooling_preflight", {})
        required_checks = (
            "figma_release_notes_checked",
            "figma_mcp_docs_checked",
            "agent_docs_checked",
            "community_scan_checked",
        )
        if not preflight.get("checked_at"):
            errors.append("RUNNING/COMPLETE run requires tooling_preflight.checked_at")
        for check in required_checks:
            if preflight.get(check) is not True:
                errors.append(f"RUNNING/COMPLETE run requires tooling_preflight.{check}=true")

    execution = data.get("execution", {})
    actual = execution.get("actual_repair_rounds", 0)
    maximum = execution.get("max_repair_rounds", 0)
    if actual > maximum:
        errors.append("execution.actual_repair_rounds cannot exceed max_repair_rounds")
    if data.get("rework", {}).get("repair_rounds") != actual:
        errors.append("rework.repair_rounds must equal execution.actual_repair_rounds")

    scores = data.get("scores", {})

    def check_fidelity(name: str) -> None:
        block = scores.get(name, {})
        values = [block.get("visual"), block.get("structural"), block.get("robustness")]
        total = block.get("total")
        if all(v is not None for v in values):
            expected = sum(values)
            if total is None:
                errors.append(f"scores.{name}.total is required when all components are scored")
            elif abs(total - expected) > 1e-9:
                errors.append(f"scores.{name}.total must equal {expected}")
        elif total is not None:
            errors.append(f"scores.{name}.total must remain null until all components are scored")

    check_fidelity("first_pass_fidelity")
    check_fidelity("final_fidelity")

    replay_result = data.get("replay", {}).get("result")
    reproducibility = scores.get("reproducibility")
    if replay_result == "NOT_RUN" and reproducibility is not None:
        errors.append("scores.reproducibility must be null until clean replay is run")
    if replay_result in {"REPRODUCED", "NOT_REPRODUCED"} and reproducibility is None:
        errors.append("scores.reproducibility is required after replay result is recorded")

    composite = scores.get("final_composite")
    first_total = scores.get("first_pass_fidelity", {}).get("total")
    rework_score = scores.get("rework_efficiency")
    if composite is not None:
        if first_total is None or rework_score is None or reproducibility is None:
            errors.append("final_composite requires first-pass, rework, and reproducibility scores")
        else:
            expected = first_total + rework_score + reproducibility
            if abs(composite - expected) > 1e-9:
                errors.append(f"scores.final_composite must equal {expected}")

    if status == "COMPLETE" and first_total is None:
        errors.append("COMPLETE run requires a first-pass fidelity score")
    return errors


def candidate_files() -> list[tuple[Path, str]]:
    found: list[tuple[Path, str]] = []
    roots = (ROOT / "references", ROOT / "experiments", ROOT / "contracts")
    for base in roots:
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            name = path.name
            if name.endswith("reference.yaml") or name == "reference.yaml":
                found.append((path, "reference"))
            elif name.endswith("shared-contract.yaml") or name == "shared-contract.yaml":
                found.append((path, "shared"))
            elif name.endswith("section-manifest.yaml") or name == "section-manifest.yaml":
                found.append((path, "section"))
            elif name.endswith("run.yaml") or name == "run.yaml":
                found.append((path, "run"))
    return found


def main() -> int:
    schemas = {
        "reference": load_json(REFERENCE_SCHEMA),
        "shared": load_json(SHARED_SCHEMA),
        "section": load_json(SECTION_SCHEMA),
        "run": load_json(RUN_SCHEMA),
    }
    semantic_checks = {
        "reference": semantic_reference_errors,
        "shared": semantic_shared_errors,
        "section": semantic_section_errors,
        "run": semantic_run_errors,
    }
    failures = 0

    targets = [
        (ROOT / "templates" / "reference-manifest.yaml", "reference"),
        (ROOT / "templates" / "shared-contract.yaml", "shared"),
        (ROOT / "templates" / "section-manifest.yaml", "section"),
        (ROOT / "templates" / "run-record.yaml", "run"),
        *candidate_files(),
    ]

    seen: set[Path] = set()
    for path, kind in targets:
        if path in seen:
            continue
        seen.add(path)
        try:
            data = load_yaml(path)
            errors = validate_schema(data, schemas[kind])
            errors.extend(semantic_checks[kind](data))
        except Exception as exc:
            errors = [str(exc)]

        if errors:
            failures += 1
            print(f"FAIL {path.relative_to(ROOT)}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {path.relative_to(ROOT)}")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
