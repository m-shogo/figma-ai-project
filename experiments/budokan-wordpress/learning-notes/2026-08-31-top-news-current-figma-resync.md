# TOP News type resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC `1603:7236`
- SP `446:11772`

Owner remains `_top-news.php` + `css/project/top_news.css`. PHP, archive master CSS, and ACF were not changed.

## Finding

LIVE heading is SP Zen Kaku Medium 30 + Roboto Regular 14 `News`; PC Zen Old Mincho Medium 28 + Mincho 18 with the existing 32px `#a6a5ab` octagon. Dates/titles/tabs/more are Zen Kaku Medium. TOP CSS still used Noto heading tokens and overrode the date to Roboto 12.

## Cause

`--font-serif-ja` / `--font-sansSerif-ja` are still Noto. The TOP date override treated the archive item as English Roboto instead of re-reading the current TOP specimen.

## Fix

Zen tokens on the TOP derivative only. Date back to Zen Kaku 14 Medium. Archive `module_newsList-01.css` stays untouched.

## CI host

News has no dedicated workflow. Type asserts ride on the existing TOP About front-page runtime (`budokan-top-about-browser-qa.mjs`), because that fixture already renders `front-page.php`.

## Lesson

A TOP date override of the archive master is not automatically English Roboto. Re-read the TOP specimen before keeping the 12px EN token.
