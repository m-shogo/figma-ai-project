# Community / Field Signal Registry

Last scanned: **2026-08-10 JST**

公式情報だけでは分からない、実際にFigma + AI coding agentsを触っている人の成功・失敗・運用ノウハウを集める。

ここにある情報は **E0 External Signal**。直接playbookへ昇格しない。

Evidence policy: `docs/evidence-policy.md`

---

## Signal format

- ID
- observed/published date
- source type
- source
- signal
- why it matters
- possible confounders
- current priority
- evidence maturity
- proposed experiment

---

## CS-001 — Progressive Disclosure / scope splitting

- Source type: experienced practitioner / Zenn
- Source: https://zenn.dev/imkohenauser/articles/cursor-agent-client-work
- Published: 2026-06-06, updated 2026-06-20
- Evidence: E0
- Priority: **HIGH**

### Signal

大きいページを一括で実装させるより、section/component単位で必要contextを必要なタイミングで渡す運用の方が、細かいfont-size/gap等の再現精度を保ちやすいという実務報告。

同記事では、Figma URLだけでなく対象範囲・既存ファイル・responsive優先・命名/配置規約などをtask specificationとして与える運用も紹介されている。

### Why it matters

本repoのstaged workflow / context efficiency仮説と強く重なる。

### Do not conclude yet

- Cursor固有かもしれない
- page complexity依存かもしれない
- model/context-window更新で最適粒度が変わる可能性

### Proposed experiment

- whole-page one-shot
- section progressive disclosure

をsame agent/model/referenceで比較。

Measure:

- First-pass Fidelity
- context usage
- repair rounds
- repeated spacing/typography failures

---

## CS-002 — Code Connect coverage may materially improve codebase fit

- Source type: first-party benchmark / Figma
- Source: https://www.figma.com/blog/the-benefits-of-code-connect-in-mcp/
- Published: 2026-08-05
- Evidence: E0 external benchmark
- Priority: **HIGH when a real design system + Code Connect exists**

### Signal

Figmaの27 test-case evalでは、Code Connectありでmedian task duration、token usage、code-quality metricが改善したと報告されている。

また改善量は、対象designがdesign-system componentで構成されている割合とCode Connect coverageの影響を強く受けたとしている。

### Why it matters

単純なon/offではなく **coverageを実験metadataとして測るべき**可能性が高い。

### Do not conclude yet

- Figmaのfirst-party eval
- tested design systems/modelsが限定される
- project architectureにより効果は変わる

### Proposed experiment

C3 vs C4だけでなく:

```text
component_coverage
code_connect_coverage
mcp_response_mapping_coverage if observable
```

を記録して効果と相関を見る。

---

## CS-003 — Skills as procedural memory

- Source type: Figma first-party + practitioner synthesis
- Sources:
  - https://www.figma.com/blog/got-skills-make-the-figma-agent-a-better-collaborator/
  - https://zenn.dev/canly/articles/78dcc98c3dfb46
- Published: 2026-07-01 / 2026-02-25
- Evidence: E0
- Priority: **HIGH**

### Signal

反復するtool order、component/token優先、screenshot verification、review手順などをSkillとして固定する考え方。

### Why it matters

巨大promptより、再利用可能なprocedureとして分離した方がagent/client間のinstruction driftを抑えられる可能性。

### Proposed experiment

- plain task prompt
- same prompt + reusable skill/procedure

でFirst-pass / skipped-stage failure / context sizeを比較。

---

## CS-004 — CJK / font behavior remains environment-sensitive

- Source type: Zenn + Figma Forum / field issue
- Sources:
  - https://zenn.dev/ryo256/articles/figma-mcp-japanese-text-blank
  - https://forum.figma.com/report-a-problem-6/japanese-text-not-displayed-when-capturing-designs-via-claude-code-to-figma-51025
  - https://forum.figma.com/share-your-feedback-26/mcp-loadfontasync-fails-for-locally-installed-fonts-52313
  - https://forum.figma.com/report-a-problem-6/figma-mcp-does-not-support-writing-pingfang-sc-fonts-53857
- Observed through: 2026-07
- Evidence: E0
- Priority: **HIGH for Japanese/CJK projects**

### Signal

MCP/cloud capture/write workflowsで、local/uploaded font availabilityやCJK font handlingに関する複数のfield reportsがある。Figma側回答にはworkaroundや現在の制約説明もある。

### Why it matters

Typography mismatchをprompt failureと誤判定せず、environment/tool capabilityとして切り分ける必要がある。

### Do not conclude yet

**「日本語Figma MCPはダメ」とはしない。**

