# TOP Banner type resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC `1603:7145`
- SP `1360:9354`

Owner remains `_top-banner.php` + `css/project/top_banner.css`. ACF field keys were not changed. Destination URLs were not invented.

## Finding

Labels are Zen Kaku Medium (SP 15 / PC 16). CSS already had those sizes but inherited Noto from body.

Empty ACF previously returned before markup, so the About front-page runtime never saw the section. Visual samples (`スポーツくじ` / `日本宝くじ協会`, no href) now render only when the repeater has no rows. Filled ACF rows still win.

## Fix

`--font-zen-kaku-gothic` on `.tb_link`. Empty-ACF sample rows for type/runtime proof, without fabricating URLs.

## CI host

Banner has no dedicated workflow. Type asserts ride on the existing TOP About front-page runtime.
