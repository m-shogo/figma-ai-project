# TOP lower banner — authority / implementation audit

Updated: 2026-08-30

## Scope

TOP lower banner only. `parts.php`, form/Formidable, Footer variants, and unrelated TOP sections are out of scope.

## Dependency decision

- Data authority stays the existing ACF Repeater `top_banner-01`.
- TOP does not invent a second CMS contract.
- Rendering is isolated in `template-parts/_top-banner.php`; `front-page.php` stays compositional.
- The legacy ACF `img` field remains part of the existing CMS contract even though the current Figma presentation does not render it.
- If no valid ACF rows exist, the section is not rendered. Figma specimen labels are not used as production fallback content.

## Live Figma authority

File: `w7SGVY63FuW6JpaQVKjxm2`

### SP `1360:9354`

- root `bnr_area`: 375 × 216
- normal-flow vertical composition: 40px top/bottom padding
- cards: 270 × 60
- card gap: 16px
- card border radius: 3px
- arrow component: 26 × 26 octagon with subtle separator outline
- text: 15px medium, 0.05em tracking
- external icon: 16px
- section background: root-frame image fill + 70% black overlay

The background source was verified from the live Figma image rather than inferred from the screenshot:

- imageHash: `0439889a806e458e2c3e35d11a392dfc78c8cb62`
- source: 1050 × 700 JPEG
- source bytes: 235687
- FNV-1a 32: `310ada8b`
- Figma scaleMode: `CROP`

### PC `1603:7145`

- authored section: 1380 × 160
- content node: 648 × 80
- cards: 300 × 80
- gap: 48px
- text: 16px
- external icon: 14px
- no SP background-image treatment in the PC presentation

The safe responsive model is one shared DOM: stacked 270px cards on SP, then 300px horizontal cards from `min-width:768px`.

## Theme / WordPress ownership

The existing `top_banner-01` ACF Repeater remains the content owner. The new partial consumes only fields already present in that contract (`title`, `url`, `target`) and leaves the legacy image field untouched.

The exact Figma JPEG is now durable at:

`images/top/bg-banner-sp.jpg`

The partial uses that local asset as the default SP background while keeping the existing WordPress filter seam (`nipponbudokan_top_banner_background_url`) as an optional override. The PC media query removes the image treatment to match the PC authority.

## Asset materialization finding

The earlier base64-chunk experiment was rejected because the connector path could not prove chunk-boundary preservation. The successful path was instead:

1. obtain current raw-image candidates from Figma;
2. let an isolated GitHub Actions runner download them immediately;
3. verify the candidate by byte count, JPEG dimensions, and FNV-1a before accepting it;
4. commit only the verified binary;
5. remove the temporary transfer workflow from the branch in the same materialization step.

The materialization run accepted exactly one candidate matching all three known properties. No short-lived Figma URL remains in the final branch tree.

## Implementation choices

- mobile-first geometry uses normal flow and flex; no coordinate-by-coordinate reconstruction;
- `position:absolute` is limited to decorative micro-layers such as the 2px accent and octagon inner fill;
- missing ACF rows do not synthesize user-visible production content;
- TOP remains a thin consumer of the existing master/data contract rather than duplicating a second component family.

## Reusable lessons

1. Identify image authority by live Figma image hash/source metadata before guessing from screenshots.
2. For design binaries, use a transport that can verify the resulting bytes before committing; visual plausibility is not enough.
3. A QA fixture must not silently become a production fallback. Seed runtime test data explicitly instead of hard-coding specimen copy into Theme output.

These are project-local findings. Only repeated evidence should promote them into a higher frontend standard.