font supportは短期間で改善されうる。referenceごとにfont preflightを行い、client/MCP mode/font availabilityを記録する。

### Proposed experiment / preflight

- exact reference font availability
- remote vs relevant local/desktop path if applicable
- fallback behavior
- screenshot result

を確認。

---

## CS-005 — Real-world MCP experience is heterogeneous

- Source type: X/Twitter community posts
- Examples:
  - positive/enthusiastic: https://x.com/kloss_xyz/status/2036518085507813663
  - negative/connectivity report: https://x.com/codyplof/status/2036518263681589431
- Published: 2026-03-24
- Evidence: E0
- Priority: **MEDIUM**

### Signal

同時期・同機能でも非常に高く評価する利用者と、接続/安定性に強い不満を持つ利用者がいる。

### Why it matters

成功/失敗がclient config、auth、plan、version、environmentに依存する可能性を示す探索signal。

### Proposed response

- Environment snapshotを必須化
- tool failureをdesign/prompt qualityと分離
- connectivity failureをagent quality scoreへ混ぜない

---

## CS-006 — Code → editable Figma can shorten round-trip review

- Source type: practitioner / Zenn + Figma first-party
- Sources:
  - https://zenn.dev/daishiro/articles/figma-code-to-canvas-trial
  - https://www.figma.com/blog/the-future-of-design-is-code-and-canvas/
- Published: 2026-02
- Evidence: E0
- Priority: **MEDIUM**

### Signal

running UIをeditable Figma layersへ戻し、canvas上で比較/修正/意思決定するround-tripが実用候補になっている。

### Why it matters

本repoの主目的はFigma→Code fidelityだが、将来的に:

```text
Figma reference
→ implementation
→ running UI
→ editable comparison frame
→ designer correction
→ implementation
```

というrepair loopが人間の戻りを減らす可能性がある。

### Caution

Reference source of truthを上書きしない。comparison/review pageへ分離する。

---

## CS-007 — Harness quality may matter as much as model choice

- Source type: experienced practitioner / Zenn
- Source: https://zenn.dev/imkohenauser/articles/cursor-agent-client-work
- Evidence: E0
- Priority: **HIGH**

### Signal

実務ではcodingそのものより、agentが迷わないprompt/rules/file structure/constraintsを整える作業の比重が大きいという報告。

Cursor codebase indexingも関連ファイル探索を助ける一方、大規模projectではcontext costが増えるためscope designが重要とされている。

### Proposed experiment

同じmodel/referenceで:

- ad-hoc prompt
- canonical harness + reference/run contract

を比較。

---

## CS-008 — Rich Figma metadata does not automatically solve responsiveness/maintainability

- Source type: research paper
- Source: https://arxiv.org/abs/2604.13648
- Published: 2026-04
- Evidence: E0 research
- Priority: **MEDIUM-HIGH**

### Signal

Figma image + metadataを使ったdesign-to-code benchmarkでも、proprietary modelsはvisual fidelityで強い一方、responsive behaviorやmaintainabilityに課題が残ると報告されている。

### Why it matters

structured contextを入れれば完了ではなく、本repoでStructural Fidelity / Robustnessを別評価している理由を補強する。

### Proposed experiment

endpoint screenshot一致とintermediate-width robustnessを必ず分けて測る。

---

## CS-009 — Old setup knowledge becomes stale quickly

- Source type: practitioner / Qiita / Zenn
- Examples:
  - older third-party/local MCP setup articles
  - newer remote/use_figma/client-integrated flows
- Evidence: E0
- Priority: **HIGH for research process**

### Signal

数か月単位で接続方法・tool availability・client supportが変わるため、古いsetup記事が検索上位に残る。

### Response

- capability factはofficial current docsで再確認
- community articleはpublish/update dateを必ず保存
- `STALE_UNTIL_REVERIFIED`を使う
- old workaroundを永久ruleにしない

---

## CS-010 — Figma internal structure may strongly affect generated implementation

- Source type: practitioner controlled comparison / Zenn
- Source: https://zenn.dev/yokkomystery/articles/3904e7db644ea1
- Published: 2026-03-27, updated 2026-03-28
- Evidence: E0
- Priority: **HIGH**

### Signal

同じ見た目のlogin screenを、片方はAuto Layout/Variables/Components/semantic namingあり、もう片方はabsolute positioning/hardcoded HEX/default layer namesで作り、Figma MCP→Flutter codeを比較した実験報告では、structured側が大幅に高い評価になったとしている。

記事内評価は35点満点でstructured 32、messy 10。

