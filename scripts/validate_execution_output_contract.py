#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import re
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_STATUSES = {"READY", "RUNNING", "COMPLETE"}
CSS_SUFFIXES = {".css", ".scss", ".pcss"}
MEDIA_RE = re.compile(r"@media\b(?P<query>[^\{]+)\{", re.IGNORECASE)
PX_THRESHOLD_RE = re.compile(
    r"(?:\b(?:min|max)-width\s*:\s*|\bwidth\s*(?:<=|>=|<|>)\s*|(?:<=|>=|<|>)\s*width\s*:\s*)"
    r"(?P<value>\d+(?:\.\d+)?)px\b",
    re.IGNORECASE,
)
PX_BEFORE_WIDTH_RE = re.compile(
    r"(?P<value>\d+(?:\.\d+)?)px\s*(?:<=|>=|<|>)\s*width\b",
    re.IGNORECASE,
)
WIDTH_TOKEN_RE = re.compile(r"\b(?:min-width|max-width|width)\b", re.IGNORECASE)


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML must be an object: {path}")
    return value


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    if path != ROOT and ROOT not in path.parents:
        raise ValueError(f"path escapes repository root: {value}")
    return path


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def executable_sections(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        section
        for section in manifest.get("sections", [])
        if isinstance(section, dict)
        and isinstance(section.get("worker"), dict)
        and section["worker"].get("status") in OUTPUT_STATUSES
    ]


def normalized_query(value: str) -> str:
    return re.sub(r"\s+", "", value).lower()


def extract_media_query_thresholds(query: str) -> set[float]:
    values = {float(match.group("value")) for match in PX_THRESHOLD_RE.finditer(query)}
    values.update(float(match.group("value")) for match in PX_BEFORE_WIDTH_RE.finditer(query))
    return values


def extract_media_queries(css_text: str) -> list[str]:
    # Commented legacy CSS is evidence/history, not an active viewport threshold.
    css_text = re.sub(r"/\*.*?\*/", "", css_text, flags=re.DOTALL)
    return [match.group("query").strip() for match in MEDIA_RE.finditer(css_text)]


def contract_thresholds(contract: dict[str, Any]) -> set[float]:
    values: set[float] = set()
    for item in contract.get("breakpoints", {}).get("values", []):
        if not isinstance(item, dict):
            continue
        for field in ("min_width_px", "max_width_px"):
            raw = item.get(field)
            if isinstance(raw, (int, float)) and not isinstance(raw, bool):
                values.add(float(raw))
        values.update(extract_media_query_thresholds(str(item.get("media_query", ""))))
    return values


def contract_media_queries(contract: dict[str, Any]) -> set[str]:
    return {
        normalized_query(str(item.get("media_query", "")))
        for item in contract.get("breakpoints", {}).get("values", [])
        if isinstance(item, dict) and str(item.get("media_query", "")).strip()
    }


def approved_exception_thresholds(section: dict[str, Any], contract: dict[str, Any]) -> set[float]:
    breakpoints = contract.get("breakpoints", {})
    if breakpoints.get("worker_override") != "OWNER_ALLOWED":
        return set()
    values: set[float] = set()
    proposals = section.get("responsive", {}).get("breakpoint_exception_proposals", [])
    for proposal in proposals:
        if not isinstance(proposal, dict):
            continue
        if proposal.get("source") != "OWNER" or proposal.get("status") not in {"APPROVED", "OWNER_APPROVED"}:
            continue
        for field in ("threshold_px", "min_width_px", "max_width_px"):
            raw = proposal.get(field)
            if isinstance(raw, (int, float)) and not isinstance(raw, bool):
                values.add(float(raw))
        values.update(extract_media_query_thresholds(str(proposal.get("media_query", ""))))
    return values


