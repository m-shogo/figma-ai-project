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
from typing import Callable, Protocol, Sequence
from urllib.parse import urlsplit, urlunsplit


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


def sanitize_remote_url(value: str) -> tuple[str, bool, str]:
    value = value.strip()
    if not value:
        return "", False, "NONE"

    if "://" in value:
        parsed = urlsplit(value)
        if not parsed.scheme or not parsed.hostname:
            return "", True, "UNSAFE_OR_INVALID"
        host = parsed.hostname
        if parsed.port:
            host = f"{host}:{parsed.port}"
        sanitized = urlunsplit((parsed.scheme, host, parsed.path, "", ""))
        redacted = bool(parsed.username or parsed.password or parsed.query or parsed.fragment)
        return sanitized, redacted, "URL"

    # Common Git SSH scp form, e.g. git@github.com:owner/repo.git. The user part is
    # an SSH account name, not an embedded password/token.
    if "@" in value and ":" in value and not value.startswith(("/", "./", "../", "~")):
        return value, False, "SSH_SCP"

    # Local filesystem remotes can expose workstation paths. Preserve only the fact
    # that the remote is local, not the path itself.
    return "", True, "LOCAL_OR_UNCLASSIFIED"


def git_command(git_bin: str, root: Path, *args: str) -> list[str]:
    return [git_bin, "-C", str(root), *args]


def run(runner: Runner, args: Sequence[str]) -> CommandResult:
    return runner.run(args, timeout=15)


def capture(
    root: Path,
    *,
    git_bin: str = "git",
    runner: Runner | None = None,
    executable_lookup: Callable[[str], str | None] = shutil.which,
) -> dict:
    root = root.resolve()
    if not root.is_dir():
        raise ValueError(f"target path is not a directory: {root}")

    if "/" not in git_bin and executable_lookup(git_bin) is None:
        return {
            "schema_version": 1,
            "observed_at": utc_now(),
            "state": "GIT_UNAVAILABLE",
            "root": str(root),
            "head": "",
            "branch": "",
            "detached": False,
            "dirty": None,
            "changed_entry_count": None,
            "origin": {"value": "", "kind": "NONE", "credentials_or_sensitive_parts_redacted": False},
        }

    active_runner = runner or SubprocessRunner()
    inside = run(active_runner, git_command(git_bin, root, "rev-parse", "--is-inside-work-tree"))
    if inside.returncode != 0 or inside.stdout.strip().lower() != "true":
        return {
            "schema_version": 1,
            "observed_at": utc_now(),
            "state": "NOT_GIT_REPOSITORY",
            "root": str(root),
            "head": "",
            "branch": "",
            "detached": False,
            "dirty": None,
            "changed_entry_count": None,
            "origin": {"value": "", "kind": "NONE", "credentials_or_sensitive_parts_redacted": False},
        }

    head_result = run(active_runner, git_command(git_bin, root, "rev-parse", "HEAD"))
    branch_result = run(active_runner, git_command(git_bin, root, "branch", "--show-current"))
    status_result = run(active_runner, git_command(git_bin, root, "status", "--porcelain"))
    origin_result = run(active_runner, git_command(git_bin, root, "remote", "get-url", "origin"))

    if head_result.returncode != 0:
        return {
            "schema_version": 1,
            "observed_at": utc_now(),
            "state": "HEAD_UNAVAILABLE",
            "root": str(root),
            "head": "",
            "branch": branch_result.stdout if branch_result.returncode == 0 else "",
            "detached": False,
            "dirty": None,
            "changed_entry_count": None,
            "origin": {"value": "", "kind": "NONE", "credentials_or_sensitive_parts_redacted": False},
        }

    status_lines = [line for line in status_result.stdout.splitlines() if line.strip()] if status_result.returncode == 0 else []
    origin_raw = origin_result.stdout if origin_result.returncode == 0 else ""
    origin_value, origin_redacted, origin_kind = sanitize_remote_url(origin_raw)
    branch = branch_result.stdout.strip() if branch_result.returncode == 0 else ""

    return {
        "schema_version": 1,
        "observed_at": utc_now(),
        "state": "OBSERVED",
        "root": str(root),
        "head": head_result.stdout.strip(),
        "branch": branch,
        "detached": not bool(branch),
        "dirty": bool(status_lines),
        "changed_entry_count": len(status_lines),
        "origin": {
            "value": origin_value,
            "kind": origin_kind,
            "credentials_or_sensitive_parts_redacted": origin_redacted,
        },
        "claim_boundary": (
            "This captures a read-only Git baseline. A clean HEAD is suitable as starting-commit evidence; "
            "it does not prove the branch or remote is the owner-approved production target."
        ),
    }


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(description="Capture a secret-safe, read-only Git baseline for a production target repository.")
    value.add_argument("target", type=Path)
    value.add_argument("--git-bin", default="git")
    value.add_argument("--output", type=Path)
    value.add_argument("--require-clean", action="store_true")
    return value


def main() -> int:
    args = parser().parse_args()
    try:
        result = capture(args.target, git_bin=args.git_bin)
    except (OSError, ValueError) as exc:
        print(f"FAIL target Git baseline: {exc}", file=sys.stderr)
        return 2

    serialized = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(serialized, encoding="utf-8")
    print(serialized, end="")
    if args.require_clean and (result.get("state") != "OBSERVED" or result.get("dirty") is not False):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
