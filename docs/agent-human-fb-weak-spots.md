# Agent Human-FB Weak Spots

Status: ACTIVE operational contract（Human 2026-09-11）

Human が何度も同じ種類の指摘をするのは、仕様不足より **AI が閉じ状態・静止画・DOM 都合で先に閉じてしまう弱点** である。

この文書の数値や node は案件へ持っていかない。**欠落の種類**を、言われる前に自分で潰す。

UI / layout / hover / overlay / 開閉を触ったら、Human が「確認して」「デザイン見て」と言う前にこのリストを回す。正本の詳細判断は `docs/frontend-quick-contract.md` 節4。

新しい失敗を見つけるたびに分類を増やさない。新しい Human FB はまず下の8へ割り当てる。

## 完了と言う前（必須）

1. **現行** Figma だけ見る。旧 file / 旧メモの測りを使わない
2. 閉じ / rest だけでなく、同じ面の **hover / open / disabled / overlay / 下層** を自分で開く。MAP や隣 frame にあるのに Human の URL 待ちをしない
3. 実 runtime で **hover・click・開く・閉じる**。静止画1枚で完了にしない
4. 同じ family の兄弟（他ボタン、他 overlay、EN と検索、など）を見る
5. 暗幕・ホバー幾何は節4を黙って適用する
6. 見た目が似ていても owner が違う塊を流用して終わらせない

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

## Human がまた同じ種類を言ったら

単発バグで閉じない。この8のどれかを更新し、`research/frontend-learning-evidence*.yaml` へ戻す。同じ種類を2回言わせたら、detection（完了前チェック）が弱い。
