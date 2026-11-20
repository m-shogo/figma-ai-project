# Agent Human-FB Weak Spots

Status: ACTIVE operational contract（Human 2026-09-11）

Human が何度も同じ種類の指摘をするのは、仕様不足より **AI が閉じ状態・静止画・DOM 都合で先に閉じてしまう弱点** である。

この文書の数値や node は案件へ持っていかない。**欠落の種類**を、言われる前に自分で潰す。

UI / layout / hover / overlay / 開閉を触ったら、Human が「確認して」「デザイン見て」と言う前にこのリストを回す。正本の詳細判断は `docs/frontend-quick-contract.md` 節4。

新しい失敗を見つけるたびに分類を増やさない。新しい Human FB はまず下の W1–W10 へ割り当てる。案件を閉じるときは、この分類で FB を数えて `projects/<slug>/LEARNINGS.md` に残す（`projects/README.md`）。

## 作る前（必須）

1. `projects/<slug>/docs/` の Current Authority と現行 Figma fileKey を読む。前の案件・前の file の数値を持ち込まない
2. 新しい class / CSS ファイル / ACF group / CPT / 共通余白を足す前に、同じ役割の owner を検索する。あれば足さずにそこを直す
3. Figma の描画寸法を `height` / `width` / `nowrap` / `min-width` に写す前に、内容が増えたらどうなるかを決める（W10）
4. 1 つの FB は 1 コミット。整形（インデント・改行）を修正と同じコミットに混ぜない

## 完了と言う前（必須）

1. **現行** Figma だけ見る。旧 file / 旧メモの測りを使わない
2. 閉じ / rest だけでなく、同じ面の **hover / open / disabled / overlay / 下層** を自分で開く。MAP や隣 frame にあるのに Human の URL 待ちをしない
3. 実 runtime で **hover・click・開く・閉じる**。静止画1枚で完了にしない
4. 同じ family の兄弟（他ボタン、他 overlay、EN と検索、など）を見る
5. 暗幕・ホバー幾何は節4を黙って適用する
6. 見た目が似ていても owner が違う塊を流用して終わらせない
7. `gap` を置いたら、先頭・末尾・padding 側に余計な空きが無いことを実測する。端の空きは `padding` / `margin`。quick contract 節3。この指摘は多い
8. Repeater / CMS のカードへ Figma の描画高・描画幅を `height` / `width` で固定しない。中身で伸びる。logo など素材寸法は固定してよい。quick contract 節12。この指摘は多い
9. Figma の見本個数で CSS を終わらせない。0、1、見本、見本より1つ多い、折り返した次の段を自分で数える。見本が6個でも7個目で罫が消える書き方をしない
10. 狭い画面の `:has` / `nth-child` が、広い画面の指定より強く残っていないか見る。個数を変えて、欠けた辺が無いか確認する
11. 「ダミーを消す」前に、正本の仮画像、固定文言、DB の確認投稿、凍結中の別一覧を分ける。言われた塊以外を消さない
12. メニュー名、投稿、ACF の保存値はテーマファイルに入らない。上げるファイルと、管理画面でやる作業を分けて答える

## 弱点

### W1 閉じ / rest だけ見て終わる

**FB の出方:** 「メニュー画面確認した？」「三階層目できてない」「検索の中身」「overlay はこれ」

閉じヘッダー、閉じボタン、default pager だけ合わせて、open menu / mega 下層 / 検索パネル / 暗幕を後回しにする。

**自動:** 対象を直す前に、同じページの open / hover / disabled frame を探す。実装後はそれを操作してから完了と言う。

### W2 DOM 都合で Figma の重なりを壊す

**FB の出方:** 「消さないだけでよかった」「overlay 変、width 100%」「背景が下がってる」

`visibility: hidden`、パネル外形の `clip-path`、`--header-height` 下げ、sticky を `relative` にする、兄弟 overlay の z-index だけ上げる。

