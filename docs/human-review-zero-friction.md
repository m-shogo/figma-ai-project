# Human Review Zero-Friction Controls

Purpose: Human Reviewで人間が行う作業を「見て判断する」ことへ寄せ、Section選択・進捗管理・フィードバック転記などの機械的操作を減らす。

Canonical Dashboardの基本契約は `docs/human-review-dashboard.md` を維持する。この文書は、その上に追加するconvenience layerの仕様。

## Review order

Review contextは `Section × viewport` で26件。

```text
Full Page / PC
→ Full Page / SP
→ Header / PC
→ Header / SP
→ ...
→ Footer / PC
→ Footer / SP
```

つまり `PC → SP → 次Section`。

## Fast verdict

キーボード:

- `1` = ✅ ほぼ同じ
- `2` = 🟡 少し違う
- `3` = 🔴 明らかに違う
- `← / →` = 前後context
- `P / S` = PC / SP
- `N` = 次の未確認
- `U` = 未確認だけ表示の切替

`✅`だけは既定で次の未確認contextへ自動送りする。

`🟡 / 🔴`は自動送りしない。差がある時にcategory/commentを入力する時間を残すため。

## Progress

Dashboardは判定済みcontext数を `reviewed / total` で表示する。

判定が未選択でcomment/categoryだけ存在するcontextは未確認として残す。

Section railには現在viewportの状態を表示する。

- gray = 未確認
- green = 判定済み
- orange = 修正候補あり

## Unreviewed-only

未確認だけ表示をONにすると、現在viewportで判定済みのSectionをrailから隠す。

現在選択中Sectionは迷子防止のため表示を維持する。

## Safe bulk green

`このViewportの未入力を一括✅`は、完全に空のcontextだけへ `almost_same` を設定する。

以下は絶対に上書きしない。

- 既存の✅/🟡/🔴
- category入力済み
- comment入力済み

一括判定は `review_source: bulk_viewport_green` をlocal feedback dataへ残す。

実行前にbrowser confirmを要求する。

## GitHub Issue prefill

修正候補が1件以上ある場合、Dashboardは `修正依頼を作る` を有効化する。

対象:

- 🟡 少し違う
- 🔴 明らかに違う
- categoryあり
- commentあり

GitHub token / OAuth / webhook / Dashboard専用DBは追加しない。

DashboardはGitHubの新規Issue URLへtitle/bodyをprefillするだけ。Issue作成の最終Submitは人間が明示的に行う。

Issue bodyには:

- REF/run identity
- review progress
- Dashboard URL
- actionable Section / viewport
- verdict
- category
- comment

を含める。

Human feedbackをそのままshared ruleへ昇格してはいけない。Issue側でもFigmaをsource of truthとして原因を確認し、修正→QA→same URL redeploy→Human re-reviewを行う。

## Storage boundary

Human feedback authorityは既存のbrowser `localStorage`を維持する。

convenience preferenceは別keyに保存する。

- auto-advance green
- unreviewed-only

convenience layerが壊れても、core Dashboardの比較・判定・local feedback・copyは利用可能でなければならない。

## Browser QA

Playwright smokeで最低以下を検証する。

- initial 0/26 progress
- keyboard `1` green auto-advance PC→SP
- yellow stays on current context
- issue prefill includes latest comment
- arrow traversal
- N next-unreviewed
- U filter
- P/S viewport switch
- reload persistence
- safe bulk-green preserves yellow/comment
- mobile Web/Figma switch
- Overlay capability gate remains unchanged
