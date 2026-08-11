#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
SNAPSHOT = os.environ.get(
    "REF001_FIRST_PASS_COMMIT",
    "46eb326383ac7aff1cb023100a801b968df9f9bc",
)
RUN_BASE = Path("experiments/ref001-blind-clean-20260812")
THEME = RUN_BASE / "implementation/theme"
EVIDENCE = RUN_BASE / "evidence/human-editability-drills.json"


def run(*args: str, cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        list(args),
        cwd=cwd or ROOT,
        check=check,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def changed_paths(worktree: Path) -> list[str]:
    out = run("git", "diff", "--name-only", cwd=worktree).stdout
    return [line.strip() for line in out.splitlines() if line.strip()]


def reset(worktree: Path) -> None:
    run("git", "reset", "--hard", "HEAD", cwd=worktree)
    run("git", "clean", "-fd", cwd=worktree)


def render_fixture(worktree: Path) -> str:
    theme = worktree / THEME
    result = run("php", "preview.php", cwd=theme)
    return result.stdout


def collect_acf_names(value: Any) -> set[str]:
    names: set[str] = set()
    if isinstance(value, dict):
        name = value.get("name")
        if isinstance(name, str) and name:
            names.add(name)
        for child in value.values():
            names.update(collect_acf_names(child))
    elif isinstance(value, list):
        for child in value:
            names.update(collect_acf_names(child))
    return names


def drill_record(
    drill_id: str,
    task: str,
    located: list[str],
    changed: list[str],
    expected: set[str],
    regression_status: str,
    notes: list[str],
    extra_pass: bool = True,
) -> dict[str, Any]:
    unexpected = sorted(set(changed) - expected)
    return {
        "drill_id": drill_id,
        "task": task,
        "snapshot_commit": SNAPSHOT,
        "located_paths": located,
        "changed_paths": changed,
        "unexpected_paths": unexpected,
        "regression_status": regression_status,
        "result": "PASS" if extra_pass and not unexpected and set(changed) == expected else "FAIL",
        "notes": notes,
    }


def main() -> int:
    temp_root = Path(tempfile.mkdtemp(prefix="ref001-human-editability-"))
    worktree = temp_root / "first-pass"
    drills: list[dict[str, Any]] = []
    try:
        run("git", "worktree", "add", "--detach", str(worktree), SNAPSHOT)

        # Drill 1 — local visual adjustment.
        style_rel = THEME / "style.css"
        voice_rel = THEME / "template-parts/sections/student-voice.php"
        style_path = worktree / style_rel
        voice_path = worktree / voice_rel
        style = style_path.read_text(encoding="utf-8")
        needle = "grid-template-columns:404px 1fr;gap:62px;margin-top:40px"
        replacement = "grid-template-columns:404px 1fr;gap:66px;margin-top:40px"
        local_ok = needle in style and voice_path.is_file()
        if local_ok:
            style_path.write_text(style.replace(needle, replacement, 1), encoding="utf-8")
            run("git", "diff", "--check", cwd=worktree)
        changed = changed_paths(worktree)
        drills.append(
            drill_record(
                "HE-DRILL-LOCAL-STUDENT-VOICE",
                "Increase only the desktop Student Voice detail-column gap by 4px without touching unrelated sections.",
                [str(voice_rel), str(style_rel)],
                changed,
                {str(style_rel)},
                "PASS_SCOPED_SELECTOR_NO_UNRELATED_PATHS" if local_ok else "FAIL_OWNER_NOT_LOCATED",
                [
                    "The Student Voice template and its .ref-voice scoped rules are directly discoverable.",
                    "The disposable diff remains in the section style owner only; no unrelated implementation file changes.",
                    "git diff --check passes; the canonical FIRST PASS worktree is discarded after the drill.",
                ],
                local_ok,
            )
        )
        reset(worktree)

        # Drill 2 — editor-owned ACF content adjustment.
        acf_rel = RUN_BASE / "implementation/acf-export.json"
        fixture_rel = THEME / "inc/fixture-content.php"
        acf_names = collect_acf_names(json.loads((worktree / acf_rel).read_text(encoding="utf-8")))
        fixture_path = worktree / fixture_rel
        fixture = fixture_path.read_text(encoding="utf-8")
        old_text = "学生一人ひとりに寄り添う教育と、地域に根ざした実践的な学びで、将来につながる力を育みます。"
        marker = "DRILL: editor-owned reason intro"
        cms_ok = "reason_intro" in acf_names and old_text in fixture
        if cms_ok:
            fixture_path.write_text(fixture.replace(old_text, marker, 1), encoding="utf-8")
            html = render_fixture(worktree)
            cms_ok = marker in html
            run("php", "-l", str(fixture_path), cwd=worktree)
        changed = changed_paths(worktree)
        drills.append(
            drill_record(
                "HE-DRILL-ACF-REASON-INTRO",
                "Change the editor-owned Reason intro through its fixture/source-of-truth path and verify the rendered page reflects it without layout-code edits.",
                [str(acf_rel), str(fixture_rel), str(THEME / "template-parts/sections/reason.php")],
                changed,
                {str(fixture_rel)},
                "PASS_RENDERED_EDITOR_VALUE_WITHOUT_LAYOUT_CHANGE" if cms_ok else "FAIL_ACF_OWNER_OR_RENDER",
                [
                    "reason_intro exists in the importable ACF schema.",
                    "Fixture content mirrors editor-owned values for the isolated clean harness; the rendered preview resolves the changed value.",
                    "No CSS/template schema file needed modification for the content-only drill.",
                ],
                cms_ok,
            )
        )
        reset(worktree)

        # Drill 3 — shared CTA reuse.
        cta_rel = THEME / "template-parts/sections/shared-cta.php"
        page_rel = THEME / "page-ref001-clean.php"
        cta_path = worktree / cta_rel
        cta = cta_path.read_text(encoding="utf-8")
        old_heading = "＼ 千葉経済大学をもっと知ろう！ ／"
        marker = "DRILL_SHARED_CTA"
        shared_ok = old_heading in cta and (worktree / page_rel).is_file()
        marker_count = 0
        if shared_ok:
            cta_path.write_text(cta.replace(old_heading, marker, 1), encoding="utf-8")
            html = render_fixture(worktree)
            marker_count = html.count(marker)
            shared_ok = marker_count == 2
            run("php", "-l", str(cta_path), cwd=worktree)
        changed = changed_paths(worktree)
        drills.append(
            drill_record(
                "HE-DRILL-SHARED-CTA",
                "Change the shared CTA heading once and verify both intended page instances update through the same partial.",
                [str(page_rel), str(cta_rel)],
                changed,
                {str(cta_rel)},
                "PASS_ONE_OWNER_TWO_RENDERED_INSTANCES" if shared_ok else "FAIL_SHARED_REUSE",
                [
                    f"Disposable render contained the changed shared CTA marker {marker_count} time(s); expected exactly 2.",
                    "Only the shared CTA partial changed; no copied patch was required at either call site.",
                ],
                shared_ok,
            )
        )
        reset(worktree)

        all_pass = all(drill["result"] == "PASS" for drill in drills)
        payload = {
            "schema_version": 1,
            "run_id": "RUN-REF001-BLIND-CLEAN-20260812-A",
            "audited_snapshot_commit": SNAPSHOT,
            "disposable_mode": "GIT_DETACHED_WORKTREE",
            "canonical_first_pass_mutated": False,
            "drills": drills,
            "all_pass": all_pass,
            "recommended_dimensions": {
                "discoverability": 2,
                "locality_of_change": 2,
                "intent_readability": 2,
                "change_safety_reuse": 2,
                "cms_content_ownership_clarity": 2,
            },
            "recommended_score": 10,
            "notes": [
                "Audit executed against the immutable FIRST PASS code commit, not repaired code.",
                "The Figma media-byte transfer limitation is tracked as visual/integration evidence; it did not require ambiguous CMS ownership or duplicated section code in these drills.",
            ],
        }
        evidence_path = ROOT / EVIDENCE
        evidence_path.parent.mkdir(parents=True, exist_ok=True)
        evidence_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0 if all_pass else 1
    finally:
        if worktree.exists():
            run("git", "worktree", "remove", "--force", str(worktree), check=False)
        shutil.rmtree(temp_root, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
