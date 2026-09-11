# Overlay / hover Human FB — 2026-09-11

Intake log. Portable decision rules: `docs/frontend-quick-contract.md` 節4。
Budokan 正本: `CURRENT_AUTHORITY.md`「PC メニュー overlay」。
Evidence: `research/frontend-learning-evidence-overlay-drawer-stacking-2026-09-11.yaml`（CANDIDATE。auto_promotion しない）。

2026-09-01 の「PC パネルは 100px ヘッダーの下」は **SUPERSEDED**。現行 Figma `jqYoPtusYfTeDqRegMCsx3` `2096:6235` では暗幕も白パネルも viewport 上端からヘッダーを覆う。

## 注文（かみ砕き）

### ホバー

- 状態で箱をずらさない。rest から枠の太さを確保する。
- ネガポジ反転（EN / 検索 / SNS など）は **塗りと文字を反転**。rest の枠は残し、枠だけ反転したり hover で新設したりしない。
- テキストリンクの hover 当たりは **文字幅**。親を `width: 100%` にして赤い帯を出さない。
- disabled / inert（pager next など）に enabled と同じ hover 箱を出さない。
- 八角 / `clip-path` は hover で線を消さない。以前見えていた stroke が消えたら clip 差し替えを疑う。

### Overlay / メニュー / 検索

- 暗幕色・範囲は **開いた Figma** を見る（Budokan 暗幕 `2182:8277` = `#333` 90%）。
- 暗幕は **width 100% で画面全体**。パネル外形に合わせて `clip-path` で穴を開けない。白パネルはその上。
- ヘッダーの GNavi / EN / 検索 / MENU は **消さない。覆う**。`visibility: hidden` しない。
- Figma がヘッダーの上に暗幕とパネルを置いているなら、パネルを `--header-height` 分下げない。
- 閉じるボタンは Figma どおり。PC ならパネル内（メガの中）。ヘッダーハンバーガーを × にするためにクロムを消さない。
- sticky ヘッダーを open で `relative` にしない。scroll-lock の `padding-top` と二重になり **背景が落ちる**。
- sticky/fixed ヘッダーは stacking context を作る。パネルがヘッダー子孫なら、兄弟 `#overlay` を上げるとパネルまで暗幕の下に入る。**暗幕をクリップして逃げるな**。同じ SC 内（例: header `::before`）で全面暗幕、パネルをその上。
- 開閉は Existing duration、無ければ **0.3s**。暗幕フェードとパネルスライドの時差を作らない。
- 閉じるときは **中身を崩さず**、開いた形のまま `transform` で右へ隠す（検索パネルと同じ）。close 開始で open class を外して SP/閉じグリッドに戻さない。transition 後に class を外す。

## 次の案件での自動判断

Figma の open-state に暗幕 + オーバーレイパネルがある、または hover で枠/反転/下線がある、と見えたら上を先に適用する。Figma が明らかに違う配置なら Figma が勝つ。数値（888px 等）は案件固有で持っていかない。
