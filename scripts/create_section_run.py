#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import os
import tempfile
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
READY_STATES = {"READY", "RUNNING"}
SAFE_PARALLEL_ISOLATION_MODES = {"BRANCH_WORKTREE", "AGENT_SANDBOX", "OTHER"}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML value must be an object: {path}")
    return value


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def resolve(root: Path, value: str, label: str) -> Path:
    text = value.strip()
    if not text:
        raise ValueError(f"{label} is required")
    candidate = Path(text)
    path = candidate if candidate.is_absolute() else root / candidate
    resolved = path.resolve()
    if resolved != root and root not in resolved.parents:
        raise ValueError(f"{label} escapes repository root: {value}")
    if not resolved.is_file():
        raise ValueError(f"{label} does not exist: {value}")
    return resolved


def relative(root: Path, path: Path) -> str:
    resolved = path.resolve()
    if resolved != root and root not in resolved.parents:
        raise ValueError(f"path escapes repository root: {path}")
    return resolved.relative_to(root).as_posix()


def write_yaml_atomic(path: Path, data: dict[str, Any], *, overwrite: bool = False) -> None:
    if path.exists() and not overwrite:
        raise ValueError(f"output already exists: {path}; pass --force to replace intentionally")
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


def find_section(manifest: dict[str, Any], section_id: str) -> dict[str, Any]:
    matches = [
        section
        for section in manifest.get("sections", [])
        if str(section.get("section_id", "")).strip() == section_id
    ]
    if len(matches) != 1:
        raise ValueError(f"expected exactly one section_id={section_id}, found {len(matches)}")
    return matches[0]


def group_size(manifest: dict[str, Any], group: str) -> int:
    return sum(
        1
        for section in manifest.get("sections", [])
        if str(section.get("worker", {}).get("parallel_group", "")).strip() == group
    )


def resolve_company_policy(
    root: Path, contract: dict[str, Any]
) -> tuple[str, str, str]:
    binding = contract.get("company_policy", {})
    if not isinstance(binding, dict) or binding.get("status") != "BOUND":
        return "", "", ""

    raw_path = str(binding.get("path", "")).strip()
    expected_hash = str(binding.get("sha256", "")).strip()
    expected_id = str(binding.get("policy_id", "")).strip()
    if not raw_path or not expected_hash or not expected_id:
        raise ValueError("BOUND Company Policy requires path, policy_id, and sha256")

    policy_path = resolve(root, raw_path, "Company Policy")
    actual_hash = sha256(policy_path)
    if actual_hash != expected_hash:
        raise ValueError("Shared Contract Company Policy hash is stale")
    policy = load_yaml(policy_path)
    if str(policy.get("policy_id", "")) != expected_id:
        raise ValueError("Shared Contract Company Policy id does not match linked policy")
    if policy.get("status") != "ACTIVE":
        raise ValueError("BOUND Company Policy must be ACTIVE before creating a production run")
    return relative(root, policy_path), expected_id, actual_hash


def resolve_environment_contract(
    contract: dict[str, Any], company_policy: tuple[str, str, str]
) -> tuple[list[str], str]:
    env = contract.get("environment_contract", {})
    company_bound = bool(company_policy[0])

    if not company_bound:
        return [], ""
    if not isinstance(env, dict) or env.get("status") != "RESOLVED":
        raise ValueError("BOUND Company Policy requires a RESOLVED Environment Contract")

    required = [str(value).strip() for value in env.get("required_profiles", []) if str(value).strip()]
    canonical = str(env.get("canonical_profile", "")).strip()
    if not required:
        raise ValueError("Resolved Environment Contract requires at least one REQUIRED profile")
    if len(required) != len(set(required)):
        raise ValueError("Resolved Environment Contract required profile ids must be unique")
    if not canonical or canonical not in required:
        raise ValueError("Resolved Environment Contract canonical profile must be one of REQUIRED profiles")

    override_ids = {
        str(item.get("profile_id", "")).strip()
        for item in env.get("effective_overrides", [])
        if isinstance(item, dict) and str(item.get("profile_id", "")).strip()
    }
    if override_ids != set(required):
        raise ValueError("Resolved Environment Contract requires one effective override per REQUIRED profile")

    return required, canonical


