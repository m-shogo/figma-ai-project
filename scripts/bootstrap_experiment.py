#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"template must contain an object: {path}")
    return value


def dump_yaml(path: Path, value: dict[str, Any]) -> None:
    path.write_text(
        yaml.safe_dump(value, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )


def bootstrap(experiment_id: str, reference_id: str, *, destination_root: Path) -> Path:
    experiment_id = experiment_id.strip()
    reference_id = reference_id.strip()
    if not experiment_id:
        raise ValueError("experiment_id is required")
    if not reference_id:
        raise ValueError("reference_id is required")
    if "/" in experiment_id or ".." in experiment_id:
        raise ValueError("experiment_id must be a simple directory-safe identifier")

    target = destination_root / experiment_id
    if target.exists():
        raise FileExistsError(f"experiment directory already exists: {target}")

    target.mkdir(parents=True)
    (target / "runs").mkdir()
    (target / "artifacts").mkdir()

    try:
        reference = load_yaml(TEMPLATES / "reference-manifest.yaml")
        reference["reference_id"] = reference_id
        reference["status"] = "WAITING_FOR_REFERENCE"
        dump_yaml(target / "reference.yaml", reference)

        contract = load_yaml(TEMPLATES / "shared-contract.yaml")
        contract["contract_id"] = f"{experiment_id}-CONTRACT-001"
        contract["reference_id"] = reference_id
        contract["status"] = "DRAFT"
        contract["freeze"]["ready"] = False
        dump_yaml(target / "shared-contract.yaml", contract)

        sections = load_yaml(TEMPLATES / "section-manifest.yaml")
        sections["reference_id"] = reference_id
        sections["shared_contract"] = (target / "shared-contract.yaml").relative_to(ROOT).as_posix() if ROOT in target.parents else "shared-contract.yaml"
        sections["shared_contract_sha256"] = ""
        sections["foundation_commit"] = ""
        sections["sections"] = []
        dump_yaml(target / "section-manifest.yaml", sections)

        profile = load_yaml(TEMPLATES / "figma-structure-profile.yaml")
        profile["reference_id"] = reference_id
        profile["sections"] = []
        dump_yaml(target / "figma-structure-profile.yaml", profile)

        readme = f"""# {experiment_id}\n\nStatus: `WAITING_FOR_REFERENCE`\n\nReference ID: `{reference_id}`\n\nThis bundle intentionally contains **no invented design values**.\n\n## Order\n\n1. tooling update preflight\n2. fill and freeze `reference.yaml` from the real Figma/codebase evidence\n3. run global reconnaissance / section discovery\n4. fill `figma-structure-profile.yaml`\n5. draft `shared-contract.yaml`\n6. build/verify Shared Foundation\n7. freeze/fingerprint Shared Contract\n8. fill `section-manifest.yaml` ownership/dependencies/isolation\n9. run Production Gate\n10. create SECTION run records under `runs/`\n11. integrate / verify / repair / replay\n\nDo not mark sections READY while reference/structure/contract evidence is unresolved.\n"""
        (target / "README.md").write_text(readme, encoding="utf-8")
    except Exception:
        shutil.rmtree(target, ignore_errors=True)
        raise

    return target


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create an empty experiment bundle without inventing any design facts."
    )
    parser.add_argument("experiment_id", help="e.g. EXP-0001")
    parser.add_argument("reference_id", help="e.g. REF-0001")
    parser.add_argument(
        "--destination-root",
        default="experiments",
        help="Repository-relative destination root (default: experiments)",
    )
    args = parser.parse_args()

    try:
        destination_root = (ROOT / args.destination_root).resolve()
        if ROOT != destination_root and ROOT not in destination_root.parents:
            raise ValueError("destination root must stay inside the repository")
        destination_root.mkdir(parents=True, exist_ok=True)
        target = bootstrap(
            args.experiment_id,
            args.reference_id,
            destination_root=destination_root,
        )
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    try:
        relative = target.relative_to(ROOT)
    except ValueError:
        relative = target
    print(f"Created experiment bundle: {relative}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
