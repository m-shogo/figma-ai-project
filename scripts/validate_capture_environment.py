#!/usr/bin/env python3
from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
ACTIVE = {"RUNNING", "COMPLETE"}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("top-level YAML value must be an object")
    return value


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if ROOT != path and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    return path


def candidate_runs() -> list[Path]:
    found = [ROOT / "templates" / "run-record.yaml"]
    for base in (ROOT / "experiments", ROOT / "references", ROOT / "contracts"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if path.name == "run.yaml" or path.name.endswith("run.yaml"):
                found.append(path)
    return list(dict.fromkeys(found))


def all_captures(data: dict[str, Any]) -> list[tuple[str, dict[str, Any]]]:
    result: list[tuple[str, dict[str, Any]]] = []
    captures = data.get("captures", {})
    if not isinstance(captures, dict):
        return result
    for phase in ("first_pass", "verify", "final"):
        values = captures.get(phase, [])
        if not isinstance(values, list):
            continue
        for item in values:
            if isinstance(item, dict):
                result.append((phase, item))
    return result


def validate_run(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if str(data.get("status", "PLANNED")) not in ACTIVE:
        return errors

    coordination = data.get("coordination", {})
    raw_contract_path = str(coordination.get("shared_contract_path", "")).strip()
    if not raw_contract_path:
        return errors
    contract_path = repo_path(raw_contract_path)
    if not contract_path.is_file():
        return [f"shared contract does not exist: {raw_contract_path}"]

    expected_contract_hash = str(coordination.get("shared_contract_sha256", "")).strip()
    if expected_contract_hash and file_sha256(contract_path) != expected_contract_hash:
        return ["shared contract hash drift prevents capture-environment validation"]

    contract = load_yaml(contract_path)
    env = contract.get("environment_contract", {})
    if not isinstance(env, dict) or env.get("status") != "RESOLVED":
        # Legacy/unbound research runs remain valid until migrated.
        return errors

    required = [str(value).strip() for value in env.get("required_profiles", [])]
    canonical = str(env.get("canonical_profile", "")).strip()
    run_required = [str(value).strip() for value in coordination.get("required_environment_profiles", [])]
    run_canonical = str(coordination.get("canonical_environment_profile", "")).strip()
    if run_required != required:
        errors.append("run required_environment_profiles do not match resolved Environment Contract")
    if run_canonical != canonical:
        errors.append("run canonical_environment_profile does not match resolved Environment Contract")

    raw_policy_path = str(coordination.get("company_policy_path", "")).strip()
    if not raw_policy_path:
        errors.append("environment-aware run requires direct Company Policy pin")
        return errors
    policy_path = repo_path(raw_policy_path)
    if not policy_path.is_file():
        errors.append(f"Company Policy does not exist: {raw_policy_path}")
        return errors
    expected_policy_hash = str(coordination.get("company_policy_sha256", "")).strip()
    if not expected_policy_hash or file_sha256(policy_path) != expected_policy_hash:
        errors.append("run Company Policy hash does not match actual policy file")
        return errors

    policy = load_yaml(policy_path)
    profiles = {
        str(item.get("id", "")).strip(): item
        for item in policy.get("browser_support", {}).get("environment_profiles", [])
        if isinstance(item, dict) and str(item.get("id", "")).strip()
    }
    unknown_required = [profile_id for profile_id in required if profile_id not in profiles]
    if unknown_required:
        errors.append(f"resolved required profiles missing from Company Policy: {unknown_required}")

    captures = all_captures(data)
    capture_ids = [str(item.get("capture_id", "")).strip() for _, item in captures]
    nonempty_capture_ids = [value for value in capture_ids if value]
    if len(nonempty_capture_ids) != len(set(nonempty_capture_ids)):
        errors.append("capture_id values must be unique within a run")

    section_id = str(coordination.get("section_id", "")).strip()
    for phase, capture in captures:
        capture_id = str(capture.get("capture_id", "<missing>"))
        profile_id = str(capture.get("environment_profile_id", "")).strip()
        if profile_id not in profiles:
            errors.append(f"capture {capture_id}: unknown environment_profile_id {profile_id!r}")
            continue

        runtime = capture.get("runtime", {})
        profile = profiles[profile_id]
        expected_browser = str(profile.get("browser", "")).strip()
        expected_os = str(profile.get("os", "")).strip()
        expected_engine = str(profile.get("engine", "")).strip()
        expected_webview = profile.get("webview")
        if expected_browser and str(runtime.get("browser", "")).strip() != expected_browser:
            errors.append(f"capture {capture_id}: runtime browser does not match environment profile")
        if expected_os and str(runtime.get("os", "")).strip() != expected_os:
            errors.append(f"capture {capture_id}: runtime OS does not match environment profile")
        if expected_engine and str(runtime.get("engine", "")).strip() != expected_engine:
            errors.append(f"capture {capture_id}: runtime engine does not match environment profile")
        if isinstance(expected_webview, bool) and runtime.get("webview") is not expected_webview:
            errors.append(f"capture {capture_id}: runtime webview flag does not match environment profile")

        if capture.get("deterministic") is not True:
            errors.append(f"capture {capture_id}: deterministic must be true for research evidence")

        if coordination.get("scope") == "SECTION" and capture.get("scope") == "SECTION":
            if section_id and str(capture.get("target_id", "")) != section_id:
                errors.append(f"capture {capture_id}: SECTION target_id must match run section_id")

    if str(data.get("status")) != "COMPLETE":
        return errors

    scope = str(coordination.get("scope", ""))
    if scope == "SECTION" and canonical:
        canonical_first_pass = [
            capture
            for phase, capture in captures
            if phase == "first_pass"
            and capture.get("scope") == "SECTION"
            and str(capture.get("environment_profile_id", "")) == canonical
        ]
        if not canonical_first_pass:
            errors.append("COMPLETE SECTION run requires canonical-environment FIRST_PASS Section capture")

    if scope == "INTEGRATION":
        full_page_profiles = {
            str(capture.get("environment_profile_id", ""))
            for _, capture in captures
            if capture.get("scope") == "FULL_PAGE"
        }
        missing = [profile_id for profile_id in required if profile_id not in full_page_profiles]
        if missing:
            errors.append(
                "COMPLETE INTEGRATION run requires FULL_PAGE evidence for every REQUIRED environment: "
                + ", ".join(missing)
            )

    return errors


def main() -> int:
    failures = 0
    for path in candidate_runs():
        try:
            errors = validate_run(load_yaml(path))
        except Exception as exc:
            errors = [str(exc)]
        rel = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {rel} capture-environment")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {rel} capture-environment")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
