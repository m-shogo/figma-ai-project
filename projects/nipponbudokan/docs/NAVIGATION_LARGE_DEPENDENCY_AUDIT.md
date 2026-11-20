# Navigation Large Dependency Audit

更新: 2026-09-02

## Scope

日本武道館 WordPress Theme の ACF Navigation Large を、現行 Figma と既存 Theme owner の組み合わせで再監査する。

## Current visual authority

- Figma file: `fKYDn9ikpJk1nW7IWFtaUx`
- SP Navigation master: `1399:18870`
- PC Navigation master: `1157:8339`
- PC page instance: `1145:6042`

旧 Figma file key / node の値をこの判断へ持ち込まない。

## Existing implementation owners

- markup / data projection: `experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/acf/blocks/navigationLarge.php`
- shared visual owner: `experiments/wordpress-acf-runtime/theme-dropin/nipponbudokan/css/blocks/wp-block-navigation-style.css`

既存 ACF field contract の `target` は `<a target="_blank">` へ投影されている。外部リンク表示のために field / PHP / data model を増やす必要はない。

## Confirmed shared contract

現行 SP / PC master と Theme は次で一致する。

- SP 1列 / PC 3列
- PC column gap 40px
- image aspect-ratio 3:2
- image top radius 3px
- content padding 24px 20px
- content gap 16px
- bottom separator `#d7d4d4`
- title: Zen Old Mincho SemiBold 18px / line-height 1
- leading octagon: 26px, title gap 8px
- body: Zen Kaku Gothic New Regular 15px / line-height 1.6

このため、新しい Navigation component / page-specific CSS / ACF model は作らない。

## Resolved delta — optional external-link glyph

Figma SP `1399:18870` と PC `1157:8339` は、外部リンク glyph を title row の**右端に独立した trailing affordance**として配置している。title row 自体は full width / `justify-between` 相当で、glyph 前には 16px の inset がある。

Theme は既存 `target="_blank"` を利用して `.title::after` に glyph を出していたが、title が intrinsic width のまま、かつ `margin-left: 10px` だったため glyph がタイトル文字の直後へ寄る状態だった。

修正方針:

- `navigationLarge.php` は変更しない
- shared `.--large .title` を full width にする
- `target="_blank"` の trailing glyph だけ `margin-left: auto; padding-left: 16px` とする
- Navigation Small の既存挙動には波及させない

これは Figma の構造をそのまま DOM 化するためではなく、既存 markup の semantic contract を維持したまま authored alignment を shared CSS owner で再現するための修正。

## Fail-closed boundaries

- Navigation data cardinality / editor add-remove-reorder contractは今回変更しない
- `parts.php` は変更しない
- Form/Formidable は変更しない
- Slider / Calendar / Search はこの監査の対象外
