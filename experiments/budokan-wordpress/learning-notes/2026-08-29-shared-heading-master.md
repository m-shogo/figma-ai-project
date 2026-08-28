# Budokan shared heading master — 2026-08-29

## Authority

- Figma file: `w7SGVY63FuW6JpaQVKjxm2`
- SP facility page: `1468:6595`
- PC facility page: `1137:5348`
- Reusable h2 main component: `1157:8179`
- Shared Theme surface: `css/blocks/wp-block-heading-style.css`

## Concrete findings

1. The training-center page does not need page-specific heading components. Its h2/h3/h4 are instances of the shared authored heading family, so the correct implementation surface is the existing Gutenberg heading CSS master.
2. The h2 authored geometry is a 10×10 octagon followed by a 20px gap. A multiline SP h2 keeps the icon aligned to the first text line rather than centering it over the total heading height. The shared CSS therefore uses `align-items:flex-start`, a 20px gap, and breakpoint-specific icon top alignment (12px SP / 13px PC).
3. The SP h3 authored frame is 327×52 with the text beginning 16px from the frame left and 12px from the frame top. The PC authored frame is 962×60 with text beginning 20px/16px. Because the web implementation uses a 1px CSS border on the frame, the matching CSS padding is 15px/11px on SP and 19px/15px on PC; copying the authored inset directly as CSS padding adds the border twice to the total box geometry.
4. The existing h4 4px accent bar plus 16px gap already matches the reusable Figma master and requires no change.

## Mistakes / failed approaches and causes

### Paired the wrong SP screen from page context

The first SP/PC pairing used a training-related SP screen that was not the facility page matching PC `1137:5348`. The correction used unique body-copy fingerprinting (`日本武道館研修センター 施設のご案内`) across the SP page and found the true counterpart `1468:6595`. Page/root naming alone was not sufficient authority.

### Copied Figma text inset directly into CSS padding

The first pass used SP 12px/16px and PC 16px/20px as CSS padding. Runtime then measured h3 at 54px SP and 62px PC rather than the authored 52px/60px. The 1px top/bottom CSS borders accounted for the extra 2px. The fix subtracts the border from padding while preserving the authored text inset and total frame height.

### Runtime seed accidentally started a second empty Compose project

The first deterministic seed step invoked `docker compose` in a fresh GitHub Actions step without sourcing `scripts/runtime-env.sh`. Action-step environments are isolated, so it lost the generated compose project identity from `setup.sh` and reported that `/var/www/html/` was not a WordPress installation. This was a QA harness identity problem, not a Theme failure. Every later step that invokes Compose must source the runtime env before operating on the already-started WordPress stack.

## Reusable lesson

For Budokan shared-component work, resolve the exact SP/PC counterpart using distinctive authored content when frame names are ambiguous, then separate **Figma visual inset** from **CSS box-model padding** when borders/strokes are present. During runtime QA, preserve the generated Compose identity across Action steps before treating an environment failure as a Theme defect. Keep these as project-local evidence until independent repetitions justify promotion to a broader standard.
