# Responsive / Breakpoint Policy

このrepoのproduction defaultは、AIがbreakpointを発明することではなく、**デザイナー / 会社 / design system / 既存productで指定されたbreakpointをページ全体の共通契約として使う**こと。

## Current default

```text
GLOBAL_SPECIFIED
```

PC / SP / tablet等の切り替え値が案件側で決まっている場合、その値を全sectionへ一括適用する。

AIの役割は:

1. 指定値のsourceを特定する
2. 値とquery semanticsを正確に記録する
3. 全sectionが同じcontractを参照するようにする
4. 指定境界の前後で実装が破綻しないか検証する
5. 問題があれば証拠付きで例外を提案する

**AIが独断でsection固有breakpointや慣習値を追加しない。**

---

## Source priority

案件で複数の情報源がある場合、優先順位は固定値ではなくproject ownershipに従うが、通常は以下を確認する。

- `OWNER` — デザイナー/責任者の明示指定
- `COMPANY` — 会社・案件共通coding/design guideline
- `DESIGN_SYSTEM` — design systemのresponsive specification
- `EXISTING_CODE` — 既存productで使用中のbreakpoint contract
- `FIGMA` — Figma上のannotation / variables / documented mode
- `MULTIPLE` — 複数sourceが一致している
- `UNKNOWN` — まだ確認できていない

矛盾する場合は勝手に優先順位を決めず、`material_unknown` / conflictとして記録する。

---

## One contract for all sections

section workersは同じshared contractを読む。

```text
Shared breakpoint contract
  ├─ Header
  ├─ MainVisual
  ├─ Content01
  ├─ Content02
  └─ Footer
```

section manifestにはbreakpoint値そのものを複製しない。

section側では:

- global breakpointを使う
- section固有のreorder / hide-show / wrap / column変化を記録する
- breakpointの追加・変更はしない

新しいthresholdが必要に見える場合は:

```text
PROPOSE_BREAKPOINT_EXCEPTION
```

としてcoordinatorへ返す。

---

## Intrinsic responsiveness is allowed

共通breakpointを守ることと、幅に応じて自然に伸縮するCSSは両立する。

breakpointを追加せずに使えるもの:

- `flex-wrap`
- CSS Grid
- `minmax()`
- `min-width` / `max-width`
- `clamp()`
- percentage / fractional tracks
- content-driven sizing
- `aspect-ratio`

これらは「別breakpointを作る」ことではない。

ただしFigma/design intentと矛盾する自動reflowは入れない。

---

## Breakpoint record

shared contractには最低限:

```yaml
breakpoints:
  mode: GLOBAL_SPECIFIED
  source: COMPANY
  source_refs: []
  values:
    - name: mobile
      media_query: "<exact project query>"
      min_width_px: null
      max_width_px: null
      notes: ""
  worker_override: PROPOSE_ONLY
```

を残す。

`media_query`は既存codebaseに正本があるならその表現を優先する。

---

## Verification

最低限確認する:

1. reference PC viewport
2. reference SP viewport
3. 指定breakpoint境界
4. 必要なら境界直前/直後
5. section integration後の全ページ

目的は「AIが良いbreakpointを探す」ことではなく、**指定breakpointで全sectionが正しく切り替わることを証明する**こと。

### Failure examples

- section Aだけ別thresholdを使用
- breakpoint値は同じだが`min/max`方向が逆
- PC/SPで非表示対象が異なる
- breakpoint境界で1px overlap/gap
- typography wrapが境界付近で破綻
- shared navigationだけ旧breakpointを使用

これらはresponsive implementation failureとして記録する。

---

## CSS storage

SCSSを前提にしない。

CSS Modules / native CSSの場合、CSS custom propertiesは通常media query条件そのものの正本には使えないため、**値の一元管理方法をprojectごとに選ぶ**。

候補:

1. 既存projectのbreakpoint utility / PostCSS / design token pipeline
2. 既存共通CSS entrypoint
3. 共通queryを生成するbuild step
4. 最小構成では、許可されたmedia queryだけをlint/validationする

section workerが各自で数値を決める方式は採用しない。

---

## Section-specific exceptions

デザイナー/会社がsection固有breakpointを明示している場合だけ許可する。

その場合:

- sourceを記録
- global contractとの関係を記録
- exception scopeをsection IDで限定
- workerが新規発明したものと区別

通常のproduction defaultは `GLOBAL_SPECIFIED` のまま。

---

## Future changes

この方針も永久固定ではない。

将来:

- Figmaのresponsive semanticsがより明示的になった
- design systemからbreakpoint metadataをMCPで直接取得できるようになった
- container query中心のcompany standardへ変わった
- AIが大画面全体のresponsive contractを高精度に扱えるようになった

場合は再評価する。

ただし、**案件側の明示指定がある限り、それがAI推測より優先**というsource-of-truth原則は維持する。
