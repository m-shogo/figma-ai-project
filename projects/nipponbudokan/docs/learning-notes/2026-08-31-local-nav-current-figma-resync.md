# Local Nav type resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC `1216:6311` (`local_nav`) still LIVE
- Old SP closed specimen `560:632` is **absent** on the current SP page. Treat that node as UNDETERMINED, not NONE-forever.

Owner remains `local_navigation.css`. Walker / PHP / fixture hierarchy were not changed.

## Finding

PC heading is Zen Kaku Medium 20. Children are Zen Kaku Regular 14, current Medium 14. CSS already had those sizes but families fell through to Noto, and the SP selector prompt used `--font-sansSerif-ja`.

SP closed-state geometry is unchanged. No replacement SP local_nav instance was found on `114:5409`; hamburger labels are a different surface.

## Fix

`--font-zen-kaku-gothic` on SP family heading, selector prompt, depth-03 links, and PC depth-04 links.

## Lesson

When an old SP node ID 404s, search the current SP page for the same component/instance before copying PC type onto it. If the specimen is gone, keep geometry and apply the proven PC family only; do not invent a new SP layout.
