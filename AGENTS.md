# AGENTS.md

このリポジトリを扱う AI agent 共通の作業規約です。

## Mission

Figma と AI coding agent の往復精度を改善し、**既に決まっている PC / SP デザイン**の実装に必要な人間の手直しを減らす。

「今回だけ綺麗にできた」ではなく、再現可能な手順・prompt・context設計・評価方法を残すことを優先する。

## Source of truth boundary

Reference design はこのrepoが決めない。

- ユーザー/案件側で決まった Figma が source of truth
- reference未提示なら design を発明しない
- reference未提示時は tooling / workflow / evaluation / prompt architecture / research のみ進める
- referenceを受け取ったら freeze contract を作るまで実装を開始しない
- experiment途中で reference design を勝手に修正しない

## Production execution default — section first

現時点のproduction defaultはページ全体を1 workerへ丸投げしない。

```text
Frozen reference
→ Global reconnaissance
→ Shared contract DRAFT
→ Section manifest
→ Shared foundation implementation
→ Foundation verification
→ Shared contract FROZEN + hash
→ Parallel section workers
→ Coordinator integration
→ Global verification
```

section例:

- Header
- MainVisual
- Content01
- Content02
- Footer

詳しくは `docs/section-execution.md`。

Whole-page one-shotは永久禁止ではなく、tool/model進化を測るresearch cohortとして残す。

## Breakpoint source of truth

案件側にデザイナー / 会社 / design system / existing productのbreakpoint指定がある場合、**その指定を全section共通で使う。**

AIは:

- breakpoint sourceを特定する
- exact value/query semanticsをshared contractへ記録する
- sectionごとのbehaviorを実装する
- boundaryで破綻しないか検証する

AIが独断で慣習値やsection固有breakpointを追加しない。

必要に見える場合は `PROPOSE_BREAKPOINT_EXCEPTION` として証拠付き提案に留める。

詳しくは `docs/responsive-breakpoint-policy.md`。

## Shared contract rule

Parallel section implementation前に `templates/shared-contract.yaml` をfreezeする。

Shared contractには最低限:

- codebase/style architecture
- fonts
- tokens
- container/gutter
- shared components
- breakpoint source + values
- asset policy
- accessibility baseline
- coordinator-only/shared paths
- verified foundation commit

を含める。

Section manifest/run recordはshared contractのSHA-256とfoundation commitを保持する。

**異なるcontract hash / foundation commitのsection outputを無条件で混ぜない。**

## Update-aware rule — mandatory for significant runs

Figma / MCP / Codex / Claude Code / Cursor は高速に進化する。

**新しいbenchmark、新referenceの初run、重要なFigma作業の前には `docs/update-preflight.md` に従って最新情報を最低1回確認する。**

最低確認:

- Figma release notes
- current Figma MCP docs/tools
- 今回使うagent/clientのcurrent docs
- recent practitioner/community signals

過去のlimitation/失敗/workaroundを現在も有効だと自動仮定しない。

関連updateがあれば `RETEST_NOW` candidateへ戻す。

## Evidence rule — no permanent ban from one failure

通常の品質研究では、1回の失敗で方法を永久禁止しない。

- 1 failure = weak negative signal / Observation
- repeated clean failure = stronger CAUTION
- major tool/model update = retest trigger

同様に、1回の成功でbest practiceにしない。

Evidence maturityは `docs/evidence-policy.md`:

```text
E0 External Signal
→ E1 Local Observation
→ E2 Clean Replay
→ E3 Cross-run/Agent
→ E4 Cross-reference
→ E5 Portable Proven
```

品質上のrecommendationは可逆:

- EXPERIMENTAL
- OPTIONAL
- PREFERRED
- DEFAULT
- CAUTION
- DEFERRED
- SUPERSEDED
- RETIRED

安全性/セキュリティ/データ損失/ユーザー明示禁止などを除き、`絶対ダメ` を安易に作らない。

## Community knowledge

公式仕様をsource of truthとして確認しつつ、実務ノウハウの発見には:

- Zenn
- Qiita
- X / Twitter
- Figma Forum
- GitHub Issues/Discussions
- Reddit
- engineering blogs
- research/benchmarks

も使う。

Community signalは直接playbookへ入れず:

```text
external signal → hypothesis → experiment → replay → promotion
```

で検証する。

`docs/community-signal-registry.md` と `docs/research-radar.md` を参照。

## Mandatory Loop

すべてのproduction-orientedデザイン再現実験は次を守る。

