#!/usr/bin/env python3
from __future__ import annotations

import hashlib
from pathlib import Path

from jsonschema import Draft202012Validator

import build_sanitized_run_workspace as sanitized
import validate_execution_output_contract as output_contract
import validate_implementation_profile as implementation_profile

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "experiments" / "ref001-benchmark-replay"
PROFILE_PATH = BASE / "implementation-profile.yaml"
CONTRACT_PATH = BASE / "shared-contract.yaml"
WORKSPACE_PATH = BASE / "workspace.yaml"
HANDOFF_PATH = BASE / "FRESH-EXECUTION.md"
BLANK_THEME = BASE / "blank-theme"
RUNTIME_COMPOSE = ROOT / "experiments" / "wordpress-acf-pro-standalone-lp" / "compose.yml"
RUNTIME_SETUP = ROOT / "experiments" / "wordpress-acf-pro-standalone-lp" / "scripts" / "setup.sh"
FRONTEND_POLICY_PATH = ROOT / "config" / "frontend-implementation-policy.yaml"
SECTION_TEMPLATE_PATH = ROOT / "templates" / "section-manifest.yaml"
SECTION_SCHEMA_PATH = ROOT / "schemas" / "section.schema.json"
OBSERVATION_DOC_PATH = ROOT / "docs" / "frontend-observation-coverage.md"

