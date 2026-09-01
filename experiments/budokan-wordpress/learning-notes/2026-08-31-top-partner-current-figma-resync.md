# TOP Partner type resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC `1603:7187`
- SP `1363:9405`

Owner remains `_top-partner.php` + `css/project/top_partner.css`. PHP was not changed.

## Finding

SP title is Zen Kaku Medium 22 + Roboto Regular 14. PC title is Zen Old Mincho Medium 24 + Mincho 16 with the existing 28px primary octagon. Names are Kaku Medium (SP 12 / PC 14). Lead/more are Kaku 15. Heading still used Noto via `--font-sansSerif-ja` / `--font-serif-ja`.

## Fix

Zen tokens on the existing owner. Octagon geometry and 2×/4× grid stay.

## CI host

Partner has no dedicated workflow. Type asserts ride on the existing TOP About front-page runtime.

## Lesson

The same SP-Kaku / PC-Mincho heading split continues through Partner. SP EN was already Roboto; only the JA/PC tokens were stale.
