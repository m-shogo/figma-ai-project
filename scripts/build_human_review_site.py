#!/usr/bin/env python3
"""REF-001 Pages builder with frozen Final policy.

`/ref-001/latest/` is the active human-review target. `/ref-001/final/` is
rebuilt from an explicitly approved immutable commit. The companion snapshot
branch exists only so shallow CI checkouts can fetch that exact approved object;
it moves only after explicit human Final approval.
"""
from __future__ import annotations

import shutil
from pathlib import Path

import build_human_review_site_base as base

for _name in dir(base):
    if not _name.startswith('_') and _name not in globals():
        globals()[_name] = getattr(base, _name)

REF001_FINAL_SNAPSHOT_REF = "58eecd2cdb105a1bbda7a0b14fc5e9ada19ecaeb"
REF001_FINAL_SNAPSHOT_BRANCH = "snapshot/ref001-final"
_original_build_site = base.build_site


def ensure_final_snapshot_object() -> None:
    remote_ref = f"refs/remotes/origin/{REF001_FINAL_SNAPSHOT_BRANCH}"
    fetch_refspec = f"+refs/heads/{REF001_FINAL_SNAPSHOT_BRANCH}:{remote_ref}"
    try:
        base.subprocess.run(
            ["git", "fetch", "--no-tags", "--depth=1", "origin", fetch_refspec],
            cwd=base.ROOT,
            check=True,
            stdout=base.subprocess.PIPE,
            stderr=base.subprocess.PIPE,
            text=True,
            timeout=120,
        )
        branch_sha = base.subprocess.run(
            ["git", "rev-parse", remote_ref],
            cwd=base.ROOT,
            check=True,
            stdout=base.subprocess.PIPE,
            stderr=base.subprocess.PIPE,
            text=True,
            timeout=30,
        ).stdout.strip()
    except (base.subprocess.CalledProcessError, base.subprocess.TimeoutExpired) as exc:
        raise base.ReviewBuildError(f"cannot fetch frozen Final snapshot branch: {exc}") from exc

    if branch_sha != REF001_FINAL_SNAPSHOT_REF:
        raise base.ReviewBuildError(
            "REF-001 Final snapshot pointer drifted: "
            f"{REF001_FINAL_SNAPSHOT_BRANCH}={branch_sha}, expected={REF001_FINAL_SNAPSHOT_REF}. "
            "Move the snapshot branch only after explicit human Final approval."
        )


def build_final_snapshot(destination: Path) -> None:
    ensure_final_snapshot_object()
    with base.tempfile.TemporaryDirectory(prefix="ref001-final-") as temp_name:
        temp_root = Path(temp_name)
        # The explicit refspec above materializes the approved SHA in shallow CI,
        # so archive the immutable object directly instead of asking Git to infer
        # a branch/ref from a raw commit SHA.
        base.extract_git_paths(
            REF001_FINAL_SNAPSHOT_REF,
            [base.V2_THEME_REPO_PATH, base.RENDERED_REPO_PATH],
            temp_root,
        )
        theme = temp_root / base.V2_THEME_REPO_PATH
        rendered = temp_root / base.RENDERED_REPO_PATH
        html = base.run_php_preview(theme / "preview.php", theme, label="REF-001 Final snapshot")
        html = base.add_noindex(html.replace("<title>REF-001 FIRST PASS</title>", "<title>REF-001 Final Snapshot</title>", 1))

        destination.mkdir(parents=True, exist_ok=True)
        (destination / "index.html").write_text(html, encoding="utf-8")
        for relative_name in base.local_preview_stylesheets(html):
            source = theme / relative_name
            target = destination / relative_name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(base.require_file(source, f"Final stylesheet {relative_name}"), target)
        if (theme / "assets").is_dir():
            shutil.copytree(theme / "assets", destination / "assets", dirs_exist_ok=True)
        if rendered.is_dir():
            shutil.copytree(rendered, destination / "assets" / "images" / "ref001" / "rendered", dirs_exist_ok=True)

        base.write_snapshot_metadata(
            destination,
            label="REF-001 Final — human-approved frozen snapshot",
            ref=REF001_FINAL_SNAPSHOT_REF,
            source=f"{REF001_FINAL_SNAPSHOT_BRANCH} (moves only after explicit Final approval)",
            immutable=True,
        )


def build_site(*, manifest_path: Path = base.DEFAULT_MANIFEST, output: Path) -> Path:
    built = _original_build_site(manifest_path=manifest_path, output=output)
    final_preview = built / "ref-001" / "final" / "preview"
    if final_preview.exists():
        shutil.rmtree(final_preview)
    build_final_snapshot(final_preview)
    return built


base.build_site = build_site

if __name__ == "__main__":
    raise SystemExit(base.main())
