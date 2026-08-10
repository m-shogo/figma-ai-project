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
    def passed(self) -> bool:
        return self.returncode == 0


CHECKS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("records", ("scripts/validate_records.py",)),
    ("company_policy", ("scripts/validate_company_policy.py",)),
    ("environment_contract", ("scripts/validate_environment_contract.py",)),
    ("global_figma_profile", ("scripts/validate_figma_profile.py",)),
    ("section_figma_profiles", ("scripts/validate_figma_structure_profiles.py",)),
    ("section_profile_lineage", ("scripts/validate_figma_structure_profile.py",)),
    ("component_token_resolution", ("scripts/validate_resolution_tables.py",)),
    ("breakpoint_contract", ("scripts/validate_breakpoint_contract.py",)),
    ("section_discovery", ("scripts/validate_section_discovery.py",)),
    ("parallel_paths", ("scripts/validate_parallel_paths.py",)),
    ("parallel_isolation", ("scripts/validate_parallel_isolation.py",)),
    ("run_lineage", ("scripts/validate_run_lineage.py",)),
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
        if args.fail_fast and not result.passed:
            break

    passed = sum(result.passed for result in results)
    failed = len(results) - passed

    if args.json:
        payload = {
            "passed": passed,
            "failed": failed,
            "results": [
                {
                    **asdict(result),
                    "passed": result.passed,
                }
                for result in results
            ],
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        for result in results:
            status = "PASS" if result.passed else "FAIL"
            print(f"{status} {result.name}")
            if not result.passed:
                if result.stdout.strip():
                    print(result.stdout.rstrip())
                if result.stderr.strip():
                    print(result.stderr.rstrip(), file=sys.stderr)
        print(f"\nSummary: {passed} passed / {failed} failed")

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
