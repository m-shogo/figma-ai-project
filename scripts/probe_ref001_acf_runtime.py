#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Protocol, Sequence
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_IMPORT = ROOT / "experiments" / "ref001-wordpress-acf" / "artifacts" / "acf-import-bundle.json"
MIN_ACF_CLI_VERSION = (6, 8, 0)


@dataclass(frozen=True)
class CommandResult:
    returncode: int
    stdout: str = ""
    stderr: str = ""


class Runner(Protocol):
    def run(self, args: Sequence[str], *, timeout: int) -> CommandResult: ...


class SubprocessRunner:
    def run(self, args: Sequence[str], *, timeout: int) -> CommandResult:
        try:
            completed = subprocess.run(
                list(args),
                text=True,
                capture_output=True,
                timeout=timeout,
                check=False,
            )
        except FileNotFoundError:
            return CommandResult(127, "", "command not found")
        except subprocess.TimeoutExpired:
            return CommandResult(124, "", "command timed out")
        return CommandResult(completed.returncode, completed.stdout.strip(), completed.stderr.strip())


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def parse_version(value: str) -> tuple[int, int, int] | None:
    match = re.search(r"(\d+)\.(\d+)(?:\.(\d+))?", value or "")
    if not match:
        return None
    return tuple(int(part or 0) for part in match.groups())  # type: ignore[return-value]


def validate_site_url(value: str) -> str:
    if not value:
        return ""
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("--site-url must be an absolute http/https URL")
    if parsed.username or parsed.password:
        raise ValueError("--site-url must not contain credentials")
    return value.rstrip("/")


