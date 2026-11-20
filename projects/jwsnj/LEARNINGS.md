# Learnings

## 案件中の FB

| 日付 | W | 何が起きたか | 直したコミット |
|---|---|---|---|
| 2026-11-20 | W10 | Figmaの1行表示に合わせて `line-height: 1` のままにすると、2〜3行に折り返したときに行間や固定高さが破綻し、後戻りしやすい。通常テキストは原則 `1.3` にし、複数行・PC/SP/中間幅を事前チェック。例外はアイコン等の理由を記録。 | [5649ee9](https://github.com/m-shogo/figma-ai-project/commit/5649ee90fe9d17dd4e763093d211aeab45b75dc7)（仕様化） |

W は `docs/agent-human-fb-weak-spots.md` の W1–W10。

## 閉じるときの振り返り

- W ごとの件数:
- 一番多かった種類と、その原因:
- 次の案件で着手前にやること:
