# TOP purpose sticky resync to current Figma — 2026-08-31

## Scope

Current file `fKYDn9ikpJk1nW7IWFtaUx`, SP `1360:9370`. Owner remains `.top_purposeMenu` in `top_guide.css`. Footer PHP was not changed.

## Finding

The previous 56px / 16px / `#333` + `#4e5055` border contract came from an older file key. LIVE is 375×64, fill `#4e5055`, vertically centered Zen Old Mincho Medium 18, list icon 18, chevron 16. Fill and stroke are the same color, so there is no contrasting top line.

## Fix

64px bar, `#4e5055` ground, Mincho 18, 18px list icon. Click still reuses `#top_guide-01`.

## Lesson

A file-key change can restyle a sticky derivative independently of the Guide section master. Do not keep the old 56/16 contract after re-reading `1360:9370`.
