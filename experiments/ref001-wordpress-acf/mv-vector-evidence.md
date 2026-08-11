# REF-001 Main Visual vector evidence

Purpose: replace the Main Visual's initial CSS approximation with exact Figma geometry and preserve the evidence-resolution lesson from the real file.

## Exact vector layers

PC Main Visual `21378:8032`:

- cyan Vector 2: `21378:8035`, 1380×636, visible from MV-relative y=40
- lavender Vector 3: `21378:8034`, 1380×636, visible from MV-relative y=40
- light-yellow base: `21378:8033`, 1380×696, starts at MV-relative y=0, opacity 10%

SP Main Visual `21376:4886`:

- cyan Vector 2: `21376:4889`, actual Plugin API node size 375×704, MV-relative y=0
- lavender Vector 3: `21376:4888`, actual Plugin API node size 375×704, MV-relative y=0
- light-yellow base: `21376:4887`, source 1380×696, starts at MV-relative y=0 and is clipped by the mobile viewport

Persisted self-contained assets:

- `assets/images/mv/mv-cyan-pc.svg`
- `assets/images/mv/mv-lavender-pc.svg`
- `assets/images/mv/mv-cyan-sp.svg`
- `assets/images/mv/mv-lavender-sp.svg`

The exported shapes are intentionally simple three-point vectors:

```text
cyan     = upper-left triangle, #D2FAFF
lavender = lower-right triangle, #E4DEFF
```

## Rotation lesson

Figma Plugin API reports `rotation=-180` for Vector 3 nodes, but the node's `SVG_STRING` export and a direct node screenshot already show the final visible lower-right triangle orientation.

Applying another CSS `rotate(180deg)` would therefore reproduce metadata rather than the final visual result and would be wrong.

Decision: use the exported SVG orientation directly. Validate transformed/rotated Figma nodes using their isolated screenshot/export before translating transform properties mechanically.

## Design Context vs actual node geometry

The SP `get_design_context` reference code represented the vector composition through 1380px-wide wrapper geometry. The Plugin API actual vector nodes are 375×704, and direct screenshots confirm the 375×704 visible geometry.

This is another reason not to copy generated React/Tailwind coordinates literally.

Evidence-resolution order for this experiment:

```text
1. final visible Figma screenshot
2. actual Plugin API node properties / exported asset
3. Variables / component evidence
4. get_design_context generated layout code as implementation reference
5. agent inference
```

The generated design-context code remains extremely useful for discovering structure and styling, but transformed/clipped layouts must be reconciled against actual node evidence before freezing CSS geometry.

## Bitmap boundary remains separate

The left/right foreground people remain logical content images:

- left foreground hash: `ffaba0f1b80cd073b4f47d201eac19a7aa1dced0`
- right foreground hash: `cdb53715ec7a8c016428e42d818ab2dd40d3abc0`

PC/SP use the same underlying image source with different crop/layout. This vector repair does not create separate responsive ACF image fields and does not embed large bitmap data URIs into Git.