**自動:** 開いた Figma の重なりを先に読む。覆う。欠けるな。unstick するな。stacking は quick contract 節4。

### W3 hover を「足す」

**FB の出方:** 赤い四角、テキストが width 100%、ネガポジで枠が消える、八角の線が消える

hover で border / 当たり / clip を新設する。disabled にも enabled 箱を出す。

**自動:** rest から枠厚。当たりは文字幅（Figma が全幅でない限り）。invert は塗りと文字。**八角のネガ反転は SVG chip（白塗り + 色 stroke）。`clip-path` + `inset box-shadow` で invert しない**（白塗りにした瞬間に枠が食われる。ボタンで直したのに Local Nav で再発した）。disabled に箱を出さない。

関連: 親にコンテンツより低い固定 `height` を置くと、子の padding/border が次行 gap を食い「上のスペースが詰まってる」に見える。`height: auto` / `min-height`。`nowrap` で Figma 1行を固定しない。

### W4 動きと class を後回しにする

**FB の出方:** 「header と overlay の時差が嫌」「閉じるとき中身が崩れる」「全部 0.3s」

暗幕とパネルで duration が違う。close 開始で open class を外して layout が閉じ形に戻る。

**自動:** Existing duration、無ければ 0.3s で揃える。閉じは開いた形のまま `transform`。class は transition 後。

### W5 古い正本を使い続ける

**FB の出方:** 「Figma 更新した。過去を見ないで」

旧 file key、旧 learning note、前回 QA 済み Header を現行にする。

**自動:** Current Authority / 現行 fileKey を先に読む。SUPERSEDED メモを現行にしない。

### W6 見た目が同じなら同じ部品だと思う

**FB の出方:** フッター SNS とメニュー SNS、検索結果モジュールとハンバーガー内検索、overlay 内 EN とヘッダー EN

**自動:** 流用する前に owner と context を確認する。同じ primitive でも場所が違えば scoped override。

### W7 静止画で完了にする

**FB の出方:** 「画面確認した？？？」「docker WP 起動して確認して」

render 1枚。hover / 開閉 / 閉じ戻りをやっていない。

**自動:** 変えた操作をユーザーと同じ経路で実行する。ブラウザが無ければ最も近い runtime でやり、未確認を明示する。完了扱いしない。

### W8 1個直して family を見ない / 隣を Human 待ちする

**FB の出方:** 「他の hover は大丈夫？」「EN 同様これも」「共有ホバー（mega → hamburger → 下層）だけやって」

pager だけ、標準ボタンだけ直して輪郭・ナビ大・EN・検索を残す。逆に、頼んでいない Form / `parts.php` まで触る。

**自動:** 今回の family は自分で洗い、その範囲は言い淀まず直す。scope 外は触らない。

### W9 CMS / ACF を作り足す・壊す

**FB の出方:** 「なんで新しいの作った」「説明いらない」「並び順が変わった」「同期が出てる」

既存 CPT / field group を探さずに新設する。頼まれていない instructions や field を足す。JSON の `modified` / key / 順序を崩す。

**自動:** 作る前に既存の CPT・group・field 名を Current Authority と Theme の `acf/json` で探す。頼まれた field だけ触る。`modified` を未来にしない。field group JSON は Human の明示なしに編集しない。

### W10 Figma の寸法を制約にする

**FB の出方:** 「ルールあるでしょ」「文字が増えたら？」「1個だと全幅に伸びる」「カテゴリ増えても」

見本でちょうど合う `height: 66px` / `width: 301px` / `nowrap` / `min-width` を、内容が変わる箱に書く。見本の個数で `nth-child` を書く。

**自動:** 中身で伸びる箱は flow / grid で組み、固定するのは素材寸法と意図された art direction だけ。完了前チェック 8–10 を回す。

## Human がまた同じ種類を言ったら

単発バグで閉じない。W1–W10 のどれかを更新し、`research/frontend-learning-evidence*.yaml` へ戻す。同じ種類を2回言わせたら、detection（完了前チェック）が弱い。