ACF_ADMIN_REQUIRED_TRUE = (
    "required",
    "real_wordpress_required",
    "acf_pro_active_required",
    "field_group_visible_on_target_page_required",
    "representative_field_edit_required",
    "image_field_edit_required_when_present",
    "collection_controls_required_when_present",
    "save_update_required",
    "persistence_after_reload_required",
    "frontend_roundtrip_required",
    "baseline_restore_required",
    "console_and_page_error_free_required",
)
ACF_ADMIN_REQUIRED_CHECKS = {
    "acf_import_or_sync_smoke",
    "acf_admin_field_presence",
    "acf_admin_edit_save_reload",
    "acf_frontend_roundtrip",
}
ACF_ADMIN_EVIDENCE_JSON = "experiments/ref001-benchmark-replay/output/acf-admin-e2e.json"
ACF_ADMIN_SCREENSHOT_DIR = "experiments/ref001-benchmark-replay/output/acf-admin-e2e"
OBSERVATION_SOURCE_CLASSES = {
    "TEXT",
    "RASTER_MEDIA",
    "VECTOR_LOGO",
    "BACKGROUND",
    "DECORATION",
    "INTERACTION_STATE",
    "RESPONSIVE_VARIANT",
}
EXECUTION_POLICY_EXPECTATIONS = {
    "authoring_default": "MOBILE_FIRST",
    "execution_order_default": "SP_THEN_PC",
    "section_stabilization_order": "SP_THEN_PC",
    "boundary_cluster_acceptance_order": "SP_THEN_PC",
    "final_integration_acceptance_order": "SP_THEN_PC",
    "shared_owner_change_restart_acceptance_from": "SP",
}
HANDOFF_EXECUTION_MARKERS = {
    "execution_order: SP_THEN_PC",
    "section_stabilization_order: SP_THEN_PC",
    "final_integration_acceptance_order: SP_THEN_PC",
    "shared_owner_change_restart_acceptance_from: SP",
    "observation_manifest: SECTION_SCHEMA_V9_REQUIRED",
    "parallel_capture_must_not_override_acceptance_order: true",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def acf_admin_contract_errors(contract: dict) -> list[str]:
    errors: list[str] = []
    config = contract.get("cms_validation", {}).get("acf_admin_e2e", {})
    if not isinstance(config, dict):
        return ["cms_validation.acf_admin_e2e must be an object"]

    for key in ACF_ADMIN_REQUIRED_TRUE:
        if config.get(key) is not True:
            errors.append(f"cms_validation.acf_admin_e2e.{key} must be true")

    if config.get("browser_driver") != "PLAYWRIGHT":
        errors.append("cms_validation.acf_admin_e2e.browser_driver must be PLAYWRIGHT")
    if config.get("evidence_json") != ACF_ADMIN_EVIDENCE_JSON:
        errors.append(
            "cms_validation.acf_admin_e2e.evidence_json must be " + ACF_ADMIN_EVIDENCE_JSON
        )
    if config.get("screenshot_dir") != ACF_ADMIN_SCREENSHOT_DIR:
        errors.append(
            "cms_validation.acf_admin_e2e.screenshot_dir must be " + ACF_ADMIN_SCREENSHOT_DIR
        )

    required_checks = set(contract.get("integration", {}).get("required_checks", []))
    missing_checks = sorted(ACF_ADMIN_REQUIRED_CHECKS - required_checks)
    if missing_checks:
        errors.append("integration.required_checks missing ACF admin gates: " + ", ".join(missing_checks))

    return errors


def current_execution_contract_errors(
    policy: dict,
    section_template: dict,
    section_schema: dict,
    handoff_text: str,
) -> list[str]:
    errors: list[str] = []
    responsive = policy.get("responsive", {})
    if not isinstance(responsive, dict):
        return ["frontend policy responsive block must be an object"]

    for key, expected in EXECUTION_POLICY_EXPECTATIONS.items():
        if responsive.get(key) != expected:
            errors.append(
                f"frontend responsive.{key} must remain {expected!r} for this current benchmark contract"
            )

    for key in (
        "pc_change_to_shared_owner_invalidates_prior_sp_acceptance",
        "parallel_capture_must_not_override_acceptance_order",
    ):
        if responsive.get(key) is not True:
            errors.append(f"frontend responsive.{key} must be true")

    if int(section_template.get("schema_version", 0) or 0) < 9:
        errors.append("canonical Section Manifest template must be schema_version >= 9")

    integration_coverage = section_template.get("integration", {}).get("observation_coverage")
    if not isinstance(integration_coverage, dict):
        errors.append("canonical Section Manifest template must expose integration.observation_coverage")
    else:
        for key in ("sp_full_page", "pc_full_page", "evidence", "known_gaps"):
            if key not in integration_coverage:
                errors.append(
                    f"canonical Section Manifest integration.observation_coverage missing {key}"
                )

    coverage_def = section_schema.get("$defs", {}).get("sectionObservationCoverage", {})
    source_presence = coverage_def.get("properties", {}).get("source_presence", {})
    required_classes = set(source_presence.get("required", []))
    missing_classes = sorted(OBSERVATION_SOURCE_CLASSES - required_classes)
    if missing_classes:
        errors.append(
            "Section schema Observation Coverage missing source classes: " + ", ".join(missing_classes)
        )

    runtime_review = coverage_def.get("properties", {}).get("runtime_review", {})
    runtime_required = set(runtime_review.get("required", []))
    if not {"sp", "pc"}.issubset(runtime_required):
        errors.append("Section schema Observation Coverage runtime_review must require sp and pc")

    for marker in sorted(HANDOFF_EXECUTION_MARKERS):
        if marker not in handoff_text:
            errors.append(f"FRESH-EXECUTION missing current execution marker: {marker}")

    return errors


def main() -> int:
    errors: list[str] = []

    profile = implementation_profile.load_yaml(PROFILE_PATH)
    profile_schema = implementation_profile.load_json(implementation_profile.SCHEMA_PATH)
    profile_config = implementation_profile.load_yaml(implementation_profile.TARGETS_PATH)
    errors.extend(
        f"implementation profile schema: {error.message}"
        for error in Draft202012Validator(profile_schema).iter_errors(profile)
    )
    errors.extend(
        f"implementation profile semantic: {error}"
        for error in implementation_profile.semantic_errors(profile, profile_config)
    )

    contract = implementation_profile.load_yaml(CONTRACT_PATH)
    binding = contract.get("implementation_profile", {})
    actual_profile_hash = sha256(PROFILE_PATH)
    if binding.get("sha256") != actual_profile_hash:
        errors.append(
            "benchmark Implementation Profile SHA-256 mismatch: "
            f"recorded={binding.get('sha256')!r} actual={actual_profile_hash}"
        )
    errors.extend(
        f"benchmark binding: {error}"
        for error in output_contract.validate_profile_binding(contract, profile, profile_path=PROFILE_PATH)
    )
    errors.extend(f"ACF admin contract: {error}" for error in acf_admin_contract_errors(contract))

    frontend_policy = implementation_profile.load_yaml(FRONTEND_POLICY_PATH)
    section_template = implementation_profile.load_yaml(SECTION_TEMPLATE_PATH)
    section_schema = implementation_profile.load_json(SECTION_SCHEMA_PATH)
    handoff_text = HANDOFF_PATH.read_text(encoding="utf-8")
    errors.extend(
        f"current execution contract: {error}"
        for error in current_execution_contract_errors(
            frontend_policy,
            section_template,
            section_schema,
            handoff_text,
        )
    )

    breakpoints = contract.get("breakpoints", {})
    thresholds = output_contract.contract_thresholds(contract)
    if thresholds != {767.0, 768.0}:
        errors.append(f"benchmark breakpoint ownership must be exactly 767/768; got {sorted(thresholds)}")
    if breakpoints.get("worker_override") != "PROPOSE_ONLY":
        errors.append("benchmark breakpoint worker_override must remain PROPOSE_ONLY")

    allowed_css = "@media (max-width: 767px){.x{display:block}} @media (min-width: 768px){.y{display:block}}"
    errors.extend(
        f"owned breakpoint rejected: {error}"
        for error in output_contract.validate_css_text(allowed_css, contract)
    )
    unowned_errors = output_contract.validate_css_text(
        "@media (min-width: 1100px){.x{display:block}}", contract
    )
    if not any("unowned viewport threshold 1100px" in error for error in unowned_errors):
        errors.append("unowned 1100px viewport threshold was not rejected")

    html_run = {
        "coordination": {"implementation_profile_path": PROFILE_PATH.relative_to(ROOT).as_posix()},
        "code": {"target_route": "experiments/ref001-benchmark-replay/output/index.html"},
    }
    html_errors = output_contract.validate_run_output_contract(html_run)
    if not any("contradicts SERVER_RENDERED_PHP" in error for error in html_errors):
        errors.append("static HTML output was not rejected by the benchmark WordPress profile")

    php_manifest = {
        "sections": [
            {
                "section_id": "S01",
                "implementation": {"component_path": "template-parts/ref001/section.php"},
                "worker": {"status": "READY"},
            }
        ]
    }
    errors.extend(
        f"PHP output plan rejected: {error}"
        for error in output_contract.validate_output_plan(php_manifest, profile)
    )

    style_text = (BLANK_THEME / "style.css").read_text(encoding="utf-8")
    owner_text = (BLANK_THEME / "template-parts" / "ref001" / "benchmark-page.php").read_text(
        encoding="utf-8"
    )
    if "@media" in style_text or "{" in style_text:
        errors.append("blank benchmark style.css must not contain visual/layout CSS rules")
    if "<section" in owner_text.lower() or "class=" in owner_text.lower():
        errors.append("blank benchmark implementation owner must not contain REF-001 markup answers")

    compose_text = RUNTIME_COMPOSE.read_text(encoding="utf-8")
    setup_text = RUNTIME_SETUP.read_text(encoding="utf-8")
    if "wordpress:7.0.2-php8.3-apache" not in compose_text:
        errors.append("benchmark profile WordPress/PHP version evidence drifted from current compose runtime")
    if '"wpengine/advanced-custom-fields-pro": "^6.0"' not in setup_text:
        errors.append("benchmark profile ACF PRO dependency contract drifted from current runtime setup")

    workspace = sanitized.load_profile(WORKSPACE_PATH)
    workspace_errors = sanitized.validate_profile(workspace)
    errors.extend(f"workspace profile: {error}" for error in workspace_errors)
    if not workspace_errors:
        selected = sanitized.collect_source_files(ROOT, workspace, WORKSPACE_PATH)
        selected_paths = {path.relative_to(ROOT).as_posix() for path in selected}
        forbidden_exact = {
            "experiments/ref001-wordpress-acf/implementation-profile.yaml",
            "experiments/ref001-wordpress-acf/fixture-theme/style.css",
            "experiments/ref001-frontend-standard-clean-replay/implementation/styles.css",
        }
        leaked = sorted(forbidden_exact & selected_paths)
        if leaked:
            errors.append("answer-bearing REF paths leaked into sanitized workspace: " + ", ".join(leaked))
        required = {
            "experiments/ref001-benchmark-replay/implementation-profile.yaml",
            "experiments/ref001-benchmark-replay/shared-contract.yaml",
            "experiments/ref001-benchmark-replay/blank-theme/page-templates/template-ref001-benchmark.php",
            "experiments/ref001-benchmark-replay/FRESH-EXECUTION.md",
            "references/chiba-keizai-sample.reference.yaml",
            "scripts/validate_benchmark_replay_pipeline.py",
            "config/frontend-implementation-policy.yaml",
            "templates/section-manifest.yaml",
            "schemas/section.schema.json",
            "docs/frontend-observation-coverage.md",
        }
        missing = sorted(required - selected_paths)
        if missing:
            errors.append("sanitized workspace is missing required benchmark authority: " + ", ".join(missing))

    if not OBSERVATION_DOC_PATH.is_file():
        errors.append("canonical frontend Observation Coverage document is missing")

    if errors:
        print("FAIL REF-001 benchmark clean replay pipeline")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("PASS REF-001 benchmark clean replay pipeline")
    print(f"  profile_sha256={actual_profile_hash}")
    print("  target=WORDPRESS/CLASSIC/SERVER_RENDERED_PHP + ACF PRO")
    print("  owned_viewport_thresholds=767,768")
    print("  static_html=REJECTED unowned_1100=REJECTED")
    print("  acf_admin_edit_save_reload_frontend_roundtrip=REQUIRED")
    print("  execution_acceptance=SP_THEN_PC shared_owner_restart=SP")
    print("  observation_coverage=SECTION_SCHEMA_V9_REQUIRED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
