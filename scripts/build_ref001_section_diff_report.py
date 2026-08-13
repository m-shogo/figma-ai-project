#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'review-dashboard/manifests/ref001-run-2.json').read_text(encoding='utf-8'))
probes = json.loads((ROOT / 'experiments/ref001-blind-clean-20260812/evidence/final/latest/runtime-probes.json').read_text(encoding='utf-8'))
out = Path(sys.argv[1] if len(sys.argv) > 1 else '_site/ref-001/latest/review/section-diffs').resolve()
out.mkdir(parents=True, exist_ok=True)
probe_by_width = {int(item['width']): item for item in probes}
rows = []

for viewport_key in ('pc', 'sp'):
    viewport = manifest['viewports'][viewport_key]
    width = int(viewport['width'])
    web_full = ROOT / viewport['web_capture_source']
    figma_full = ROOT / viewport['figma_capture_source']
    actual = probe_by_width[width]['sections']
    by_name = {}
    for item in actual:
        by_name.setdefault(item['name'], []).append(item)

    for section in manifest['sections']:
        if section['id'] == 'full-page' or not section.get('web_selector'):
            continue
        probe_name = 'shared-cta' if section['id'].startswith('shared-cta-') else section['id']
        current = by_name[probe_name][int(section.get('web_index', 0))]
        geometry = section['geometry'][viewport_key]
        web_top, web_height = int(current['top']), int(current['height'])
        figma_top = int(geometry['top']) + int(viewport.get('figma_device_chrome_px', 0))
        figma_height = int(geometry['height'])
        stem = f'{viewport_key}-{section["id"]}'
        web_target = out / f'{stem}-web.png'
        figma_target = out / f'{stem}-figma.png'
        diff_target = out / f'{stem}-diff.png'
        subprocess.run([sys.executable, str(ROOT/'scripts/crop_png.py'), str(web_full), str(web_target), '0', str(web_top), str(width), str(web_height)], check=True)
        subprocess.run([sys.executable, str(ROOT/'scripts/crop_png.py'), str(figma_full), str(figma_target), '0', str(figma_top), str(width), str(figma_height)], check=True)
        ratio = float(subprocess.check_output([sys.executable, str(ROOT/'scripts/diff_png.py'), str(web_target), str(figma_target), str(diff_target), '0.14'], text=True).strip())
        rows.append({'viewport': viewport_key.upper(), 'id': section['id'], 'label': section['label'], 'ratio': ratio, 'web_height': web_height, 'figma_height': figma_height})

cards = []
for row in rows:
    stem = f'{row["viewport"].lower()}-{row["id"]}'
    cards.append(f'<article><h2>{row["label"]} / {row["viewport"]}</h2><p>差分 {row["ratio"]*100:.2f}% · 高さ Web {row["web_height"]}px / Figma {row["figma_height"]}px</p><div><figure><figcaption>Web</figcaption><img src="./{stem}-web.png"></figure><figure><figcaption>Figma</figcaption><img src="./{stem}-figma.png"></figure><figure><figcaption>Diff</figcaption><img src="./{stem}-diff.png"></figure></div></article>')
style = 'body{font:14px system-ui;margin:20px;background:#f5f5f5;color:#222}header{position:sticky;top:0;background:#fff;padding:12px 16px;border:1px solid #ddd;z-index:2}article{background:#fff;border:1px solid #ddd;border-radius:10px;padding:14px;margin:16px 0}article>div{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}figure{margin:0}img{width:100%;height:auto;display:block;border:1px solid #ddd}@media(max-width:800px){article>div{grid-template-columns:1fr}}'
html = f'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>REF-001 Section Diff</title><style>{style}</style><header><strong>REF-001 Section-local Visual Diff</strong><div>各Sectionを実Top/Heightで個別に位置合わせ。上のSectionの縦ズレを下へ伝播させないStandard差分です。</div></header>' + ''.join(cards)
(out/'index.html').write_text(html, encoding='utf-8')
(out/'report.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'PASS section-local diff report: {len(rows)} sections')