def validate_prepared_lineage(
    root: Path,
    manifest_path: Path,
    manifest: dict[str, Any],
    reference_path: Path,
    reference: dict[str, Any],
    section: dict[str, Any],
) -> tuple[
    Path,
    Path,
    str,
    str,
    str,
    tuple[str, str, str],
    tuple[list[str], str],
]:
    contract_path = resolve(root, str(manifest.get("shared_contract", "")), "Shared Contract")
    profile_path = resolve(root, str(manifest.get("figma_structure_profile", "")), "Figma Structure Profile")

    contract_hash = sha256(contract_path)
    profile_hash = sha256(profile_path)
    manifest_hash = sha256(manifest_path)

    if contract_hash != str(manifest.get("shared_contract_sha256", "")):
        raise ValueError("Section Manifest Shared Contract hash is stale; run prepare_section_execution.py")
    if profile_hash != str(manifest.get("figma_structure_profile_sha256", "")):
        raise ValueError("Section Manifest Figma Structure Profile hash is stale; run prepare_section_execution.py")

    contract = load_yaml(contract_path)
    profile = load_yaml(profile_path)
    reference_id = str(manifest.get("reference_id", "")).strip()
    if str(reference.get("reference_id", "")).strip() != reference_id:
        raise ValueError("Reference Manifest reference_id does not match Section Manifest")
    if str(contract.get("reference_id", "")).strip() != reference_id:
        raise ValueError("Shared Contract reference_id does not match Section Manifest")
    if str(profile.get("reference_id", "")).strip() != reference_id:
        raise ValueError("Figma Structure Profile reference_id does not match Section Manifest")

    foundation_commit = str(manifest.get("foundation_commit", "")).strip()
    contract_foundation = str(contract.get("foundation", {}).get("commit", "")).strip()
    if not foundation_commit or foundation_commit != contract_foundation:
        raise ValueError("Section Manifest foundation_commit does not match Shared Contract")

    worker = section.get("worker", {})
    status = str(worker.get("status", "PLANNED"))
    if status not in READY_STATES:
        raise ValueError(
            f"Section worker must be READY or RUNNING before creating a production run; current status={status}"
        )
    if str(worker.get("contract_sha256", "")) != contract_hash:
        raise ValueError("Section worker contract_sha256 does not match current Shared Contract")
    if str(worker.get("base_commit", "")) != foundation_commit:
        raise ValueError("Section worker base_commit does not match verified foundation")

    group = str(worker.get("parallel_group", "")).strip()
    if not group:
        raise ValueError("Section worker parallel_group is required")

    isolation = worker.get("isolation", {})
    mode = str(isolation.get("mode", "UNASSIGNED"))
    isolation_ref = str(isolation.get("ref", "")).strip()
    if mode == "SERIAL_SHARED_TREE":
        if group_size(manifest, group) != 1:
            raise ValueError("SERIAL_SHARED_TREE is allowed only for a singleton execution wave")
    elif mode not in SAFE_PARALLEL_ISOLATION_MODES:
        raise ValueError(f"Section worker isolation mode is not production-ready: {mode}")

    if not isolation_ref:
        raise ValueError("Section worker isolation.ref is required")
    if mode == "OTHER" and (
        isolation.get("parallel_safe") is not True or not isolation.get("notes")
    ):
        raise ValueError("OTHER isolation requires parallel_safe=true and safety notes")

    profile_section = next(
        (item for item in profile.get("sections", []) if item.get("section_id") == section.get("section_id")),
        None,
    )
    if profile_section is None:
        raise ValueError("Section is missing from Figma Structure Profile")
    if profile_section.get("recommended_translation_mode") == "UNKNOWN":
        raise ValueError("Section Figma Structure Profile translation mode is still UNKNOWN")

    company_policy = resolve_company_policy(root, contract)
    environment = resolve_environment_contract(contract, company_policy)
    return (
        contract_path,
        profile_path,
        contract_hash,
        profile_hash,
        manifest_hash,
        company_policy,
        environment,
    )


