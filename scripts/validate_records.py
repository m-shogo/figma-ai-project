#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
REFERENCE_SCHEMA = ROOT / "schemas" / "reference.schema.json"
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


def semantic_run_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
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

    if data.get("status") == "COMPLETE" and first_total is None:
        errors.append("COMPLETE run requires a first-pass fidelity score")
    return errors


def candidate_files() -> list[tuple[Path, str]]:
    found: list[tuple[Path, str]] = []
    for base, kind in ((ROOT / "references", "reference"), (ROOT / "experiments", "run")):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name.endswith("reference.yaml") or path.name == "reference.yaml":
                found.append((path, "reference"))
            elif path.name.endswith("run.yaml") or path.name == "run.yaml":
                found.append((path, "run"))
    return found


def main() -> int:
    reference_schema = load_json(REFERENCE_SCHEMA)
    run_schema = load_json(RUN_SCHEMA)
    failures = 0

    # Templates must always parse and match their schema shape.
    targets = [
        (ROOT / "templates" / "reference-manifest.yaml", "reference"),
        (ROOT / "templates" / "run-record.yaml", "run"),
        *candidate_files(),
    ]

    for path, kind in targets:
        try:
            data = load_yaml(path)
            schema = reference_schema if kind == "reference" else run_schema
            errors = validate_schema(data, schema)
            if kind == "reference":
                errors.extend(semantic_reference_errors(data))
            else:
                errors.extend(semantic_run_errors(data))
        except Exception as exc:  # validation should fail closed with useful path context
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
