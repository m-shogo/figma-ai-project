# REF-001 V3

Independent, maintainable implementation of REF-001. It does **not** modify V2 (`experiments/ref001-blind-clean-20260812`).

## Preview

From the repository root:

```text
php -S 127.0.0.1:8766 -t .
```

Open:

```text
http://127.0.0.1:8766/experiments/ref001-v3/implementation/preview.php
```

Canonical rasters are served from `implementation/theme/assets/images/ref001/rendered/` (read-only).

## Layout

| Path | Role |
|---|---|
| `implementation/preview.php` | Fixture entry |
| `implementation/page.php` | Section assembly |
| `implementation/data/` | Editor-owned copy, assets, course identity |
| `implementation/components/` | Repeated UI (heading, CTA button) |
| `implementation/sections/` | One file per Figma section |
| `implementation/styles/` | Tokens → base → components → sections → responsive |
| `docs/figma-map.md` | Section ↔ Figma node IDs |
| `docs/v2-v3-comparison.md` | Design comparison |
| `qa/` | V3-only capture evidence |

## Rules

- Production breakpoint: mobile `<= 767px`, desktop `>= 768px`
- Visual acceptance endpoints: PC `1380px`, SP `375px`
- SP raster sources stay 3x
- CTA people keep transparent silhouettes; section background is not baked into the image
- URLs without Figma destinations remain `#` / `UNRESOLVED`
- SP Figma frame includes a 40px status bar; the website does not paint device chrome
