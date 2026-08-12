#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import probe_ref001_acf_runtime as ref001_probe
import probe_wordpress_acf_runtime as runtime_probe
import scan_wordpress_target as target_scan


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def candidate_stylesheet_slug(recon: dict) -> str:
    themes = recon.get("themes", [])
    if recon.get("selection_state") != "UNAMBIGUOUS" or len(themes) != 1:
        return ""
    path = str(themes[0].get("path", "")).rstrip("/")
    if not path or path == ".":
        return ""
    return Path(path).name


def coordinate(
    *,
    target_repo: Path,
    wp_path: Path | None = None,
    site_url: str = "",
    wp_binary: str = "wp",
    import_file: Path = ref001_probe.DEFAULT_IMPORT,
    runtime_runner: runtime_probe.Runner = runtime_probe.subprocess_runner,
    runtime_executable_lookup=runtime_probe.shutil.which,
    ref001_runner: ref001_probe.Runner | None = None,
) -> dict:
    recon = target_scan.scan(target_repo)

    runtime: dict
    ref001: dict
    if wp_path is None:
        runtime = {
            "status": "NOT_RUN",
            "runtime_state": "WP_PATH_NOT_SUPPLIED",
            "capabilities": {"admin_ui_smoke_executed": False},
            "blocking_reasons": ["A real WordPress path was not supplied."],
            "runtime": {},
        }
        ref001 = {
            "status": "NOT_RUN",
            "execution_mode": "PREFLIGHT_ONLY",
            "blockers": ["WP_PATH_NOT_SUPPLIED"],
            "admin_ui_interactive_smoke": "NOT_RUN",
        }
    else:
        runtime = runtime_probe.probe(
            wp_bin=wp_binary,
            wp_path=wp_path,
            runner=runtime_runner,
            executable_lookup=runtime_executable_lookup,
        )
        validated_url = ref001_probe.validate_site_url(site_url)
        ref001 = ref001_probe.probe_runtime(
            runner=ref001_runner or ref001_probe.SubprocessRunner(),
            wp_binary=wp_binary,
            wp_path=wp_path,
            site_url=validated_url,
            import_file=import_file,
            execute_import=False,
            acknowledge_disposable=False,
        )

    static_slug = candidate_stylesheet_slug(recon)
    runtime_slug = str(runtime.get("runtime", {}).get("active_theme_stylesheet", ""))
    if static_slug and runtime_slug:
        theme_consistency = "MATCH" if static_slug == runtime_slug else "MISMATCH"
    else:
        theme_consistency = "UNDETERMINED"

    binding_blockers: list[str] = []
    if recon.get("selection_state") != "UNAMBIGUOUS":
        binding_blockers.append(f"THEME_SELECTION_{recon.get('selection_state', 'UNDETERMINED')}")
    if wp_path is None:
        binding_blockers.append("WORDPRESS_RUNTIME_NOT_SUPPLIED")
    elif runtime.get("status") != "READY":
        binding_blockers.append(f"WORDPRESS_RUNTIME_{runtime.get('runtime_state', 'BLOCKED')}")
    if wp_path is not None and ref001.get("status") != "READY":
        binding_blockers.extend(str(value) for value in ref001.get("blockers", []))
    if theme_consistency == "MISMATCH":
        binding_blockers.append("STATIC_RUNTIME_THEME_MISMATCH")

    binding_ready = not binding_blockers
    completion_blockers = list(dict.fromkeys(binding_blockers + ["ADMIN_UI_SMOKE_NOT_RUN"]))

    return {
        "schema_version": 1,
        "observed_at": utc_now(),
        "status": "READY_FOR_PRODUCTION_BINDING_REVIEW" if binding_ready else "BLOCKED",
        "binding_readiness": {
            "ready": binding_ready,
            "blockers": list(dict.fromkeys(binding_blockers)),
            "theme_consistency": theme_consistency,
            "static_theme_stylesheet_slug": static_slug,
            "runtime_theme_stylesheet_slug": runtime_slug,
        },
        "completion_readiness": {
            "ready": False,
            "blockers": completion_blockers,
            "admin_ui_smoke_executed": False,
        },
        "target_reconnaissance": recon,
        "runtime_capability": runtime,
        "ref001_import_preflight": ref001,
        "claim_boundary": (
            "READY_FOR_PRODUCTION_BINDING_REVIEW means the supplied repository and runtime evidence are coherent enough "
            "to begin explicit production ownership binding. It never means production implementation or the required "
            "browser ADMIN_UI smoke is complete. No target files, plugins, users, field groups, or database records are mutated."
        ),
    }


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(
        description="Coordinate read-only WordPress target reconnaissance, runtime capability, and REF-001 ACF preflight."
    )
    value.add_argument("target_repo", type=Path)
    value.add_argument("--wp-path", type=Path)
    value.add_argument("--site-url", default="")
    value.add_argument("--wp-binary", default="wp")
    value.add_argument("--import-file", type=Path, default=ref001_probe.DEFAULT_IMPORT)
    value.add_argument("--output", type=Path)
    value.add_argument("--require-binding-ready", action="store_true")
    return value


def main() -> int:
    args = parser().parse_args()
    try:
        result = coordinate(
            target_repo=args.target_repo,
            wp_path=args.wp_path,
            site_url=args.site_url,
            wp_binary=args.wp_binary,
            import_file=args.import_file,
        )
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"FAIL WordPress target readiness coordinator: {exc}", file=sys.stderr)
        return 2

    serialized = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(serialized, encoding="utf-8")
    print(serialized, end="")
    if args.require_binding_ready and not result["binding_readiness"]["ready"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
