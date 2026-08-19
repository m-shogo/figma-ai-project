# REF-001 section geometry evidence

Source: `experiments/ref001-blind-clean-20260812/evidence/final/latest/runtime-probes.json`
(real DOM `getBoundingClientRect`-derived section geometry captured against the
Human-Reviewed, visually-frozen REF-001 fixture runtime — E1 local observation,
not Figma pixel geometry and not invented).

Kept only as machine-parsable input for
`scripts/validate_wordpress_theme_intake.py`'s section-coverage cross-check
(`docs/wordpress-theme-intake.md`); REF-001's actual visual/design source of
truth stays the Figma reference and
`experiments/ref001-blind-clean-20260812/implementation/theme/inc/figma-authority.php`
node-id evidence, per `AGENTS.md`.

### PC
- header: `y=0 h=94`
- main-visual: `y=94 h=714`
- reason: `y=886 h=559`
- education: `y=1541 h=684`
- shared-cta: `y=2225 h=328`
- student-voice: `y=2649 h=1393`
- messages: `y=4225 h=440`
- courses: `y=5111 h=1514`
- links: `y=6697 h=260`
- cta-value: `y=7029 h=328`
- footer: `y=7357 h=357`

### SP
- header: `y=0 h=67`
- main-visual: `y=67 h=724`
- reason: `y=847 h=1295`
- education: `y=2198 h=1534`
- shared-cta: `y=3732 h=350`
- student-voice: `y=4138 h=1758`
- messages: `y=5952 h=538`
- courses: `y=6896 h=2515`
- links: `y=9467 h=343`
- cta-value: `y=9866 h=396`
- footer: `y=10262 h=515`