0. Tooling update preflight
1. Referenceをfreeze
2. Global reconnaissance
3. Shared contract DRAFT
4. Section manifest作成
5. Shared foundation実装
6. Foundation verification
7. Shared contract FROZEN + hash
8. Section-scoped Inspect run
9. First-pass implementation保存
10. Exact viewportで比較
11. Integration verification
12. Failure taxonomyで分類
13. Targeted repair
14. 再評価
15. Clean baselineから再実行
16. 汎用化できる知識だけ昇格

PAGE_BENCHMARKではsection-firstの一部を意図的に外してよいが、run recordで明示する。

## Do Not

- referenceがないのに架空画面を作る
- screenshotだけを見て構造を推測し、Figma metadataを読めるのに読まない
- PC/SPを無関係な2画面として別々にハードコードする
- company/designer指定breakpointをAI判断で置換する
- section workerが独自breakpointを追加する
- section workerがshared token/font/container/componentを無断変更する
- contract hashが違うsection outputをそのまま統合する
- 失敗した prompt / run / repair理由を消す
- 1回成功したテクニックを即「ベストプラクティス」と呼ぶ
- 1回失敗したテクニックを永久禁止にする
- agent/model固有挙動を汎用ルールとして混ぜる
- 古いtool limitationをupdate確認なしで現在へ適用する
- 見た目の一致だけで合格にする
- giant promptにすべてを詰め込む
- unrelated redesign / UX improvementを行う
- visual hackでstructural mismatchを隠す

## Prefer

- current Figma MCP structured context
- broad metadata → relevant section node のprogressive disclosure
- components / variants
- variables / tokens
- Auto Layout / sizing semantics
- semantic layer names and annotations
- Code Connect when available and relevant
- exact original assets
- screenshots as visual ground truth
- browser rendering at exact viewport sizes
- deterministic fixture content
- section-scoped Inspect → Implement → Verify → Repair
- immutable shared contract for parallel workers
- shared foundation before parallelism
- machine-readable experiment metadata
- clean re-run
- recent official + practitioner research before important runs
- smallest sufficient context rather than maximum context

## Required Experiment Record

各 run に最低限残すもの:

- tooling update preflight
- experiment id
- run id
- run scope: SECTION / INTEGRATION / PAGE_BENCHMARK
- section id when applicable
- shared contract path/hash
- foundation commit
- date/time
- agent
- exact model/alias if known
- client/tool version if known
- Figma file/node
- reference capture timestamp
- target repo/commit
- framework
- viewport(s)
- prompt version/hash
- context package version/hash
- files/context supplied
- generated output reference
- first-pass score
- final score
- repair rounds
- failure categories
- assumptions
- repairs performed
- reusable lessons
- agent-specific lessons
- unresolved questions

## Knowledge Promotion

知識は段階的かつ可逆に扱う。

### Observation

1回の実験で見えた事実。まだ一般化しない。

### Candidate Rule

clean replay等で再現した仮説。

### Proven Playbook

異なる画面/案件でも再現し、First-passまたはRework Costの改善が測定できたもの。

現在Provenでもtool updateで再評価可能。

`docs/knowledge-promotion.md` に従う。

## When Comparing Agents

Codex / Claude Code / Cursorなどを比較するときは、可能な限り以下を揃える。

- same frozen Figma reference
- same section boundary / node
- same shared contract hash
- same verified foundation commit
- same assets
- same target viewports
- same acceptance criteria
- same maximum repair rounds
- same context tier

比較は2種類に分ける。

1. **COMMON** — 共通prompt/共通contextでagent差を見る
2. **OPTIMIZED** — agent固有のcurrent best practiceを使い、実務上の最高到達点を見る

両者を混ぜてランキングしない。

## Future multimodal direction

Promptだけを最終成果にしない。

将来、必要性が実験で確認できたら:

- image/screenshot ingestion
- reference + first-pass + final contact sheet
- overlay/diff
- AI visual review
- experiment dashboard
- update/retest radar

へ発展させる。

`docs/future-platform.md` と `docs/image-only-research-track.md` を参照。

## Definition of Done for an Experiment

- before / afterを比較できる
- first-passを保存している
- run scopeが明確
- shared contract/foundationが追跡できる
- なぜ改善したか説明できる
- clean rerunで改善が再現した
- reusable lessonとproject-specific lessonが分離されている
- unresolved issueが明示されている
- reference designを変更していない
- run開始時点のtooling/current knowledgeが記録されている
