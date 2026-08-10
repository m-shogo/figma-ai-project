#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import yaml

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REGISTRY = ROOT / "config" / "update-sources.yaml"
VALID_KINDS = {"GITHUB_RELEASES", "XML_FEED", "JSON_DIGEST", "HTML_DIGEST"}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML must be an object: {path}")
    return value


def _string_list_errors(value: Any, label: str, *, nonempty: bool = True) -> list[str]:
    if not isinstance(value, list):
        return [f"{label} must be an array"]
    values = [str(item).strip() for item in value if isinstance(item, str)]
    errors: list[str] = []
    if len(values) != len(value) or any(not item for item in values):
        errors.append(f"{label} must contain only non-empty strings")
    if nonempty and not values:
        errors.append(f"{label} must not be empty")
    if len(values) != len(set(values)):
        errors.append(f"{label} must not contain duplicates")
    return errors


def _activation_errors(lane_name: str, lane: dict[str, Any]) -> list[str]:
    required = lane.get("required_for_significant_run")
    if required is not None and not isinstance(required, bool):
        return [f"lane {lane_name}: required_for_significant_run must be boolean when present"]
    if required is True:
        return []

    activation = lane.get("activation")
    if not isinstance(activation, dict):
        return [f"lane {lane_name}: conditional lane requires activation"]
    profile_any = activation.get("company_profile_any")
    if not isinstance(profile_any, dict):
        return [f"lane {lane_name}: activation.company_profile_any is required"]

    browsers = profile_any.get("browsers", [])
    engines = profile_any.get("engines", [])
    errors = [
        *_string_list_errors(browsers, f"lane {lane_name}: activation browsers", nonempty=False),
        *_string_list_errors(engines, f"lane {lane_name}: activation engines", nonempty=False),
    ]
    if isinstance(browsers, list) and isinstance(engines, list) and not browsers and not engines:
        errors.append(f"lane {lane_name}: activation requires at least one browser or engine")
    return errors


def _source_errors(lane_name: str, index: int, source: dict[str, Any]) -> list[str]:
    prefix = f"lane {lane_name} source[{index}]"
    errors: list[str] = []

    source_id = str(source.get("id", "")).strip()
    if not source_id:
        errors.append(f"{prefix}: id is required")

    kind = str(source.get("kind", "")).strip()
    if kind not in VALID_KINDS:
        errors.append(f"{prefix}: unsupported kind {kind!r}")

    authority = str(source.get("authority", "")).strip()
    if authority != "OFFICIAL":
        errors.append(
            f"{prefix}: authority must be OFFICIAL; community/practitioner discovery is not a production Radar source"
        )

    url = str(source.get("url", "")).strip()
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        errors.append(f"{prefix}: url must be an absolute https URL")

    errors.extend(_string_list_errors(source.get("topics"), f"{prefix}: topics"))
    errors.extend(_string_list_errors(source.get("impacts"), f"{prefix}: impacts"))

    if "include_keywords" in source:
        errors.extend(
            _string_list_errors(
                source.get("include_keywords"),
                f"{prefix}: include_keywords",
            )
        )

    if kind == "GITHUB_RELEASES":
        repo = str(source.get("repo", "")).strip()
        parts = repo.split("/")
        if len(parts) != 2 or not all(parts):
            errors.append(f"{prefix}: GITHUB_RELEASES requires repo in owner/name form")

    return errors


def registry_errors(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if data.get("schema_version") != 2:
        errors.append("update source registry schema_version must be 2")

    lanes = data.get("lanes")
    if not isinstance(lanes, dict) or not lanes:
        return [*errors, "lanes must be a non-empty object"]

    seen_ids: dict[str, str] = {}
    for raw_lane_name, raw_lane in lanes.items():
        lane_name = str(raw_lane_name).strip()
        if not lane_name:
            errors.append("lane name must not be empty")
            continue
        if not isinstance(raw_lane, dict):
            errors.append(f"lane {lane_name}: value must be an object")
            continue

        errors.extend(_activation_errors(lane_name, raw_lane))
        sources = raw_lane.get("sources")
        if not isinstance(sources, list) or not sources:
            errors.append(f"lane {lane_name}: sources must be a non-empty array")
            continue

        for index, raw_source in enumerate(sources):
            if not isinstance(raw_source, dict):
                errors.append(f"lane {lane_name} source[{index}]: source must be an object")
                continue
            errors.extend(_source_errors(lane_name, index, raw_source))
            source_id = str(raw_source.get("id", "")).strip()
            if not source_id:
                continue
            previous_lane = seen_ids.get(source_id)
            if previous_lane is not None:
                errors.append(
                    f"duplicate source id {source_id!r}: lanes {previous_lane} and {lane_name}"
                )
            else:
                seen_ids[source_id] = lane_name

    return errors


def main() -> int:
    try:
        data = load_yaml(DEFAULT_REGISTRY)
        errors = registry_errors(data)
    except Exception as exc:
        errors = [str(exc)]

    if errors:
        print(f"FAIL {DEFAULT_REGISTRY.relative_to(ROOT)}")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(f"PASS {DEFAULT_REGISTRY.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())