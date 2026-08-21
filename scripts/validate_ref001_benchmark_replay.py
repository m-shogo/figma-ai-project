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
BLANK_THEME = BASE / "blank-theme"
RUNTIME_COMPOSE = ROOT / "experiments" / "wordpress-acf-pro-standalone-lp" / "compose.yml"
RUNTIME_SETUP = ROOT / "experiments" / "wordpress-acf-pro-standalone-lp" / "scripts" / "setup.sh"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []

    profile = implementation_profile.load_yaml(PROFILE_PATH)
    profile_schema = implementation_profile.load_json(implementation_profile.SCHEMA_PATH)
    profile_config = implementation_profile.load_yaml(implementation_profile.TARGETS_PATH)
    errors.extend(f"implementation profile schema: {error.message}" for error in Draft202012Validator(profile_schema).iter_errors(profile))
    errors.extend(f"implementation profile semantic: {error}" for error in implementation_profile.semantic_errors(profile, profile_config))

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

    breakpoints = contract.get("breakpoints", {})
    thresholds = output_contract.contract_thresholds(contract)
    if thresholds != {767.0, 768.0}:
        errors.append(f"benchmark breakpoint ownership must be exactly 767/768; got {sorted(thresholds)}")
    if breakpoints.get("worker_override") != "PROPOSE_ONLY":
        errors.append("benchmark breakpoint worker_override must remain PROPOSE_ONLY")

    allowed_css = "@media (max-width: 767px){.x{display:block}} @media (min-width: 768px){.y{display:block}}"
    errors.extend(f"owned breakpoint rejected: {error}" for error in output_contract.validate_css_text(allowed_css, contract))
    unowned_errors = output_contract.validate_css_text("@media (min-width: 1100px){.x{display:block}}", contract)
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
    errors.extend(f"PHP output plan rejected: {error}" for error in output_contract.validate_output_plan(php_manifest, profile))

    style_text = (BLANK_THEME / "style.css").read_text(encoding="utf-8")
    owner_text = (BLANK_THEME / "template-parts" / "ref001" / "benchmark-page.php").read_text(encoding="utf-8")
    if "@media" in style_text or "{" in style_text:
        errors.append("blank benchmark style.css must not contain visual/layout CSS rules")
    if "<section" in owner_text.lower() or "class=" in owner_text.lower():
        errors.append("blank benchmark implementation owner must not contain REF-001 markup answers")

    compose_text = RUNTIME_COMPOSE.read_text(encoding="utf-8")
    setup_text = RUNTIME_SETUP.read_text(encoding="utf-8")
    if "wordpress:7.0.2-php8.3-apache" not in compose_text:
        errors.append("benchmark profile WordPress/PHP version evidence drifted from current compose runtime")
    if "wpengine/advanced-custom-fields-pro:^6.0" not in setup_text:
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
            "references/chiba-keizai-sample.reference.yaml",
        }
        missing = sorted(required - selected_paths)
        if missing:
            errors.append("sanitized workspace is missing required benchmark authority: " + ", ".join(missing))

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
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
