# Hardcover / 単行本 Dependency Audit

更新: 2026-09-03

対象は現行 Figma `fKYDn9ikpJk1nW7IWFtaUx` の PC full-page authority:

- Hardcover / 日本武道館発行の単行本: `1656:5309`
- Hardcover detail: `1686:5574`

SP page `114:5409` では、この2面に対応すると証明できる専用 full-page frame は current authority 上まだ確認できない。したがって page-specific SP pixel parity は `UNDETERMINED` のまま扱う。

## 結論

Hardcover family の current PC visual は、新しい page template / CPT / ACF Repeater / page-specific CSS を先に作る根拠にならない。

現行 Theme の次の owner を組み合わせることで主要 visual contract を表現できる:

- `page.php` + Gutenberg body
- shared Page Title / breadcrumb / footer
- `wp-block-heading-style.css` の h2 / h3 / h4
- `wp-block-inPageLink-style.css` のページ内リンク
- `wp-block-buttonLink-style.css` の default button / external-link trailing icon / small detail link
- `wp-block-list-style.css` の通常 list / nested list / annotation list
- existing image / columns / media-text / group blocks

Book catalog の反復表示を見て、editor が自由に add/remove/reorder する collection だと推測してはいけない。Figma 後半には同一タイトル・著者・価格の placeholder 的な反復もあり、Figma は visual/layout authority であって商品データの canonical source ではない。

## Live Figma reconciliation

### Hardcover `1656:5309`

current design context で確認した主要 contract:

- content rail: 960px
- h2: 26px
- h3: 20px
- recommended book image: 170×250
- recommended row: image と text の gap 40px
- page-internal links: PC 4列、220px、column gap 20px、row gap 24px、56px high、26px octagon
- book card image: 170×250
- card body: 16px vertical gap、center aligned
- book title: 15px Medium / gold text / underline
- author: 12px
- price: 14px Medium
- bottom action: standard `button_L` 270×60

ページ内リンクは current shared `wp-block-inPageLink-style.css` と一致しているため、Hardcover 専用 derivative は作らない。

### Hardcover detail `1686:5574`

current design context で確認した主要 contract:

- content rail: 960px
- detail image: 170×250
- image/text gap: 40px
- body copy: 17px / line-height 1.6
- annotation: 14px + `※`
- purchase actions: standard `button_L` 270×60 + external-link trailing icon
- h3 `内容` + h4 `目次`
- level-1 list marker: solid gold 6px rounded square
- nested marker: white 6px rounded square + 1px gold border
- nested group: 24px effective indent, 8px vertical gap

nested list は current Theme の shared `wp-block-list-style.css` で既に表現される。親 `li` の 18px content inset + nested `ul` の PC 6px margin-left により nested marker が 24px 内側へ入り、nested `li` 自身の 18px padding と合わせて本文 rail も Figma の構造に整合する。nested gap 8px / marker 6px / border 1px も既存 owner と一致する。

購入ボタンも `target="_blank"` を既存 WordPress markup が持てば shared button CSS の trailing external-link icon が使えるため、Hardcover 専用 icon markup は作らない。

## 2026-09-03 shared-primitive re-verification

LIVE current-Figma inspection of Hardcover detail `1686:5574` re-checked the two surfaces most likely to trigger unnecessary page-specific work:

- purchase buttons are actual `button_L` instances at **270×60**; the visible labels use Zen Kaku Gothic New Medium **15px**, and the four purchase actions sit in the same shared button family already owned by `wp-block-buttonLink-style.css`
- the caution row uses a **14px / 1.6** Zen Kaku Gothic New body with a separate **16px `※` marker**

A second LIVE check against the canonical Parts annotation sample in `1163:4245` confirmed that the shared visual family also uses **14px / 1.6** Zen Kaku Gothic New body and a **16px Noto Sans JP Medium `※` marker**. Theme `ul.annotation-list` already matches the body/marker sizing and structure, but its marker explicitly uses the Theme Kaku family rather than Noto.

That font-family mismatch is real, but it is **not** safe evidence for a broad shared CSS change yet: Publications contains a contextual annotation treatment, and the production WordPress markup/variant ownership for those contextual instances is still unresolved. Changing the generic marker family now could repair Parts/Hardcover while silently regressing another consumer whose semantic variant hook has not been established.

Therefore:

- purchase buttons: **REUSE_EXISTING**
- annotation body/marker sizing and structure: **REUSE_EXISTING**
- annotation marker font family: **FAIL_CLOSED_PENDING_CONSUMER_VARIANT_AUTHORITY**
- Hardcover-specific button/annotation selector or derivative: **DO_NOT_CREATE**
- Theme PHP/CSS/JS change in this pass: **NONE**

This is intentionally narrower than claiming the whole Hardcover page complete: catalog/editor data ownership and dedicated SP authority remain unresolved.

## Data / editor boundary

現在 Figma から証明できるのは layout と visible content sample まで。

以下は未確定:

- 書籍を CPT にするか
- ACF Repeater / Flexible Content にするか
- taxonomy を武道種目に対応させるか
- editor が書籍を add/remove/reorder するか
- 一覧と詳細の canonical data source を共通化するか
- 本番販売 URL / 在庫 /価格の運用 owner

これらは `UNDETERMINED`。既存 Theme / Human の運用 authority が得られるまでは、Gutenberg/static sample content で visual composition を進められるが、新データモデルは追加しない。

## Implementation gate

次に Hardcover family で production code を変更してよいのは、次のいずれかが証明された場合のみ:

1. real WordPress body markup を current PC Figma と比較し、shared block owner に具体的な差分がある
2. Human が catalog/detail の data owner または editor operation を確定する
3. current SP counterpart が追加され、shared SP behavior では閉じない差分が証明される
4. annotation marker familyを変更する場合は、既知のannotation consumerとそのsemantic variant/WordPress markup ownershipを確認し、共有変更のblast radiusが閉じる

それまでは book-card 専用 CSS / template / ACF / CPT を推測で追加しない。

## Reuse-before-build decision

| Surface | Decision | Reason |
| --- | --- | --- |
| Page shell | `REUSE_EXISTING` | `page.php` + shared title/breadcrumb/footer |
| h2/h3/h4 | `REUSE_EXISTING` | current Figma master と shared heading owner が一致 |
| In-page links | `REUSE_EXISTING` | PC 220×56 / 4-col / gap / icon contract が一致 |
| Purchase buttons | `REUSE_EXISTING` | current LIVE `button_L` 270×60 / 15px Medium と default button owner が一致。`target=_blank` icon contractも再利用可能 |
| Annotation sizing/structure | `REUSE_EXISTING` | Hardcover/Partsとも body 14px / 1.6 + marker 16px。既存annotation-listの構造と寸法を再利用 |
| Annotation marker family | `UNRESOLVED` | current Parts/HardcoverはNoto Sans JP Medium、Theme genericはKaku。contextual consumer ownership未確定のため共有変更しない |
| Nested contents list | `REUSE_EXISTING` | solid/hollow marker、indent、gap が shared list owner と一致 |
| Book catalog data model | `UNRESOLVED` | Figma repetition は editor collection authority ではない |
| Book card wrapper | `UNRESOLVED` | real editor markup/data owner 未確定。先に CSS class を発明しない |
| Page-specific SP parity | `UNRESOLVED` | current dedicated SP full-page authority 未確認 |

この audit は「Hardcover が完成済み」という意味ではない。新しい architecture を増やさず、real runtime diff が取れるまでの安全な dependency closure を記録する。
