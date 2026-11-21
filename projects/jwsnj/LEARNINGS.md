# Learnings

## 案件中の FB

| 日付 | W | 何が起きたか | 直したコミット |
|---|---|---|---|
| 2026-11-20 | W10 | Figmaの1行表示に合わせて `line-height: 1` のままにすると、2〜3行に折り返したときに行間や固定高さが破綻し、後戻りしやすい。通常テキストは原則 `1.3` にし、複数行・PC/SP/中間幅を事前チェック。例外はアイコン等の理由を記録。 | [5649ee9](https://github.com/m-shogo/figma-ai-project/commit/5649ee90fe9d17dd4e763093d211aeab45b75dc7)（仕様化） |

| 2026-11-20 | W9 | ベースThemeのサンプル機能を案件仕様と誤認するリスク。今回CPTは不要なイベントのみだったので登録処理をコメントアウト、関数は学習用に保持。ほかのCPTを創作しない。 | `theme/inc/custom.php`（登録無効化） |
| 2026-11-20 | W10 | Human再確認: `nowrap` を使わない、150〜200%の文字拡大専用QAは過剰。通常テキストの2〜3行とPC/SP/中間幅に集中し、Figmaの座標を固定レイアウトに写経しない。 | `docs/SPEC.md` / `docs/IMPLEMENTATION_CHECKLIST.md` |

W は `docs/agent-human-fb-weak-spots.md` の W1–W10。

## 閉じるときの振り返り

- W ごとの件数:
- 一番多かった種類と、その原因:
- 次の案件で着手前にやること:

## 2026-11-21: repeated token audit stalled (recovery)

- Symptom: repeated attempts to inspect all 116 CSS/PHP/JS files consumed connector calls without completing a reference inventory or code changes. The exact previous limit/error was not captured; do **not** assume an API rate-limit diagnosis.
- This run: local `rg` is installed but no repository clone was present; GitHub code search for the literal CSS custom property returned HTTP 422 (`QUERY_PARSING_FATAL`), while a punctuation-free search returned no matches (not proof of no references).
- Recovery: **do not repeat 116 individual reads or delete tokens based on empty search results**. Prefer a local clone plus one `rg -n -- 'jwsnj-color-' projects/jwsnj/theme`, if repository access is available. Otherwise inspect only files affected by the next concrete change and record coverage. Proceed with independent header accessibility work while the token audit is blocked.
- Figma PC `0:1` and SP `263:12` screenshots were retrieved. Required design-to-code skill was absent from the installed skills listing, so detailed design context was **not** obtained; no font or visual-parity claims.
- Verification: the header `:focus-visible` CSS rule was checked in the PR branch. Browser keyboard navigation and WordPress runtime remain deferred; PR CI must pass before merging.
