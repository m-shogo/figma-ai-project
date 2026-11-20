# TOP FV resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`:

- PC FV `1603:7662`
- SP MV `1455:5811` / notice `446:11658`

Owner remains `front-page.php` + `css/project/top_mainVisual.css`. ACF slider rows and `home.js` were not changed.

Parts `スライダー` (`1157:8378` / `1399:18941`) has no existing Gutenberg/ACF owner. Swiper being loaded is not permission to invent a CMS contract, and the native gallery must not be converted into this slider.

## Finding

SP MV geometry (375×483, title 32 at y=246, notice 335×70) already matched. PC still used the superseded 44px / y=330 / 700×80 red-notice contract.

LIVE PC title is Zen Old Mincho Medium 46 / lh 1.5 at y=307. Lead is Zen Kaku Medium 18. Guide body is `#f9f2e5`. PC notice is a white 600×70 rail with primary-red 16 Medium text, overlapping the MV by 35px. SP notice stays the red rail / white 13 Regular text.

## Cause

The previous FV alignment note measured PC `1399:12229`. Current TOP uses `1603:7662`. Title/lead still inherited Noto via `--font-serif-ja` / body sans.

## Fix

Zen tokens on title/lead/guide. PC title 46 / inner top 307. Guide cream. PC notice white + primary text / 600×70 / padding 32.

## Lesson

Re-read the current TOP `fv` node after a file-key change. A passed 44px / 700×80 notice QA is not authority once the live specimen moved.
