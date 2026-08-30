# 現代武道9種目紹介 Dependency Audit

更新: 2026-08-30

## 結論

「現代武道9種目紹介」は、新しいページ専用 component/template を作る対象ではなく、通常 `page.php` の Gutenberg 本文内で既存 **Navigation Large** master を再利用する derivative として扱うのが現時点の正しい依存方向。

Figma responsive counterpart は次で確定した。

- SP: `1455:5489` (`SP_navigation`)
- PC: `1145:6042` (`navigation`)

両者は page title、導入文、9種目の並び（柔道 / 剣道 / 弓道 / 相撲 / 空手道 / 合気道 / 少林寺拳法 / なぎなた / 銃剣道）、global shell を照合して同一ページと確認した。

## Figma → shared master mapping

### SP authority

SP `1455:5489` は、導入文の後に9枚の Navigation Large card が1列で連続する。

確認できた主要 geometry:

- content rail: 約327px（x=24基準）
- card image: 3:2、約327×218px
- card contents padding: 24px
- card title: 20px
- body: 16px / 約1.8
- arrow: 24×24px
- item間: 24px系

### PC authority

PC `1145:6042` は同じ9カードを3列×3段で表示する。

確認できた主要 geometry:

- content width: 約960px
- 3 columns
- column gap: 約40px
- row gap: 約56px
- card image: 3:2
- card contents padding: 24px
- title: 20px
- body: 16px
- arrow: 24×24px

### Theme masterとの照合

既存 `acf/blocks/navigationLarge.php` は repeater `navigationLarge` から image / title / content / link を受け取り、1 row = 1 navigation cardとして描画する。9種目のために新しいACF field contractは不要。

既存 `css/blocks/wp-block-navigation-style.css` も mobile-first で次を既に所有している。

- SP: 1列、24px gap、3:2 image、24px contents padding、20px title、16px body、24px arrow
- `@media (min-width: 768px)`: 3列、`gap: 56px 40px`

したがって、Figmaとの差を埋めるためのページ専用CSS、card markup複製、TOP向け別masterは現時点では不要。

## WordPress ownership

通常ページの `page.php` は global shell / dropdown navigation / `.block-editor_wrap` の中で `the_content()` を描画する。

このページも専用PHP templateへhard-codeせず、canonical editor contentが確定したら Gutenberg/ACF block compositionとして組む。

想定 composition:

1. 導入paragraph
2. Navigation Large block（9 rows）

これは構造候補であり、production content seedではない。以下のauthorityがない状態でFigma specimenをWordPressへ勝手に投入しない。

## 現在の blocker / 不明点

repo内を current `so` 基準で再検索したが、「現代武道9種目紹介」のcanonical Gutenberg block tree / production seedは見つからなかった。

production実装へ進むために不足している最小authority:

- canonical Gutenberg/ACF block content（既存WP editor側が正本ならそのexport）
- 9枚のproduction media ownership / attachment IDs or approved asset mapping
- 各9種目cardのcanonical link target / URL

Figmaの表示文言・画像をTheme PHPへhard-codeしたり、Figma asset URLをproduction hotlinkしたりしない。

## 今回やらないこと

- `parts.php` の変更
- Form / Formidable
- 新規ACF field group
- Navigation Largeの複製
- page-specific CSSによる既存masterの上書き
- canonical data不在のままruntime fixtureをproduction seed扱いすること

## QA gate

canonical editor contentが取得できたら、次の順で閉じる。

1. SP `1455:5489` を正本としてNavigation Large blockをseed
2. 実WordPressでSP runtime QA / screenshot / visual diff
3. 必要な差分だけshared master側で検討（単発ページ差なら昇格しない）
4. `min-width: 768px` でPC `1145:6042` をQA
5. SPから漏れてはいけないruleを含めPC visual diff
6. clean diff → CI → squash merge

## 学び

ページframeを見つけた時点で「ページを実装する」のではなく、まずその中のUI familyをParts masterへ逆引きする。Figma SP/PCとTheme masterのgeometry/contractが既に一致するなら、ページ固有実装を増やさず **composition/data authorityの問題**として扱う。