### Why it matters

「Figma screenshotの見た目が同じならagentへの入力も同じ」ではない可能性を示す。

### Do not conclude yet

- single practitioner experiment
- Flutter / specific agent/model条件
- scoring methodはrepo独自

### Proposed experiment

reference designを変えず、可能なら同じvisual appearanceでstructure-only variationを作れる研究用testで:

- semantic structure
- Auto Layout
- variables
- componentization

の寄与を分けて測る。

実案件referenceを勝手に変更してこの実験をしない。

---

## CS-011 — Auto Layout discipline may improve code translation

- Source type: experienced practitioner / Zenn
- Source: https://zenn.dev/ryutagoto/articles/figma-mcp-auto-layout-for-code
- Published: 2026-05-11
- Evidence: E0
- Priority: **HIGH, but update-sensitive**

### Signal

Figma MCP経由でcodeに落としやすいdesign dataを作る運用として「Auto Layoutから逸脱させない」方針に至ったという実務報告。

### Why it matters

layout semanticsがCSS/native layoutへ翻訳される時のdrift削減候補。

### Update sensitivity

2026-07-24にFigma自身がAuto LayoutをCSSへ近づける更新を出しているため、この記事の観測条件と現在条件は同一ではない。

**古い成功をそのままDEFAULTにせず、新Auto Layout generationで再試験する価値が高い。**

### Proposed experiment

- legacy Auto Layout reference when available
- updated Auto Layout reference

をenvironment metadata付きで比較する。

---

## CS-012 — Real-browser screenshot loop is repeatedly reported as useful

- Source type: experienced practitioner / Zenn
- Source: https://zenn.dev/reality_tech/articles/1d6df6811715fb
- Published: 2026-01-07
- Evidence: E0
- Priority: **HIGH**

### Signal

Figma MCP contextが大きくなりやすい問題に対し、task分割とPlaywrightによるbrowser screenshot comparisonを組み合わせるworkflowが紹介されている。

### Why it matters

本repoの:

- staged workflow
- deterministic capture
- Verify phase

と独立した現場経験が一致する。

### Do not conclude yet

Playwrightそのものを永久必須にしない。将来client内蔵browser/visual toolingがより良くなる可能性がある。

必要なのは `real rendered output + exact viewport + preserved evidence`。

---

## CS-013 — Project-specific design-system mapping rules can bridge MCP output to native conventions

- Source type: production-oriented practitioner / Zenn
- Source: https://zenn.dev/dely_jp/articles/2cc6637e4d0aad
- Published: 2026-04-07
- Evidence: E0
- Priority: **HIGH for mature design systems**

### Signal

Figma URLからCompose codeを生成するPoCで、Figma MCP出力だけではproject固有design systemへ準拠しにくく、mapping ruleを追加することで実装を既存theme/componentへ寄せる運用が紹介されている。

### Why it matters

C3 codebase-aware context / agent adapters / Code Connectが効く領域と重なる。

### Proposed experiment

- structured Figma only
- + project mapping rules
- + Code Connect where available

でduplicate primitive、token reuse、First-passを比較する。

---

## CS-014 — Small iterative canvas writes may be more reliable than giant writes

- Source type: practitioner / Qiita
- Source: https://qiita.com/toguri/items/472a611e9a3f70a499f2
- Published: 2026-03-28
- Evidence: E0
- Priority: **MEDIUM-HIGH for Code→Figma/write workflows**

### Signal

`use_figma`実運用のハマりどころとして、1回のscriptでやりすぎず小さく進めることやAuto Layout sizing設定順が挙げられている。

### Why it matters

Figma write workflowsでのatomic/incremental operation設計候補。

### Update sensitivity

MCP/use_figmaはbetaで改善が速い。現在のFigma skill docsもincremental workを推奨するが、API behavior自体が変わる可能性がある。

### Proposed experiment

大規模writeが必要になった時だけ:

- one giant call
- section/component incremental calls

のfailure/retry/context costを比較する。

---

# Current high-priority research queue

1. Progressive Disclosureの粒度
2. structured vs visually-equivalent messy Figmaの寄与
3. updated Auto Layout generationの影響
4. Skill/procedure固定の効果
5. Code Connect coverageと改善量
6. project design-system mapping ruleの効果
7. CJK/font preflight
8. real-browser verification loop
9. harnessあり/なしのFirst-pass差
10. code→Figma comparison loopの価値
11. incremental canvas write strategy
12. agent/clientごとのtool reliability

この順序も固定ではない。新releaseや複数community signalが出たらpriorityを再計算する。
