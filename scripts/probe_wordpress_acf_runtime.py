#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Sequence


@dataclass(frozen=True)
class CommandResult:
    returncode: int
    stdout: str = ""
    stderr: str = ""


Runner = Callable[[Sequence[str]], CommandResult]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def subprocess_runner(command: Sequence[str]) -> CommandResult:
    completed = subprocess.run(
        list(command),
        check=False,
        capture_output=True,
        text=True,
        timeout=20,
    )
    return CommandResult(completed.returncode, completed.stdout.strip(), completed.stderr.strip())


def wp_command(wp_bin: str, wp_path: Path | None, *args: str) -> list[str]:
    command = [wp_bin]
    if wp_path is not None:
        command.append(f"--path={wp_path}")
    command.extend(args)
    return command


def safe_run(runner: Runner, command: Sequence[str]) -> CommandResult:
    try:
        return runner(command)
    except (OSError, subprocess.SubprocessError) as exc:
        return CommandResult(127, "", type(exc).__name__)


def get_value(runner: Runner, command: Sequence[str]) -> str:
    result = safe_run(runner, command)
    return result.stdout.strip() if result.returncode == 0 else ""


def detect_acf_plugin(runner: Runner, wp_bin: str, wp_path: Path | None) -> dict[str, str]:
    for slug in ("advanced-custom-fields-pro", "advanced-custom-fields"):
        status = get_value(runner, wp_command(wp_bin, wp_path, "plugin", "get", slug, "--field=status"))
        if not status:
            continue
        version = get_value(runner, wp_command(wp_bin, wp_path, "plugin", "get", slug, "--field=version"))
        return {"slug": slug, "status": status, "version": version}
    return {"slug": "", "status": "", "version": ""}


def probe(
    *,
    wp_bin: str = "wp",
    wp_path: Path | None = None,
    runner: Runner = subprocess_runner,
    executable_lookup: Callable[[str], str | None] = shutil.which,
) -> dict:
    resolved_bin = executable_lookup(wp_bin) if "/" not in wp_bin else wp_bin
    if not resolved_bin:
        return {
            "schema_version": 1,
            "observed_at": utc_now(),
            "status": "BLOCKED",
            "runtime_state": "CLI_UNAVAILABLE",
            "capabilities": {
                "wp_cli": False,
                "wordpress_bootstrap": False,
                "acf_plugin_active": False,
                "acf_api_loaded": False,
                "administrator_present": False,
                "admin_ui_smoke_executed": False,
            },
            "blocking_reasons": ["WP-CLI executable is unavailable in the current environment."],
            "runtime": {},
        }

    core_version = get_value(runner, wp_command(wp_bin, wp_path, "core", "version"))
    if not core_version:
        return {
            "schema_version": 1,
            "observed_at": utc_now(),
            "status": "BLOCKED",
            "runtime_state": "WORDPRESS_BOOTSTRAP_UNAVAILABLE",
            "capabilities": {
                "wp_cli": True,
                "wordpress_bootstrap": False,
                "acf_plugin_active": False,
                "acf_api_loaded": False,
                "administrator_present": False,
                "admin_ui_smoke_executed": False,
            },
            "blocking_reasons": ["WP-CLI is callable but cannot bootstrap the target WordPress installation."],
            "runtime": {"wp_cli": wp_bin, "wp_path": str(wp_path) if wp_path else ""},
        }

    site_url = get_value(runner, wp_command(wp_bin, wp_path, "option", "get", "siteurl"))
    theme = get_value(runner, wp_command(wp_bin, wp_path, "eval", "echo get_stylesheet();"))
    acf = detect_acf_plugin(runner, wp_bin, wp_path)
    acf_active = acf["status"] == "active"
    acf_api = (
        get_value(
            runner,
            wp_command(
                wp_bin,
                wp_path,
                "eval",
                'echo function_exists("acf_get_field_groups") ? "1" : "0";',
            ),
        )
        == "1"
    )
    admin_count_text = get_value(
        runner,
        wp_command(wp_bin, wp_path, "user", "list", "--role=administrator", "--format=count"),
    )
    try:
        admin_count = int(admin_count_text or "0")
    except ValueError:
        admin_count = 0

    blockers: list[str] = []
    if not acf["slug"]:
        blockers.append("No supported ACF plugin installation was detected.")
    elif not acf_active:
        blockers.append(f"Detected ACF plugin {acf['slug']} is not active.")
    if acf_active and not acf_api:
        blockers.append("ACF is active but its field-group API is not loaded in the WordPress runtime.")
    if admin_count < 1:
        blockers.append("No WordPress administrator user was detected for an eventual ADMIN_UI smoke.")

    runtime_ready = acf_active and acf_api and admin_count >= 1
    return {
        "schema_version": 1,
        "observed_at": utc_now(),
        "status": "READY" if runtime_ready else "BLOCKED",
        "runtime_state": "RUNTIME_READY_UI_UNVERIFIED" if runtime_ready else "RUNTIME_BLOCKED",
        "capabilities": {
            "wp_cli": True,
            "wordpress_bootstrap": True,
            "acf_plugin_active": acf_active,
            "acf_api_loaded": acf_api,
            "administrator_present": admin_count >= 1,
            "admin_ui_smoke_executed": False,
        },
        "blocking_reasons": blockers,
        "runtime": {
            "wp_cli": wp_bin,
            "wp_path": str(wp_path) if wp_path else "",
            "wordpress_version": core_version,
            "site_url": site_url,
            "active_theme_stylesheet": theme,
            "acf_plugin_slug": acf["slug"],
            "acf_plugin_status": acf["status"],
            "acf_version": acf["version"],
            "administrator_count": admin_count,
        },
        "claim_boundary": (
            "READY means the real WordPress runtime can bootstrap ACF and has an administrator; "
            "it does not mean the required browser ADMIN_UI import smoke has been executed."
        ),
    }


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(
        description="Probe a real WordPress + ACF runtime without fabricating an ADMIN_UI smoke result."
    )
    value.add_argument("--wp-bin", default="wp")
    value.add_argument("--wp-path", type=Path)
    value.add_argument("--output", type=Path)
    value.add_argument("--require-runtime-ready", action="store_true")
    return value


def main() -> int:
    args = parser().parse_args()
    result = probe(wp_bin=args.wp_bin, wp_path=args.wp_path)
    serialized = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(serialized, encoding="utf-8")
    print(serialized, end="")
    if args.require_runtime_ready and result["status"] != "READY":
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
