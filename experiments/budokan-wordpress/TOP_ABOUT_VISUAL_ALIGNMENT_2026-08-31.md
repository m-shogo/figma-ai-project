# Budokan TOP About visual alignment — 2026-08-31

## Scope

This pass re-checks the current Figma/Theme/WordPress dependency picture before selecting an implementation target, then aligns only the existing TOP `日本武道館とは / About us` owner.

Authority used:

- canonical SP TOP: `446:10020`
- canonical PC TOP: `1603:7062`
- Theme markup owner: `template-parts/_top-about.php`
- Theme CSS owner: `css/project/top_about.css`
- front-page composition owner: `front-page.php`

The complete TOP frames are too large for a full design-context expansion in one call, so this pass uses fresh full-frame screenshots plus the existing node map. That is sufficient to correct the obvious responsive composition, but it is intentionally not treated as pixel-level child-node measurement authority.

No new renderer, ACF field, TOP-specific copy of another master, or production content contract is introduced.

## Dependency re-check

Before touching About, the current dependency queue was re-evaluated:

- Header/Footer foundations are already established.
- Explicit Parts Slider remains blocked by missing editor/component ownership; Swiper availability is not enough to invent a Slider CMS contract.
- Local Navigation structural/runtime work is closed for the authored states, while production assignment/menu content remains external authority.
- Event remains blocked on canonical event-date/status semantics in WordPress/ACF.
- TOP User Guide was just closed for responsive geometry, with real photographs still authority-gated.

TOP About is therefore a safe independent visual family because the Theme already has a dedicated owner and the responsive geometry can be corrected without changing its data contract.

## Fresh Figma findings

### SP `446:10020`

The current screenshot shows:

- centered `日本武道館とは / About us` heading;
- a white inset information panel with left-aligned body copy;
- two stacked CTA controls;
- a horizontal portrait-card rail with neighboring cards partially visible;
- portrait images at approximately 3:4;
- photographic section background continuing behind the cards.

The previous CSS used a 22px heading, 78%-width cards, 280px image height, and a gray cards band. Those choices no longer match the visible current SP composition.

### PC `1603:7062`

The current screenshot shows:

- vertical Japanese heading / English marker on the left;
- lead copy on the right;
- two CTAs below the left rail;
- four portrait cards aligned under the right content rail, not spread from the far-left global edge;
- the large photographic background continuing below the cards.

The previous four-column grid consumed the entire global content width. That was the main structural mismatch corrected in this pass.

## Implementation

The existing `_top-about.php` remains the sole markup/content owner.

The CSS remains mobile-first:

### SP

- heading increased to 30px / medium;
- panel copy changed to left alignment;
- CTA geometry reduced to a compact ~52px control;
- card rail uses fixed 240px portrait cards with 240×320 image geometry;
- horizontal rail centers each card and intentionally reveals neighboring cards;
- card band no longer paints an unrelated gray background.

### PC `min-width:768px`

- existing vertical heading composition is retained;
- left rail is 220px with a 60px content gap;
- CTA rail reuses the same 220px width;
- the cards wrapper reuses that `220 + 60` composition by starting the four-card grid 280px into the global content box;
- cards remain one row / four columns and keep the 3:4 portrait ratio.

This is a responsive layout correction, not a new content system.

## Authority still unresolved

The Theme currently renders:

- stage background: `images/top/mv-sample.png`;
- all four card photos: `images/common/noimage.webp`;
- both CTA destinations: `#`;
- all four card destinations: `#`;
- brochure label: `パンフレット（10MB）`.

The current Figma visibly contains real About imagery, but temporary Figma asset URLs are not production ownership. This pass does **not** copy temporary assets into the Theme, infer WordPress media ownership, or guess destination URLs.

The brochure size/copy may also be subject to content drift. It is left untouched because layout implementation is not authority to rewrite production editorial data.

Therefore this pass can close responsive structure/geometry for the placeholder state, but it must not claim final production-media visual PASS.

## Runtime/browser QA contract

A disposable real-WordPress runtime verifies that the existing front-page path renders:

- `#top_about-01`;
- existing heading/panel/action/card owners;
- exactly four cards;
- unresolved image placeholders remain explicit rather than silently replaced with fabricated assets.

Chromium QA then checks relational geometry instead of unsupported absolute child coordinates:

### SP

- 375px mobile layout;
- 30px heading;
- 335px panel inside 20px page padding;
- two ~52px CTAs;
- horizontal flex rail;
- four 240px cards;
- first image 240×320.

### PC

- vertical heading remains vertical;
- panel composes into the existing top grid;
- 220px actions rail;
- cards begin after the shared 280px left-rail+gap inset;
- four cards share one row/four distinct columns;
- portrait image ratio remains 3:4.

These assertions deliberately distinguish layout invariants from unavailable pixel-level child-node coordinates.

## Reusable findings

1. **Whole-frame screenshot authority can close an obvious composition mismatch, but it is not a substitute for child-node measurement.** When a Figma frame is too large to expand, only assert relational geometry that the screenshot and Theme ownership both support.
2. **TOP derivatives should reuse an existing section owner before adding a CMS contract.** Placeholder media can remain explicitly unresolved while layout work continues safely.
3. **A shared left rail should be reused as geometry, not re-created with unrelated card widths.** The PC heading/actions rail and the card-grid inset now share the same `220px + 60px` structure.

These remain Budokan-project findings. Do not promote them to higher standards until repeated independently.

## Current Figma type pass (file `fKYDn9ikpJk1nW7IWFtaUx`)

Geometry already matched. LIVE type/size still used Noto/Crimson and a 13px EN chip.

Confirmed from child nodes `1603:7273` / `1392:11708`:

- SP heading JA: Zen Kaku Medium 30. EN `About us`: Roboto Regular 14 / accent octagon.
- PC heading JA: Zen Old Mincho Medium 36, vertical. EN is **not** a 13px `#d5e3ec` chip; it is Zen Old Mincho Medium 30 (rotated −90) over a separate 72px `#b4c5d9` octagon.
- Lead / CTA: Zen Kaku (SP/PC 16). SP overlay 14 Regular; PC overlay 16 Regular.
- Card labels: SP Zen Kaku Medium 16; PC Zen Old Mincho SemiBold 18.

PHP and media/href placeholders stay untouched.

## Files intentionally untouched

- `parts.php`
- Form/Formidable
- ACF schema/contracts
- `_top-about.php` content/data contract
- production media ownership
- production destination URLs
