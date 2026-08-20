#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


@dataclass
class CheckResult:
    name: str
    command: list[str]
    returncode: int
    stdout: str
    stderr: str

    @property
    def skipped(self) -> bool:
        if self.returncode != 0:
            return False
        return any(
            line.lstrip().startswith("SKIP ")
            for stream in (self.stdout, self.stderr)
            for line in stream.splitlines()
        )

    @property
    def failed(self) -> bool:
        return self.returncode != 0

    @property
    def passed(self) -> bool:
        return not self.failed and not self.skipped

    @property
    def successful(self) -> bool:
        return self.returncode == 0

    @property
    def status(self) -> str:
        if self.failed:
            return "FAIL"
        if self.skipped:
            return "SKIP"
        return "PASS"


CHECKS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("update_sources", ("scripts/validate_update_sources.py",)),
    ("frontend_implementation_policy", ("scripts/validate_frontend_implementation_policy.py",)),
    ("implementation_profile", ("scripts/validate_implementation_profile.py",)),
    ("run_implementation_profile", ("scripts/validate_run_implementation_profile.py",)),
    ("records", ("scripts/validate_records.py",)),
    ("company_policy", ("scripts/validate_company_policy.py",)),
    ("environment_contract", ("scripts/validate_environment_contract.py",)),
    ("global_figma_profile", ("scripts/validate_figma_profile.py",)),
    ("figma_variable_modes", ("scripts/audit_figma_variable_modes.py",)),
    ("section_figma_profiles", ("scripts/validate_figma_structure_profiles.py",)),
    ("section_profile_lineage", ("scripts/validate_figma_structure_profile.py",)),
    ("component_token_resolution", ("scripts/validate_resolution_tables.py",)),
    ("breakpoint_contract", ("scripts/validate_breakpoint_contract.py",)),
    ("section_discovery", ("scripts/validate_section_discovery.py",)),
    ("parallel_paths", ("scripts/validate_parallel_paths.py",)),
    ("parallel_isolation", ("scripts/validate_parallel_isolation.py",)),
    ("run_lineage", ("scripts/validate_run_lineage.py",)),
    ("first_pass_evidence", ("scripts/first_pass_evidence.py", "validate")),
    ("clean_replay_pairs", ("scripts/prepare_clean_replay.py", "validate")),
    ("capture_environment", ("scripts/validate_capture_environment.py",)),
    ("run_deliverables", ("scripts/validate_run_deliverables.py",)),
    ("wordpress_theme_intake", ("scripts/validate_wordpress_theme_intake.py",)),
    ("unit_tests", ("-m", "unittest", "discover", "-s", "tests", "-p", "test_*.py")),
)


def run_check(name: str, args: tuple[str, ...]) -> CheckResult:
    command = [sys.executable, *args]
    completed = subprocess.run(
        command,
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    return CheckResult(
        name=name,
        command=command,
        returncode=completed.returncode,
        stdout=completed.stdout,
        stderr=completed.stderr,
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run the same research-record safety gates used before real section execution"
    )
    parser.add_argument("--json", action="store_true", help="emit machine-readable results")
    parser.add_argument(
        "--fail-fast",
        action="store_true",
        help="stop at the first failed check instead of collecting all failures",
    )
    args = parser.parse_args()

    results: list[CheckResult] = []
    for name, command in CHECKS:
        result = run_check(name, command)
        results.append(result)
        if args.fail_fast and result.failed:
            break

    passed = sum(result.passed for result in results)
    skipped = sum(result.skipped for result in results)
    failed = sum(result.failed for result in results)
    successful = passed + skipped

    if args.json:
        payload = {
            "passed": passed,
            "skipped": skipped,
            "failed": failed,
            "successful": successful,
            "results": [
                {
                    **asdict(result),
                    "status": result.status,
                    "passed": result.passed,
                    "skipped": result.skipped,
                    "failed": result.failed,
                    "successful": result.successful,
                }
                for result in results
            ],
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        for result in results:
            print(f"{result.status} {result.name}")
            if result.skipped:
                if result.stdout.strip():
                    print(result.stdout.rstrip())
                if result.stderr.strip():
                    print(result.stderr.rstrip(), file=sys.stderr)
            elif result.failed:
                if result.stdout.strip():
                    print(result.stdout.rstrip())
                if result.stderr.strip():
                    print(result.stderr.rstrip(), file=sys.stderr)
        print(f"\nSummary: {passed} passed / {skipped} skipped / {failed} failed")

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