def validate_css_text(
    css_text: str,
    contract: dict[str, Any],
    *,
    source: str = "<css>",
    section: dict[str, Any] | None = None,
) -> list[str]:
    allowed = contract_thresholds(contract)
    allowed_queries = contract_media_queries(contract)
    if section is not None:
        allowed |= approved_exception_thresholds(section, contract)

    errors: list[str] = []
    for query in extract_media_queries(css_text):
        if not WIDTH_TOKEN_RE.search(query):
            continue
        thresholds = extract_media_query_thresholds(query)
        if not thresholds:
            if normalized_query(query) not in allowed_queries:
                errors.append(
                    f"{source}: viewport media query cannot be verified against breakpoint contract: @media {query}"
                )
            continue
        for threshold in sorted(thresholds):
            if threshold not in allowed:
                rendered = int(threshold) if threshold.is_integer() else threshold
                errors.append(
                    f"{source}: unowned viewport threshold {rendered}px in @media {query}; "
                    "record an OWNER-backed breakpoint exception or use intrinsic responsiveness"
                )
    return errors


def validate_profile_binding(
    contract: dict[str, Any], profile: dict[str, Any], *, profile_path: Path | None = None
) -> list[str]:
    errors: list[str] = []
    binding = contract.get("implementation_profile", {})
    if binding.get("status") != "BOUND":
        errors.append("shared contract Implementation Profile must be BOUND before section execution")
        return errors

    expected_id = str(binding.get("profile_id", "")).strip()
    actual_id = str(profile.get("profile_id", "")).strip()
    if not expected_id or expected_id != actual_id:
        errors.append("shared contract Implementation Profile id does not match linked profile")

    expected_family = str(binding.get("family", "")).strip()
    actual_family = str(profile.get("effective", {}).get("family", "")).strip()
    if not expected_family or expected_family != actual_family:
        errors.append("shared contract Implementation Profile family does not match linked profile")

    if profile.get("status") != "FROZEN" or profile.get("freeze", {}).get("ready") is not True:
        errors.append("linked Implementation Profile must be FROZEN before section execution")

    if profile_path is not None:
        expected_hash = str(binding.get("sha256", "")).strip()
        if not expected_hash or expected_hash != file_sha256(profile_path):
            errors.append("shared contract Implementation Profile SHA-256 is stale")
    return errors