def load_item_keys(path: Path) -> list[str]:
    if not path.is_file():
        raise ValueError(f"ACF import file not found: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    items = payload if isinstance(payload, list) else [payload]
    keys: list[str] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        key = str(item.get("key", ""))
        if key.startswith("group_"):
            keys.append(key)
    if not keys:
        raise ValueError("ACF import file contains no field-group keys")
    return keys


def wp_base(wp_binary: str, wp_path: Path, site_url: str) -> list[str]:
    args = [wp_binary, f"--path={wp_path.resolve()}"]
    if site_url:
        args.append(f"--url={site_url}")
    return args


def check(runner: Runner, args: Sequence[str], *, timeout: int = 20) -> CommandResult:
    return runner.run(args, timeout=timeout)


def build_verify_php(keys: Sequence[str]) -> str:
    encoded = json.dumps(list(keys), ensure_ascii=True)
    return (
        f"$keys = json_decode('{encoded}', true); "
        "foreach ($keys as $key) { "
        "$item = function_exists('acf_get_field_group') && strpos($key, 'group_') === 0 "
        "? acf_get_field_group($key) : null; "
        "echo $key . ':' . ($item ? '1' : '0') . PHP_EOL; }"
    )


def probe_runtime(
    *,
    runner: Runner,
    wp_binary: str,
    wp_path: Path,
    site_url: str,
    import_file: Path,
    execute_import: bool = False,
    acknowledge_disposable: bool = False,
) -> dict[str, object]:
    item_keys = load_item_keys(import_file)
    base = wp_base(wp_binary, wp_path, site_url)
    checks: dict[str, dict[str, object]] = {}
    blockers: list[str] = []

    wp_info = check(runner, [wp_binary, "--info"])
    checks["wp_cli"] = {"ok": wp_info.returncode == 0}
    if wp_info.returncode != 0:
        blockers.append("WP_CLI_UNAVAILABLE")
        return {
            "schema_version": 1,
            "checked_at": utc_now(),
            "status": "BLOCKED",
            "execution_mode": "PREFLIGHT_ONLY",
            "checks": checks,
            "blockers": blockers,
            "import_item_keys": item_keys,
            "admin_ui_interactive_smoke": "NOT_RUN",
        }

    installed = check(runner, [*base, "core", "is-installed"])
    checks["wordpress_installed"] = {"ok": installed.returncode == 0}
    if installed.returncode != 0:
        blockers.append("WORDPRESS_NOT_INSTALLED_AT_PATH")

    core = check(runner, [*base, "core", "version"])
    checks["wordpress_version"] = {
        "ok": core.returncode == 0,
        "version": core.stdout if core.returncode == 0 else "",
    }

    acf = check(
        runner,
        [*base, "eval", "echo defined('ACF_VERSION') ? ACF_VERSION : '';"],
    )
    acf_version = acf.stdout.strip() if acf.returncode == 0 else ""
    parsed_acf = parse_version(acf_version)
    acf_ready = parsed_acf is not None and parsed_acf >= MIN_ACF_CLI_VERSION
    checks["acf"] = {
        "ok": bool(acf_version),
        "version": acf_version,
        "meets_cli_minimum_6_8": acf_ready,
    }
    if not acf_version:
        blockers.append("ACF_NOT_ACTIVE_OR_VERSION_UNREADABLE")
    elif not acf_ready:
        blockers.append("ACF_VERSION_BELOW_6_8_CLI_IMPORT_REQUIREMENT")

    has_command = check(runner, [*base, "cli", "has-command", "acf json import"])
    command_ready = has_command.returncode == 0
    checks["acf_json_import_command"] = {"ok": command_ready}
    if not command_ready:
        blockers.append("ACF_JSON_IMPORT_COMMAND_UNAVAILABLE")

    if blockers:
        return {
            "schema_version": 1,
            "checked_at": utc_now(),
            "status": "BLOCKED",
            "execution_mode": "PREFLIGHT_ONLY",
            "checks": checks,
            "blockers": blockers,
            "import_item_keys": item_keys,
            "admin_ui_interactive_smoke": "NOT_RUN",
        }

    if not execute_import:
        return {
            "schema_version": 1,
            "checked_at": utc_now(),
            "status": "READY",
            "execution_mode": "PREFLIGHT_ONLY",
            "checks": checks,
            "blockers": [],
            "import_item_keys": item_keys,
            "cli_import_smoke": "NOT_RUN",
            "admin_ui_interactive_smoke": "NOT_RUN",
        }

    if not acknowledge_disposable:
        return {
            "schema_version": 1,
            "checked_at": utc_now(),
            "status": "BLOCKED",
            "execution_mode": "IMPORT_REQUESTED",
            "checks": checks,
            "blockers": ["DISPOSABLE_RUNTIME_ACK_REQUIRED"],
            "import_item_keys": item_keys,
            "cli_import_smoke": "NOT_RUN",
            "admin_ui_interactive_smoke": "NOT_RUN",
        }

    imported = check(runner, [*base, "acf", "json", "import", str(import_file.resolve())], timeout=60)
    checks["acf_json_import_execution"] = {
        "ok": imported.returncode == 0,
        "output": imported.stdout[:1000] if imported.returncode == 0 else "",
    }
    if imported.returncode != 0:
        return {
            "schema_version": 1,
            "checked_at": utc_now(),
            "status": "FAIL",
            "execution_mode": "CLI_IMPORT_SMOKE",
            "checks": checks,
            "blockers": ["ACF_JSON_IMPORT_FAILED"],
            "import_item_keys": item_keys,
            "cli_import_smoke": "FAIL",
            "admin_ui_interactive_smoke": "NOT_RUN",
        }

    verified = check(runner, [*base, "eval", build_verify_php(item_keys)])
    present: dict[str, bool] = {}
    if verified.returncode == 0:
        for line in verified.stdout.splitlines():
            if ":" not in line:
                continue
            key, value = line.rsplit(":", 1)
            if key in item_keys:
                present[key] = value.strip() == "1"
    all_present = verified.returncode == 0 and all(present.get(key, False) for key in item_keys)
    checks["imported_items_readback"] = {"ok": all_present, "items": present}

    return {
        "schema_version": 1,
        "checked_at": utc_now(),
        "status": "PASS" if all_present else "FAIL",
        "execution_mode": "CLI_IMPORT_SMOKE",
        "checks": checks,
        "blockers": [] if all_present else ["IMPORTED_ITEM_READBACK_FAILED"],
        "import_item_keys": item_keys,
        "cli_import_smoke": "PASS" if all_present else "FAIL",
        "admin_ui_interactive_smoke": "NOT_RUN",
        "evidence_note": (
            "ACF CLI import smoke exercises the documented import path but does not claim that a human/browser "
            "clicked through the WordPress Admin Tools UI."
        ),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Probe a real WordPress + ACF runtime for REF-001 import readiness")
    parser.add_argument("--wp-path", type=Path, required=True, help="Explicit WordPress installation path")
    parser.add_argument("--site-url", default="", help="Optional WP-CLI --url target; credentials are rejected")
    parser.add_argument("--wp-binary", default="wp")
    parser.add_argument("--import-file", type=Path, default=DEFAULT_IMPORT)
    parser.add_argument("--execute-import", action="store_true", help="Actually import the ACF JSON into the target DB")
    parser.add_argument(
        "--ack-disposable-runtime",
        action="store_true",
        help="Required together with --execute-import; confirms the target is safe for mutation",
    )
    parser.add_argument("--output-json", type=Path)
    parser.add_argument("--require-ready", action="store_true", help="Return non-zero unless status is READY or PASS")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        site_url = validate_site_url(args.site_url)
        result = probe_runtime(
            runner=SubprocessRunner(),
            wp_binary=args.wp_binary,
            wp_path=args.wp_path,
            site_url=site_url,
            import_file=args.import_file,
            execute_import=args.execute_import,
            acknowledge_disposable=args.ack_disposable_runtime,
        )
    except (ValueError, json.JSONDecodeError) as exc:
        print(f"FAIL REF-001 ACF runtime probe: {exc}", file=sys.stderr)
        return 2

    serialized = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output_json:
        args.output_json.parent.mkdir(parents=True, exist_ok=True)
        args.output_json.write_text(serialized, encoding="utf-8")
    print(serialized, end="")

    if args.require_ready and result.get("status") not in {"READY", "PASS"}:
        return 1
    return 0 if result.get("status") != "FAIL" else 1


if __name__ == "__main__":
    raise SystemExit(main())
