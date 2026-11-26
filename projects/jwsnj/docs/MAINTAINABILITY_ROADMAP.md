# JWSNJ — 保守性・操作安定性の継続改善ロードマップ

Owner request: 2026-11-26。Gitを引継ぎ正本とする。既存の実装回で進める（新規automation・並行ownerを作らない）。時間や完了日を保証せず、依存順と検証ゲートで管理。各回は latest so / open PR / owner を確認し、READYを複数進めてよい。CI未完了・競合時は保留、別の独立READYへ。既存のQAを優先し、実装をテスト都合で複雑化しない。

| 順 | 作業 | 状態 | 完了条件 / 根拠 |
|---|---|---|---|
| P0-1 | CSS/JS responsive整合 | PARTIAL (#721 merged) | common.js header 67.5rem / footer 48rem vs numeric 1080/768、html legacy flags 768/1024のconsumer調査、home.js・table-scroll-hint.js・Swiper設定等全自作JS調査。意味の同じ境界はmatchMediaへ、異なる機能は別契約。境界・往復・初期font size・focus/scroll/ARIA確認。 |
| P0-2 | form.js安全性 / sample plugin scope | IN_PROGRESS (#722) | file.name HTML injection、jQuery value誤使用、未選択、CF7/AjaxZip3とFormidable/yubinbango責務、動的再描画と重複wrap確認。実free plugin QA、Pro/本番は#523。#717 native input修正済み。 |
| P1-3 | JS状態owner / 初期化 | READY | common.jsのmenu/overlay/scroll lockの状態一元化、重複listener・DOM再初期化を点検。分割は既存Themeと修正頻度に合わせる。 |
| P1-4 | asset/cache | READY | CSS @import childだけ更新時のキャッシュ失効、editor/front両方の依存、既存配信環境を確認。不要buildを作らない。 |
| P1-5 | HTML/CSS/JS命名・検索性 | READY | existing naming維持、visual vs behavior hook、同一ownerへの集約。selector renameの全consumer確認。 |
| P1-6 | PHP/WP template責務 | READY | template-parts/data/markup、escape、hook/query、副作用、optional dataを点検。既存ACF schema維持。 |
| P1-7 | sample/vendor/ライブラリ | READY | CF7、旧CPT、無効コード・sample文言/素材、未使用ライブラリをconsumer調査後に除去。vendor/generatedは対象外。 |
| P1-8 | WP/plugin依存 | READY | jQuery登録解除・global styles・enqueue順・plugin shortcode二重renderの影響。会社既存方針と実WP証拠を確認し、勝手に依存更新しない。 |
| P1-9 | CSS owner locality残り | READY | 多階層ナビ、Gutenberg group/table、form等。詳細度・カスケード・PC/SP維持。警告数は参考。#718/#719済み。 |
| P1-10 | 人間の修正シナリオ | READY | 文章増減、画像交換、カード増減、任意リンク、WP editor、keyboard/touch/resize、ブラウザ差、cache。適切なrisk-based QA。 |
| 全工程 | 再発防止・先回り | ACTIVE | quick-contract、foundation preflight、必要な既存テストに反映。全案件共通原則と案件固有値を分離し、未検証仮説はLEARNINGSへ。 |

## 受入と保留

- source / static / isolated browser / disposable WP / actual school WP / Figma visual を区別。安全なsource修正は#523/#524を理由に全停止しない。
- ACF追加・変更はCursor、#664 branch/ownerは変更しない。Figma 534:1706は明示許可まで実装禁止。既存デザイン・配色・公式素材・Swiper方針を維持。
- 各作業完了時にPR・commit・実際に成功したQA・残課題を記録する。新規の問題は根拠・影響・優先度・安全な対処を追加し、仕様の不明点だけHumanに相談。実行時間を約束しない。

## 2026-11-26 起点

so 033a7d4: #715–#719 merged。#717 disposable WordPress/free Formidable、#718/#719 source/isolated CSS QA PASS。保守性ロードマップ以後の項目は未完了。

## 2026-11-26 継続実行

- #721 merged `afe8251`: all 5 checks success; Header state/static 50/50; real CSS/JS query alignment in Chromium/Firefox/WebKit at 375/767/768/769/1079/1080/1081/1380 and round trip. Initial browser font preference and actual school WP still unverified.
- Remaining P0-1: all five authored JS files reviewed; home active MV/Course already use 67.5rem, table hint uses `<48rem`, disabled legacy News Swiper has 1000px (not active; no arbitrary change). `common.js` legacy html `_sp/_tablet/_pc` still uses 768/1024 numeric comparisons; trace actual CSS/PHP/JS consumers before removal or alignment. Element width comparison is not a media boundary.
- #722 Form JS source + actual free Formidable fixture opened; await new head CI. Separate file CSS scope candidate: `.file` and `.file label` inherited CF7 styles can leak to other forms; preserve exact CF7 specificity with `:where(.wpcf7)` and test actual CSS. Next independent READY: legacy flags consumer audit and asset/cache dependency inventory. No new page, ACF, schedule or owner changes.
