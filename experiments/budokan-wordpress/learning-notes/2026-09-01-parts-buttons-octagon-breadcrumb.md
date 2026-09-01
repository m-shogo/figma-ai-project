# Parts buttons / fill / body tile — なぜ最初に外したか — 2026-09-01

Evidence: E1 Observation. Scope: PROJECT_LOCAL + PATTERN_LEVEL candidate. 1回の失敗を永久禁止にしない。

Current file `fKYDn9ikpJk1nW7IWFtaUx`. Theme CSS / templates only. `parts.php` と ACF slug は発明していない。

## Human が指摘した4点（実装後の正）

| 対象 | Gutenberg / Theme hook | Figma 正本 | 最初にやった誤り |
| --- | --- | --- | --- |
| 標準ボタン | `.wp-block-button` default（`button_L`） | SP `1468:7314` / PC `1296:8808`。白地・灰枠・白八角・赤矢印・下線 26×2 | 高さ/15px/gap が近いので閉じた。ホバーを「今は触らない」にした |
| 標準 hover | same | PC `1163:4229`。八角だけ primary、矢印白。下線は維持 | Theme 残（金八角や `#333` 枠）を hover とみなした。Figma variant を読んでいない |
| 輪郭ボタン | `.is-style-outline` | CTA `btn-03` PC `1157:8271` / SP `1450:5194` / hover `1157:8278` | 英語 `outline` = 中空の輪郭だと思った。別に `.cta` クラスを発明した |
| 背景付きテキストボックス | `has-gray-background-color`（slug は `gray` のまま） | `1157:8201` 白塗り + `#d7d4d4` | slug 名 `gray` と WP palette の塗りを visual にした |
| body 背景 | `body` | Parts frame `1163:4245` の image、700×700 tile、top left | 白い本文カードだけ見て、frame の fill を取らなかった |

八角の向き（頂点十字）とパンくず位置は同じ波の修正。原因は別（token が stop-sign のまま / パンくずをタイトル直下の Theme 既存に合わせた）。

## 共通原因（4件に同じ型）

閉じる判定を **resting の typography / 外寸** と **Gutenberg の英語名** に置いた。

Figma の正本は次の3つで、どれも「60px だから button 完了」では取れない。

1. **コンポーネントセットの variant**（default の隣の hover）
2. **Parts ページ上の並び**（button_L の隣が btn-03 / 輪郭標本）
3. **親フレームの fill**（中のボタン node を `get_design_context` しても body タイルは出ない）

2026-08-29 の button master は既に「outline は未確認のまま残す」、2026-08-31 の button_L resync は既に「hover は触らない」と書いて閉じている。スコープを狭めたこと自体は PR 単位として正しいが、**Parts カタログ上は未閉じのまま残り、Human が再指摘するまで戻らなかった**。

## 件別

### 標準ボタン + hover

- 08-29 で白八角と 26×2 下線は入れた。08-31 は family と gap だけ。
- hover を意図的に外したので、Theme 既存 hover（アクセント金 / 枠色）が本番に残った。
- Figma では hover は別ノード `1163:4229`。八角 fill が primary になるだけで、下線・白地は default のまま。
- **次:** 共有コントロールは default だけでは閉じない。同じ component set / prototype に hover があれば同じ PR か、残件リストに node id を残す。

### 輪郭 = CTA

- Gutenberg `is-style-outline` は **editor の style slot**。見た目の輪郭ではない。
- Figma の CTA 名は `btn-03`。Human が「輪郭ボタンを CTA に」とマップした。
- Agent は `.wp-block-buttons.cta` という **新しい editor クラス** を足した。既存スロットを潰さず「安全」に見えたが、編集者が Parts の「輪郭」を選ぶ経路とずれた。
- **次:** CMS の style 名と Figma コンポーネント名が食い違ったら、新しい class を足す前に Human へマップを1行確認する。スロットが既にあるならそれを使う。

### 背景ボックスは白

- `has-gray-background-color` の `gray` は **palette slug**（変えない）。塗りは Figma。
- WP が slug から灰色を出す。specificity で Theme が白に上書きする。
- **次:** slug / class / 変数名を色の証拠にしない。Parts の fill を読む。名前を変えて合わせない。

### body に背景画像

- 白い content card（`section` / module）をページ背景だと思った。
- Parts PC の **フレーム自身** `1163:4245` が image fill + 700×700。
- 内側コンポーネントだけ LIVE 取得する運用だと、canvas fill は毎回落ちる。
- `normalize.css` の `body { background: ... }` shorthand は後段の `background-image` を消す。
- **次:** カタログ/ページの PASS 前に top-level frame の fill を1回取る。body に image を足したら reset の `background` shorthand を grep する。

## 次の案件 / これからの実装で使うチェック

Parts・共有コンポーネントを閉じる前:

1. 親フレームの fill / 画像タイル（canvas）を先に見る。
2. 対象コントロールの default **と** hover（file にあれば disabled）を同じ証拠で取る。
3. Gutenberg style / palette slug を Figma 名へ対応表にする。名前が英語で一致しても visual とみなさない。
4. 既存 style slot（`is-style-outline` 等）で足りるなら、新しい editor class を足さない。足りないときだけ Human。
5. 「今回 hover / outline は触らない」と書いたら、残件に node id を残す。触らない = 完了ではない。
6. 1回の失敗で `outline` 禁止や `gray` slug 廃止のような永久ルールにしない。条件は「名前 ≠ 塗り」。

## 実装メモ（この案件の確定マップ）

- 標準 `button_L` hover: `1163:4229`（primary 八角、白矢印）。下線 26×2 は維持。
- Outline Gutenberg style = CTA `btn-03`（Human）。`.small`（btn-02）は CTA 化しない。
- `has-gray-background-color` の塗り: `var(--color-secondary)`。slug は `gray`。
- Body: `images/common/bg-pattern.png` / 700×700 / top left。Parts だけでなく news / event / post / page / form / navigation / TOP のフレーム fill も IMAGE TILE。メニュー・メガメニューは白無地。ページ閉じる前に親フレーム fill を見る。
- `--clip-octagon` は頂点十字。Figma `arrow_s` SVG と同じ向き。
- `acf/in-page-link` は `acf-export.json` の `inPageLink_items` / `_title` / `_id`。フィールド発明なし。
