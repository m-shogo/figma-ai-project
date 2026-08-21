from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CLEAN_CSS = ROOT / "experiments/ref001-frontend-standard-clean-replay/implementation/styles.css"
CLEAN_HTML = ROOT / "experiments/ref001-frontend-standard-clean-replay/implementation/index.html"
CURRENT_CSS = ROOT / "experiments/ref001-lp-package/lp/css/ref001.css"
CURRENT_PHP = ROOT / "experiments/ref001-lp-package/lp-originalPage.php"
OUT = ROOT / "experiments/ref001-frontend-standard-clean-replay/evidence/static-comparison.json"


def css_metrics(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    media = re.findall(r"@media\s*\(([^)]*)\)", text)
    return {
        "path": str(path.relative_to(ROOT)),
        "bytes": len(text.encode("utf-8")),
        "lines": len(text.splitlines()),
        "important": len(re.findall(r"!important\b", text)),
        "absolute": len(re.findall(r"position\s*:\s*absolute\b", text)),
        "fixed": len(re.findall(r"position\s*:\s*fixed\b", text)),
        "sticky": len(re.findall(r"position\s*:\s*sticky\b", text)),
        "width_px": len(re.findall(r"\bwidth\s*:\s*-?\d+(?:\.\d+)?px\b", text)),
        "height_px": len(re.findall(r"\bheight\s*:\s*-?\d+(?:\.\d+)?px\b", text)),
        "min_width_px": len(re.findall(r"\bmin-width\s*:\s*-?\d+(?:\.\d+)?px\b", text)),
        "min_height_px": len(re.findall(r"\bmin-height\s*:\s*-?\d+(?:\.\d+)?px\b", text)),
        "max_width_px": len(re.findall(r"\bmax-width\s*:\s*-?\d+(?:\.\d+)?px\b", text)),
        "max_height_px": len(re.findall(r"\bmax-height\s*:\s*-?\d+(?:\.\d+)?px\b", text)),
        "media_queries": media,
        "media_query_count": len(media),
        "clamp_calls": text.count("clamp("),
        "grid_declarations": len(re.findall(r"display\s*:\s*grid\b", text)),
        "flex_declarations": len(re.findall(r"display\s*:\s*flex\b", text)),
        "custom_property_defs": len(re.findall(r"--[\w-]+\s*:", text)),
        "layer_rules": len(re.findall(r"@layer\b", text)),
        "nowrap": len(re.findall(r"white-space\s*:\s*nowrap\b", text)),
    }


def source_metrics(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    return {
        "path": str(path.relative_to(ROOT)),
        "bytes": len(text.encode("utf-8")),
        "lines": len(text.splitlines()),
    }


result = {
    "schema_version": 1,
    "scope": "REF-001 current-final vs Frontend Standard Clean Replay",
    "clean": {
        "css": css_metrics(CLEAN_CSS),
        "markup": source_metrics(CLEAN_HTML),
    },
    "current_final": {
        "css": css_metrics(CURRENT_CSS),
        "markup": source_metrics(CURRENT_PHP),
    },
    "notes": [
        "Counts are mechanical complexity indicators only; lower is not automatically better.",
        "Current Final includes WordPress/runtime/interaction/fidelity work that Clean Replay does not yet reproduce.",
        "Absolute and fixed-dimension counts are not classified as unnecessary by this probe.",
    ],
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, ensure_ascii=False, indent=2))