def validate_output_plan(manifest: dict[str, Any], profile: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    family = str(profile.get("effective", {}).get("family", "")).strip()
    rendering = str(profile.get("effective", {}).get("rendering_mode", "")).strip()

    wordpress = profile.get("platform", {}).get("wordpress", {})
    acf = wordpress.get("acf", {}) if isinstance(wordpress, dict) else {}
    delivery_acf = profile.get("delivery_requirements", {}).get("acf", {})
    if family == "WORDPRESS" and isinstance(acf, dict) and acf.get("enabled") is True:
        if delivery_acf.get("required") is not True:
            errors.append("WordPress+ACF profile must require ACF delivery evidence")
        export = delivery_acf.get("export_json", {})
        if export.get("required") is not True or not str(export.get("target_repo_path", "")).endswith(".json"):
            errors.append("WordPress+ACF profile must declare a required importable ACF export JSON")
        if delivery_acf.get("import_or_sync_smoke_required") is not True:
            errors.append("WordPress+ACF profile must require an import/sync smoke")

    for section in executable_sections(manifest):
        section_id = str(section.get("section_id", "<unknown>"))
        implementation = section.get("implementation", {})
        component_path = str(implementation.get("component_path", "")).strip()
        if rendering == "SERVER_RENDERED_PHP":
            if not component_path:
                errors.append(f"section {section_id}: SERVER_RENDERED_PHP requires implementation.component_path")
            elif not component_path.lower().endswith(".php"):
                errors.append(
                    f"section {section_id}: SERVER_RENDERED_PHP requires PHP template ownership; "
                    f"component_path={component_path!r}"
                )
    return errors


def validate_run_output_contract(data: dict[str, Any]) -> list[str]:
    """Reject known file output that contradicts a pinned rendering mode.

    URL-like routes such as `/` are neutral rather than guessed. Section manifests and
    final deliverable evidence provide stronger proof when a run route is not a file.
    """
    coordination = data.get("coordination", {})
    raw_profile = str(coordination.get("implementation_profile_path", "")).strip()
    if not raw_profile:
        return []
    profile_path = repo_path(raw_profile)
    if not profile_path.is_file():
        return []
    profile = load_yaml(profile_path)
    rendering = str(profile.get("effective", {}).get("rendering_mode", "")).strip()
    target_route = str(data.get("code", {}).get("target_route", "")).strip()
    if rendering != "SERVER_RENDERED_PHP" or not target_route:
        return []

    clean_target = target_route.split("?", 1)[0].split("#", 1)[0].lower()
    if clean_target.endswith((".html", ".htm")):
        return [
            "run output contradicts SERVER_RENDERED_PHP Implementation Profile; "
            f"code.target_route={target_route!r}"
        ]
    return []


def style_paths(section: dict[str, Any]) -> list[str]:
    implementation = section.get("implementation", {})
    found: list[str] = []
    style_path = str(implementation.get("style_path", "")).strip()
    if style_path:
        found.append(style_path)
    for value in implementation.get("allowed_paths", []):
        raw = str(value).strip()
        if raw and Path(raw).suffix.lower() in CSS_SUFFIXES:
            found.append(raw)
    return list(dict.fromkeys(found))


def validate_manifest(
    path: Path,
    manifest: dict[str, Any] | None = None,
    *,
    contract: dict[str, Any] | None = None,
) -> list[str]:
    manifest = manifest if manifest is not None else load_yaml(path)
    sections = executable_sections(manifest)
    if not sections:
        return []

    errors: list[str] = []
    if contract is None:
        contract_raw = str(manifest.get("shared_contract", "")).strip()
        if not contract_raw:
            return ["shared_contract is required for output-contract validation"]
        contract_path = repo_path(contract_raw)
        if not contract_path.is_file():
            return [f"shared_contract does not exist: {contract_raw}"]
        contract = load_yaml(contract_path)

    binding = contract.get("implementation_profile", {})
    profile_raw = str(binding.get("path", "")).strip()
    if not profile_raw:
        return ["shared contract must link an Implementation Profile before section execution"]
    profile_path = repo_path(profile_raw)
    if not profile_path.is_file():
        return [f"Implementation Profile does not exist: {profile_raw}"]
    profile = load_yaml(profile_path)
    errors.extend(validate_profile_binding(contract, profile, profile_path=profile_path))
    errors.extend(validate_output_plan(manifest, profile))

    for section in sections:
        section_id = str(section.get("section_id", "<unknown>"))
        for raw_path in style_paths(section):
            css_path = repo_path(raw_path)
            if not css_path.is_file():
                # READY plans may point at a file that the worker has not created yet.
                continue
            errors.extend(
                validate_css_text(
                    css_path.read_text(encoding="utf-8"),
                    contract,
                    source=f"section {section_id} {raw_path}",
                    section=section,
                )
            )
    return list(dict.fromkeys(errors))


def candidate_manifests() -> list[Path]:
    found: list[Path] = []
    for base in (ROOT / "experiments", ROOT / "references", ROOT / "contracts"):
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.yaml")):
            if "section-manifest" in path.name:
                found.append(path)
    return found


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate produced/planned section output against Implementation Profile and breakpoint ownership"
    )
    parser.add_argument("manifest", nargs="?", help="Repository-relative section manifest; omit to scan active manifests")
    args = parser.parse_args()

    targets = [repo_path(args.manifest)] if args.manifest else candidate_manifests()
    failures = 0
    for path in targets:
        try:
            errors = validate_manifest(path)
        except Exception as exc:
            errors = [str(exc)]
        relative = path.relative_to(ROOT)
        if errors:
            failures += 1
            print(f"FAIL {relative} execution-output-contract")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {relative} execution-output-contract")
    if not targets:
        print("SKIP execution-output-contract: no section manifests found")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
