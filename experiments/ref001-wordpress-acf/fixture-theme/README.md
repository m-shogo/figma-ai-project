# REF-001 Learning Fixture Theme

This is a **learning-only WordPress theme fixture**, not the production theme for the Figma reference.

Its job is to create implementation experience before a real target theme repository is supplied and to preserve an intentionally imperfect First Pass for later Repair / Clean Replay comparison.

## First Pass scope

Implemented:

- Main Visual (`21378:8032` PC / `21376:4886` SP)
- Reason (`21378:7999` PC / `21376:4852` SP)
- Education (`21378:7868` PC / `21376:4720` SP)
- fixed Page template at `page-templates/template-ref001.php`
- ACF basic-field consumption through attachment IDs and text/textarea fields
- context-aware WordPress escaping/image helpers

Deliberately not implemented:

- Figma Header/Footer visual reproduction
- real production navigation/global CTA ownership
- exact production breakpoint threshold
- ACF Repeater/Flexible Content/ACF Blocks
- Student Voice interaction, because one open visual state does not yet prove an accordion contract
- Messages carousel/data expansion, because only one of four indicated records is supplied
- ACF Local JSON, because the real target theme's save/load policy is unknown

## Known First Pass blockers

### 1. Exact Figma media binaries are not persisted in this repository yet

The connector can expose short-lived Figma asset URLs, but this execution environment cannot safely persist those temporary binaries into GitHub.

The template therefore expects real WordPress Media attachment IDs from ACF. It does **not** commit expiring `figma.com/api/mcp/asset/...` URLs and does not invent replacement images.

### 2. MV background vectors are approximated

The Figma MV uses vector layers and gradients. The learning fixture currently uses a simple CSS foundation so the CMS boundary, typography, crop boxes, and responsive composition can be exercised without pretending the vectors are exact.

This is a known **VISUAL First Pass failure**, not a final implementation decision.

### 3. Canonical foreground-only media decisions

Figma can retain older/underlay image layers beneath foreground replacements. The learning baseline exposes only the selected canonical foreground content images to ACF.

For Education this was inspected stage-by-stage:

- 01 uses the visible `経営学科 1` foreground
- 02 uses the visible `授業風景 1` foreground rather than its retained underlay
- 03 uses the visible `先生と一緒に考える（差し替え） 1` foreground rather than extra staff/consultation layers
- 04 uses the visible `勉強風景 2`

This tests the hypothesis that every retained Figma image layer should not automatically become an editor field.

### 4. Breakpoint is fixture-only

Figma supplies 1380px PC and 375px SP acceptance references but does not prove a production breakpoint threshold.

`assets/css/ref001.css` and `assets/css/ref001-education.css` use a temporary `max-width: 600px` switch only so the two supplied endpoints can be exercised. This must be replaced by target-theme/company breakpoint evidence before production freeze.

### 5. Font loading is unresolved

The CSS names the Figma-observed font families and safe Japanese fallbacks but does not fetch external font files. The production target must use its own licensed/existing font pipeline.

## Education implementation lesson

Education is deliberately **not** implemented as a Repeater.

The design encodes a story:

```text
01 / スタート
→ 02 / 学ぶ
→ 03 / 出会う
→ 04 / ゴール
```

Editors can change each stage's image/title/bullet content, but stage number, semantic label, order, and connector relationship are code-owned in this learning baseline.

The CSS also avoids hand-writing four different SP heights. Measured Figma geometry can emerge from content:

- 01 has four bullets and naturally grows taller
- 02/03/04 have three bullets
- all use the same 12px internal list gap and shared card rules

This is more replayable than encoding one-off heights for each stage.

## ACF contract

Field definitions live outside the theme fixture at:

`../artifacts/acf-export.json`

First Pass content values are separate at:

`../fixture-content.yaml`

This separation is intentional:

```text
ACF export JSON = field configuration
fixture-content = disposable Page values
```

The fixture does not use field defaults as a content migration channel.

## Why repeated sections are not automatically Repeaters

Reason is visually three repeated cards, but no editor requirement currently says the card count/order is editable.

Education is four repeated cards, but its 01→04 identity explicitly makes order/cardinality part of the authored narrative.

Both therefore use fixed fields in the current baseline. If a real target project later has a different editorial requirement and ACF PRO is confirmed, Repeater can be tested as a **new hypothesis**, not silently introduced here.

## Expected learning sequence

1. validate theme structure and ACF export in CI
2. install the fixture in a disposable WordPress environment
3. import `acf-export.json`
4. create a Page using `REF-001 Learning Fixture`
5. seed the content fixture separately and upload the exact source images when available
6. capture MV + Reason + Education at 1380px and 375px
7. preserve the result as immutable First Pass evidence
8. classify visual/structural/CMS failures
9. repair only after First Pass is frozen
10. repeat from a clean environment to measure reproducibility