def build_run_record(
    *,
    root: Path,
    manifest_path: Path,
    reference_path: Path,
    experiment_id: str,
    run_id: str,
    section_id: str,
    agent_client: str,
    model: str,
    run_class: str = "COMMON",
    context_tier: str = "C1",
    max_repair_rounds: int = 2,
) -> dict[str, Any]:
    root = root.resolve()
    manifest_path = manifest_path.resolve()
    reference_path = reference_path.resolve()
    manifest = load_yaml(manifest_path)
    reference = load_yaml(reference_path)
    section = find_section(manifest, section_id)

    (
        contract_path,
        profile_path,
        contract_hash,
        profile_hash,
        manifest_hash,
        company_policy,
        environment,
    ) = validate_prepared_lineage(
        root, manifest_path, manifest, reference_path, reference, section
    )
    company_policy_path, company_policy_id, company_policy_hash = company_policy
    required_environment_profiles, canonical_environment_profile = environment

    worker = section.get("worker", {})
    isolation = worker.get("isolation", {})
    figma = section.get("figma", {})
    node_ids = [
        str(node).strip()
        for node in [
            figma.get("pc_node_id", ""),
            figma.get("sp_node_id", ""),
            *figma.get("other_node_ids", []),
        ]
        if str(node).strip()
    ]

    code_baseline = reference.get("code_baseline", {})
    return {
        "schema_version": 9,
        "experiment_id": experiment_id,
        "run_id": run_id,
        "run_class": run_class,
        "status": "PLANNED",
        "started_at": "",
        "completed_at": "",
        "tooling_preflight": {
            "checked_at": "",
            "figma_release_notes_checked": False,
            "figma_mcp_docs_checked": False,
            "agent_docs_checked": False,
            "community_scan_checked": False,
            "changes_relevant_to_run": [],
            "rules_to_retest": [],
            "new_hypotheses": [],
            "blockers_or_limits": [],
        },
        "reference": {
            "reference_id": manifest.get("reference_id", ""),
            "manifest_path": relative(root, reference_path),
            "manifest_sha256": sha256(reference_path),
            "figma_nodes": node_ids,
        },
        "coordination": {
            "scope": "SECTION",
            "section_id": section_id,
            "parallel_group": worker.get("parallel_group", ""),
            "company_policy_path": company_policy_path,
            "company_policy_id": company_policy_id,
            "company_policy_sha256": company_policy_hash,
            "shared_contract_path": relative(root, contract_path),
            "shared_contract_sha256": contract_hash,
            "section_manifest_path": relative(root, manifest_path),
            "section_manifest_sha256": manifest_hash,
            "figma_structure_profile_path": relative(root, profile_path),
            "figma_structure_profile_sha256": profile_hash,
            "required_environment_profiles": required_environment_profiles,
            "canonical_environment_profile": canonical_environment_profile,
            "foundation_commit": manifest.get("foundation_commit", ""),
            "isolation_mode": isolation.get("mode", ""),
            "isolation_ref": isolation.get("ref", ""),
        },
        "agent": {
            "client": agent_client,
            "model": model,
            "model_alias": "",
            "client_version": "",
            "instruction_sources": ["AGENTS.md"],
            "mcp_mode": "",
            "mcp_notes": "",
        },
        "code": {
            "repository": code_baseline.get("repository", ""),
            "starting_commit": manifest.get("foundation_commit", ""),
            "target_route": code_baseline.get("target_route", ""),
            "first_pass_commit": "",
            "final_commit": "",
        },
        "context": {
            "tier": context_tier,
            "prompt_version": "",
            "prompt_hash": "",
            "figma_design_context": False,
            "figma_metadata": False,
            "figma_screenshots": False,
            "figma_components": False,
            "figma_variables": False,
            "figma_annotations": False,
            "code_connect": False,
            "files_read": [],
            "figma_nodes_inspected": [],
            "tool_calls": None,
        },
        "execution": {
            "workflow": "STAGED",
            "max_repair_rounds": max_repair_rounds,
            "actual_repair_rounds": 0,
            "assumptions": [],
            "blockers": [],
            "human_intervention": "none",
        },
        "captures": {"first_pass": [], "verify": [], "final": []},
        "scores": {
            "first_pass_fidelity": {
                "visual": None,
                "structural": None,
                "robustness": None,
                "total": None,
            },
            "final_fidelity": {
                "visual": None,
                "structural": None,
                "robustness": None,
                "total": None,
            },
            "rework_efficiency": None,
            "reproducibility": None,
            "final_composite": None,
        },
        "rework": {
            "repair_rounds": 0,
            "post_first_pass_files_changed": None,
            "post_first_pass_lines_added": None,
            "post_first_pass_lines_deleted": None,
            "rebuild_count": 0,
            "integration_only_failures": 0,
            "shared_contract_revisions": 0,
            "foundation_rebuilds": 0,
            "merge_conflicts": 0,
            "affected_section_count": 1,
            "contract_violations": 0,
            "severity_counts": {"S1": 0, "S2": 0, "S3": 0, "S4": 0},
        },
        "failures": [],
        "repairs": [],
        "replay": {"required": False, "source_run": "", "result": "NOT_RUN"},
        "lessons": {
            "observations": [],
            "candidate_rules": [],
            "agent_specific": [],
            "project_specific": [],
        },
        "notes": "",
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create a pinned SECTION run record from prepared execution manifests"
    )
    parser.add_argument("--section-manifest", required=True, type=Path)
    parser.add_argument("--reference-manifest", required=True, type=Path)
    parser.add_argument("--experiment-id", required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--section-id", required=True)
    parser.add_argument("--agent", required=True, dest="agent_client")
    parser.add_argument("--model", default="")
    parser.add_argument(
        "--run-class", choices=["COMMON", "OPTIMIZED", "REPLAY"], default="COMMON"
    )
    parser.add_argument(
        "--context-tier", choices=["C0", "C1", "C2", "C3", "C4"], default="C1"
    )
    parser.add_argument("--max-repair-rounds", type=int, default=2)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if args.max_repair_rounds < 0:
        raise ValueError("--max-repair-rounds must be >= 0")

    manifest_path = (
        args.section_manifest
        if args.section_manifest.is_absolute()
        else ROOT / args.section_manifest
    )
    reference_path = (
        args.reference_manifest
        if args.reference_manifest.is_absolute()
        else ROOT / args.reference_manifest
    )
    output_path = args.output if args.output.is_absolute() else ROOT / args.output

    record = build_run_record(
        root=ROOT,
        manifest_path=manifest_path,
        reference_path=reference_path,
        experiment_id=args.experiment_id,
        run_id=args.run_id,
        section_id=args.section_id,
        agent_client=args.agent_client,
        model=args.model,
        run_class=args.run_class,
        context_tier=args.context_tier,
        max_repair_rounds=args.max_repair_rounds,
    )
    write_yaml_atomic(output_path, record, overwrite=args.force)
    print(f"CREATED {relative(ROOT, output_path)}")
    print(f"Reference SHA-256: {record['reference']['manifest_sha256']}")
    if record["coordination"]["company_policy_sha256"]:
        print(f"Company Policy SHA-256: {record['coordination']['company_policy_sha256']}")
        print(
            "Environment Profiles: "
            + ", ".join(record["coordination"]["required_environment_profiles"])
        )
        print(
            f"Canonical Environment: {record['coordination']['canonical_environment_profile']}"
        )
    print(f"Shared Contract SHA-256: {record['coordination']['shared_contract_sha256']}")
    print(f"Section Manifest SHA-256: {record['coordination']['section_manifest_sha256']}")
    print(
        f"Structure Profile SHA-256: {record['coordination']['figma_structure_profile_sha256']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
