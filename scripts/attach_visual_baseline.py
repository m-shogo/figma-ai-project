#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASELINE = ROOT / "review-dashboard" / "baselines" / "ref001" / "baseline.json"
BASELINE_JS = ROOT / "review-dashboard" / "app" / "baseline-review.js"


class BaselineAttachError(RuntimeError):
    pass


def load_json(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise BaselineAttachError(f"cannot read JSON {path}: {exc}") from exc
    if not isinstance(payload, dict):
        raise BaselineAttachError(f"JSON root must be an object: {path}")
    return payload


def repo_path(value: str) -> Path:
    path = (ROOT / value).resolve()
    try:
        path.relative_to(ROOT.resolve())
    except ValueError as exc:
        raise BaselineAttachError(f"baseline path escapes repository: {value}") from exc
    return path


def review_dirs(output: Path, reference_id: str) -> list[Path]:
    root = output / reference_id.lower()
    result: list[Path] = []
    latest = root / "latest" / "review"
    if latest.is_dir():
        result.append(latest)
    runs = root / "runs"
    if runs.is_dir():
        result.extend(sorted(path / "review" for path in runs.iterdir() if (path / "review").is_dir()))
    return result


def patch_review(review_dir: Path, baseline: dict[str, Any], captures: dict[str, Path]) -> None:
    manifest_path = review_dir / "manifest.json"
    index_path = review_dir / "index.html"
    if not manifest_path.is_file() or not index_path.is_file():
        raise BaselineAttachError(f"review output incomplete: {review_dir}")

    manifest = load_json(manifest_path)
    generated = manifest.setdefault("generated", {})
    generated_captures = generated.setdefault("captures", {})
    captures_dir = review_dir / "captures"
    captures_dir.mkdir(parents=True, exist_ok=True)

    for viewport, source in captures.items():
        target_name = f"baseline-{viewport}.png"
        shutil.copy2(source, captures_dir / target_name)
        viewport_capture = generated_captures.setdefault(viewport, {})
        viewport_capture["baseline"] = f"./captures/{target_name}"
        viewport_capture["baseline_available"] = True

    generated["baseline"] = {
        "schema_version": baseline.get("schema_version", 1),
        "approved_source_commit": baseline.get("approved_source_commit"),
        "approved_after_pr": baseline.get("approved_after_pr"),
        "hard_gate": bool(baseline.get("policy", {}).get("hard_gate", False)),
        "promotion_requires_human_approval": bool(
            baseline.get("policy", {}).get("promotion_requires_human_approval", True)
        ),
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    shutil.copy2(BASELINE_JS, review_dir / "baseline-review.js")
    html = index_path.read_text(encoding="utf-8")
    marker = '<script src="./baseline-review.js" defer></script>'
    if marker not in html:
        html = html.replace("</body>", f"  {marker}\n</body>", 1)
        index_path.write_text(html, encoding="utf-8")


def write_preview_hub(output: Path) -> None:
    hub = """<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Figma AI Project — Preview Hub</title>
<style>
:root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f6f7f9;color:#17191d}
*{box-sizing:border-box}body{margin:0;padding:48px 20px 72px}.wrap{width:min(920px,100%);margin:0 auto}h1{margin:0;font-size:clamp(28px,5vw,46px);letter-spacing:-.04em}.lead{margin:12px 0 34px;color:#666d78;line-height:1.7}.section-title{margin:32px 0 12px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#737b87}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.card{display:block;min-height:148px;padding:20px;border:1px solid #dfe3e8;border-radius:18px;background:#fff;color:inherit;text-decoration:none;box-shadow:0 8px 28px rgba(20,28,38,.05);transition:.18s ease}.card:hover{transform:translateY(-2px);border-color:#aab2bd;box-shadow:0 12px 34px rgba(20,28,38,.09)}.card.primary{border-color:#292f39;background:#1e232b;color:#fff}.top{display:flex;align-items:center;justify-content:space-between;gap:12px}.badge{display:inline-flex;padding:5px 8px;border-radius:999px;background:#eef1f4;color:#555d68;font-size:11px;font-weight:700}.primary .badge{background:rgba(255,255,255,.14);color:#fff}.name{margin:20px 0 6px;font-size:20px;font-weight:750}.desc{margin:0;color:#707783;font-size:13px;line-height:1.6}.primary .desc{color:#cbd1da}.arrow{font-size:20px}.note{margin-top:30px;padding:14px 16px;border-radius:12px;background:#eceff3;color:#5e6672;font-size:12px;line-height:1.65}@media(max-width:680px){body{padding-top:28px}.grid{grid-template-columns:1fr}.card{min-height:128px}.name{margin-top:16px}}
</style>
</head>
<body><main class="wrap">
<h1>Preview Hub</h1>
<p class="lead">REF-001の完成作業・比較版と、武道館REF-002をここから直接開けます。各カードは新しいタブで開きます。</p>
<h2 class="section-title">REF-001</h2>
<div class="grid">
<a class="card primary" href="./ref-001/latest/preview/" target="_blank" rel="noopener"><div class="top"><span class="badge">今ここを見る</span><span class="arrow">↗</span></div><div class="name">最新作業版 / Latest</div><p class="desc">人の目で確認しながら細かく修正していく現行版。</p></a>
<a class="card" href="./ref-001/final/preview/" target="_blank" rel="noopener"><div class="top"><span class="badge">承認済み</span><span class="arrow">↗</span></div><div class="name">完成版 / Final</div><p class="desc">明示的に完成承認した時だけ更新する保存版。</p></a>
<a class="card" href="./ref-001/v2/preview/" target="_blank" rel="noopener"><div class="top"><span class="badge">比較固定</span><span class="arrow">↗</span></div><div class="name">V2</div><p class="desc">Typography数値一致後、V3の設計改善を取り込む前の固定版。</p></a>
<a class="card" href="./ref-001/v3/preview/" target="_blank" rel="noopener"><div class="top"><span class="badge">比較固定</span><span class="arrow">↗</span></div><div class="name">V3</div><p class="desc">保護中Draft PR #92の独立fixture固定版。</p></a>
</div>
<h2 class="section-title">REF-002</h2>
<div class="grid">
<a class="card" href="./ref-002/latest/preview/" target="_blank" rel="noopener"><div class="top"><span class="badge">武道館</span><span class="arrow">↗</span></div><div class="name">日本武道館 / Latest QA</div><p class="desc">実画像込みの最新QA snapshot。WordPress化は別作業で進行。</p></a>
<a class="card" href="./ref-001/latest/review/" target="_blank" rel="noopener"><div class="top"><span class="badge">QA</span><span class="arrow">↗</span></div><div class="name">REF-001 Human Review</div><p class="desc">Figma比較・Section Diff・Human Review用。</p></a>
</div>
<p class="note">運用: <strong>Latest</strong> はレビュー中に更新、<strong>Final</strong> は完成承認時のみ更新、V2/V3は比較用固定版です。</p>
</main></body></html>"""
    (output / "index.html").write_text(hub, encoding="utf-8")

    ref001_root = output / "ref-001"
    ref001_root.mkdir(parents=True, exist_ok=True)
    ref001_hub = hub.replace('href="./ref-001/', 'href="./').replace('href="./ref-002/', 'href="../ref-002/')
    (ref001_root / "index.html").write_text(ref001_hub, encoding="utf-8")


def attach(*, output: Path, baseline_path: Path) -> int:
    baseline = load_json(baseline_path)
    reference_id = str(baseline.get("reference_id", "")).strip()
    if not reference_id:
        raise BaselineAttachError("baseline requires reference_id")
    if not BASELINE_JS.is_file():
        raise BaselineAttachError(f"missing baseline review app: {BASELINE_JS}")

    raw_captures = baseline.get("captures")
    if not isinstance(raw_captures, dict) or not raw_captures:
        raise BaselineAttachError("baseline requires captures")

    captures: dict[str, Path] = {}
    for viewport in ("pc", "sp"):
        value = str(raw_captures.get(viewport, "")).strip()
        if not value:
            raise BaselineAttachError(f"baseline missing {viewport} capture")
        source = repo_path(value)
        if not source.is_file():
            raise BaselineAttachError(f"baseline capture missing: {source}")
        captures[viewport] = source

    targets = review_dirs(output.resolve(), reference_id)
    if not targets:
        raise BaselineAttachError(f"no generated review directories found under {output}")
    for target in targets:
        patch_review(target, baseline, captures)

    write_preview_hub(output.resolve())

    print(
        f"PASS visual baseline attached: {reference_id} -> {len(targets)} review outputs "
        f"(approved {baseline.get('approved_source_commit', 'unknown')}); preview hub written"
    )
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Attach approved Web baseline captures to Human Review output")
    parser.add_argument("--output", type=Path, default=ROOT / "_site")
    parser.add_argument("--baseline", type=Path, default=DEFAULT_BASELINE)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        return attach(output=args.output, baseline_path=args.baseline.resolve())
    except BaselineAttachError as exc:
        print(f"FAIL visual baseline attach: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
