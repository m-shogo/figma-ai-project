#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from audit_figma_variable_modes import audit_record
from plan_figma_variable_mode_remediation import build_remediation_plan
from validate_implementation_profile import load_yaml as load_profile_yaml
from validate_implementation_profile import semantic_errors as implementation_profile_semantic_errors
from validate_reuse_preflight import reuse_preflight_errors
from validate_run_lineage import validate_run

ROOT = Path(__file__).resolve().parents[1]
TARGETS_PATH = ROOT / "config" / "implementation-targets.yaml"
LEGACY_REQUIRED_PREFLIGHT = (
    "figma_release_notes_checked",
    "figma_mcp_docs_checked",
    "agent_docs_checked",
    "community_scan_checked",
)


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def atomic_write(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            yaml.safe_dump(data, handle, sort_keys=False, allow_unicode=True)
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if path != ROOT and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    return path


def parse_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def automated_preflight_errors(preflight: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if preflight.get("official_sources_complete") is not True:
        errors.append("tooling_preflight.official_sources_complete must be true")

    raw_path = str(preflight.get("update_radar_path", "")).strip()
    expected_hash = str(preflight.get("update_radar_sha256", "")).strip()
    generated_at = str(preflight.get("update_radar_generated_at", "")).strip()
    max_age = float(preflight.get("update_radar_max_age_hours", 36) or 36)
    if not raw_path or not expected_hash or not generated_at:
        errors.append("automated preflight requires radar path/hash/generated_at")
        return errors

    radar_path = repo_path(raw_path)
    if not radar_path.is_file():
        errors.append(f"update radar snapshot does not exist: {raw_path}")
        return errors
    if file_sha256(radar_path) != expected_hash:
        errors.append("update radar SHA-256 changed after preflight")

    try:
        age = (datetime.now(timezone.utc) - parse_time(generated_at)).total_seconds() / 3600
        if age > max_age:
            errors.append(f"update radar preflight is stale: {age:.1f}h > {max_age:.1f}h")
    except Exception as exc:
        errors.append(f"invalid update radar timestamp: {exc}")

    for field in ("figma_release_notes_checked", "figma_mcp_docs_checked", "agent_docs_checked"):
        if preflight.get(field) is not True:
            errors.append(f"tooling_preflight.{field} must be true")
    return errors


def preflight_errors(data: dict[str, Any]) -> list[str]:
    preflight = data.get("tooling_preflight", {})
    if not isinstance(preflight, dict):
        return ["tooling_preflight must be an object"]
    errors: list[str] = []
    if not str(preflight.get("checked_at", "")).strip():
        errors.append("tooling_preflight.checked_at is required")

    mode = str(preflight.get("mode", "LEGACY_MANUAL")).strip()
    if mode == "AUTOMATED_UPDATE_RADAR":
        errors.extend(automated_preflight_errors(preflight))
    else:
        for field in LEGACY_REQUIRED_PREFLIGHT:
            if preflight.get(field) is not True:
                errors.append(f"tooling_preflight.{field} must be true")
    return errors


def implementation_profile_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    coordination = data.get("coordination", {})
    raw_profile = str(coordination.get("implementation_profile_path", "")).strip()
    expected_hash = str(coordination.get("implementation_profile_sha256", "")).strip()
    expected_id = str(coordination.get("implementation_profile_id", "")).strip()
    if not raw_profile or not expected_hash or not expected_id:
        return ["SECTION run requires pinned Implementation Profile path/hash/id; run pin_implementation_profile.py"]

    profile_path = repo_path(raw_profile)
    if not profile_path.is_file():
        return [f"Implementation Profile does not exist: {raw_profile}"]
    if file_sha256(profile_path) != expected_hash:
        errors.append("Implementation Profile SHA-256 changed after run pin")
        return errors

    profile = load_profile_yaml(profile_path)
    if str(profile.get("profile_id", "")) != expected_id:
        errors.append("run implementation_profile_id does not match linked profile")
    if profile.get("status") != "FROZEN" or profile.get("freeze", {}).get("ready") is not True:
        errors.append("run requires FROZEN Implementation Profile")
    errors.extend(implementation_profile_semantic_errors(profile, load_profile_yaml(TARGETS_PATH)))

    raw_contract = str(coordination.get("shared_contract_path", "")).strip()
    if raw_contract:
        contract_path = repo_path(raw_contract)
        if contract_path.is_file():
            contract = load_yaml(contract_path)
            binding = contract.get("implementation_profile", {})
            if not isinstance(binding, dict) or binding.get("status") != "BOUND":
                errors.append("Shared Contract must bind the same Implementation Profile")
            else:
                if binding.get("path") != raw_profile:
                    errors.append("run Implementation Profile path differs from Shared Contract binding")
                if binding.get("sha256") != expected_hash:
                    errors.append("run Implementation Profile hash differs from Shared Contract binding")
                if binding.get("profile_id") != expected_id:
                    errors.append("run Implementation Profile id differs from Shared Contract binding")
    return errors


def sibling_variable_mode_audit_path(reference_manifest_path: Path) -> Path:
    name = reference_manifest_path.name
    if name.endswith(".reference.yaml"):
        return reference_manifest_path.with_name(name[: -len(".reference.yaml")] + ".variable-mode-audit.yaml")
    if name == "reference.yaml":
        return reference_manifest_path.with_name("variable-mode-audit.yaml")
    return reference_manifest_path.with_name(reference_manifest_path.stem + ".variable-mode-audit.yaml")


def figma_variable_mode_errors(data: dict[str, Any]) -> list[str]:
    reference = data.get("reference", {})
    raw_manifest = str(reference.get("manifest_path", "")).strip() if isinstance(reference, dict) else ""
    if not raw_manifest:
        return []

    manifest_path = repo_path(raw_manifest)
    if not manifest_path.is_file():
        return []  # linked-reference validation owns the missing-manifest error

    manifest = load_yaml(manifest_path)
    audit_path = sibling_variable_mode_audit_path(manifest_path)
    configured = manifest.get("figma", {}).get("variable_mode_audit", {})
    required = False
    if isinstance(configured, dict):
        configured_path = str(configured.get("path", "")).strip()
        required = configured.get("required") is True
        if configured_path:
            audit_path = repo_path(configured_path)

    if not audit_path.is_file():
        if required:
            return [f"Figma Variable Mode audit is required but missing: {audit_path.relative_to(ROOT)}"]
        return []

    audit = load_yaml(audit_path)
    errors: list[str] = []
    if str(audit.get("reference_id", "")) != str(reference.get("reference_id", "")):
        errors.append("Figma Variable Mode audit reference_id does not match run reference_id")
        return errors

    reference_captured_at = str(manifest.get("figma", {}).get("captured_at", "")).strip()
    audit_captured_at = str(audit.get("captured_at", "")).strip()
    if reference_captured_at and audit_captured_at:
        try:
            if parse_time(audit_captured_at) < parse_time(reference_captured_at):
                errors.append("Figma Variable Mode audit is older than the linked Reference capture; refresh the audit")
        except Exception as exc:
            errors.append(f"invalid Figma Variable Mode audit/reference timestamp: {exc}")

    findings = audit_record(audit)
    blocking = [item for item in findings if item.get("severity") == "ERROR"]
    if not blocking:
        return errors

    plan = build_remediation_plan(audit)
    for item in blocking:
        errors.append(
            f"Figma Variable Mode {item['code']} at {item.get('node_id') or '<unknown>'}: {item['message']}"
        )

    if plan.get("safe_to_auto_apply") and plan.get("actions"):
        actions = ", ".join(
            f"{action['action']} node={action['node_id']} mode={action['mode_id']}"
            for action in plan["actions"]
        )
        errors.append(f"safe Figma remediation available: {actions}; apply with a Figma-capable agent, then refresh/re-audit")
    elif plan.get("blocked"):
        reasons = ", ".join(str(item.get("reason", "UNKNOWN")) for item in plan["blocked"])
        errors.append(f"Figma remediation requires inspection: {reasons}")
    return errors


def start(data: dict[str, Any]) -> dict[str, Any]:
    status = str(data.get("status", "PLANNED"))
    if status != "PLANNED":
        raise ValueError(f"only PLANNED runs can start; current status={status}")
    if data.get("coordination", {}).get("scope") != "SECTION":
        raise ValueError("start_section_run.py only starts SECTION runs")

    candidate = dict(data)
    candidate["status"] = "RUNNING"

    errors = implementation_profile_errors(data)
    errors.extend(preflight_errors(data))
    errors.extend(reuse_preflight_errors(candidate))
    errors.extend(figma_variable_mode_errors(data))
    if errors:
        raise ValueError("section start gate incomplete:\n- " + "\n- ".join(errors))

    lineage_errors = validate_run(candidate)
    if lineage_errors:
        raise ValueError("run lineage invalid:\n- " + "\n- ".join(lineage_errors))

    return candidate


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Transition a pinned SECTION run from PLANNED to RUNNING after Implementation Profile, tooling, reuse-before-build, and Figma responsive-mode validation"
    )
    parser.add_argument("run_record", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    path = args.run_record if args.run_record.is_absolute() else ROOT / args.run_record
    if not path.is_file():
        raise ValueError(f"run record does not exist: {path}")

    current = load_yaml(path)
    started = start(current)

    if args.apply:
        atomic_write(path, started)
        print(f"UPDATED {path.relative_to(ROOT)} → RUNNING")
    else:
        print(f"DRY-RUN {path.relative_to(ROOT)} → RUNNING")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
