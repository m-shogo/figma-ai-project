# Failure Taxonomy

「なんか違う」「AIっぽい」で終わらせず、再発防止できる原因単位に分解する。

1 failure recordに複数categoryを付けてよいが、**primary causeは1つ選ぶ。**

---

## Context failures

### CONTEXT_MISSING
必要情報をagentへ渡していなかった。

### CONTEXT_NOT_READ
情報は存在したがagentが取得/参照しなかった。

### CONTEXT_IGNORED
agentは情報を取得したが実装へ反映しなかった。

### CONTEXT_OVERLOAD
context過多で重要条件が埋もれた疑い。

### REFERENCE_AMBIGUITY
原本だけでは複数解釈が成立する。

### CONTRACT_MISSING
Shared Contractが必要なrunなのに作成/提供されていない。

### CONTRACT_STALE
worker/runが現在のShared Contract hashと異なるrevisionを使用した。

---

## Visual failures

### GEOMETRY
width / height / position / proportion / alignment。

### SPACING
padding / gap / margin / visual rhythm。

### TYPOGRAPHY
font / weight / size / line-height / letter-spacing / wrapping。

### COLOR
fill / text / background / opacity。

### BORDER_EFFECT
border / radius / shadow / blur / effect。

### ASSET
wrong asset / placeholder / missing image/icon。

### IMAGE_CROP
fit / fill / focal point / clipping mismatch。

### LAYER_ORDER
z-index / overlap / stacking mismatch。

### BACKGROUND_CONTINUITY
section境界でbackground/decoration/bleedが不自然に切れた。

---

## Structural failures

### COMPONENT_REUSE_MISS
既存componentを使うべき箇所で再実装した。

### WRONG_COMPONENT
似ているが異なるcomponent/variantを選択。

### TOKEN_REUSE_MISS
既存token/variableを使わずraw valueを増やした。

### COMPONENT_PROP_MISS
Figma variant/propertyとcode propの対応を誤った。

### CODE_CONNECT_MISS
利用可能なmappingを使えなかった/誤読した。

### SEMANTIC_STRUCTURE
DOM/component hierarchy/meaningがreference意図と不整合。

### ACCESSIBILITY
semantic HTML / label / focus / contrast / interaction accessibility。

### DUPLICATE_SHARED_PRIMITIVE
shared Button/token/container/helper等が既にあるのにsection内で重複実装した。

---

## Responsive failures

### RESPONSIVE_INVARIANT
幅が変わっても維持すべき性質を壊した。

### BREAKPOINT_GUESS
明示sourceを確認せず慣習値や推測値を選んだ。

案件指定がある場合は原則S2以上のworkflow/implementation failureとして扱う。

### BREAKPOINT_CONTRACT_VIOLATION
Shared Contractと異なるbreakpoint値/query directionを使用した。

例:

- globalは`max-width: X`なのに1sectionだけ別値
- `min-width`/`max-width`の向きを誤った
- legacy breakpoint utilityを混ぜた

### BREAKPOINT_BOUNDARY
指定breakpoint自体は正しいが、境界直前/直後でgap/overlap/visibility等が破綻した。

### WRAP_ORDER
折返し/並び順が異なる。

### VISIBILITY_RULE
show/hide条件が異なる。

### CONTAINER_RULE
max-width/min-width/padding behavior mismatch。

### OVERFLOW
横スクロール、clip、はみ出し。

### INTERMEDIATE_WIDTH
PC/SP endpointは合うが途中幅で破綻。

---

## Section / integration failures

### SECTION_BOUNDARY_WRONG
Figmaの論理sectionを誤って切り分け、責務/背景/spacing/interactionが別workerへ分断された。

### FOUNDATION_MISMATCH
workerがverified foundation commit以外から開始した。

### ALLOWED_PATH_VIOLATION
section workerがmanifestで許可されていないfileを変更した。

### SHARED_FILE_MUTATION
section workerがread-onlyのtoken/font/global CSS/shared component/root composition等を直接変更した。

### SECTION_ORDER
統合時のsection順序がreferenceと異なる。

### CROSS_SECTION_SPACING
section単体は合うがsection間のvertical rhythm/gapが異なる。

### CONTAINER_ALIGNMENT_DRIFT
sectionごとにcontent edge/container基準がズレた。

### TYPOGRAPHY_HIERARCHY_DRIFT
section単体のfont値は近いが、ページ全体のheading/body hierarchyが不整合。

### PARALLEL_MERGE_CONFLICT
parallel output同士が同じsurfaceを変更し、clean integrationできない。

### PARALLEL_RULE_DRIFT
parallel worker間で同じshared ruleの異なる解釈/duplicateが発生した。

### INTEGRATION_REGRESSION
section統合後に、単体では存在しなかったvisual/behavior regressionが発生した。

---

## State / behavior failures

### STATE_MISSING
必要state未実装。

### INTERACTION_MISMATCH
hover/click/open/close/scroll behavior mismatch。

### ROUTING_MISMATCH
既存routing contractを壊した。

### DATA_STATE_MISMATCH
loading/empty/error/data behavior mismatch。

---

## Agent / workflow failures

### AGENT_ASSUMPTION
確認可能な情報を調べず推測した。

### PROMPT_AMBIGUITY
instructionが曖昧でagent解釈差を招いた。

### PROMPT_CONFLICT
複数instructionが矛盾。

### STAGE_SKIPPED
Inspect/Verifyなど必須phaseを飛ばした。

### VERIFY_WEAK
実画面比較が弱くmismatchを見逃した。

### REPAIR_TOO_BROAD
1回のrepairで複数領域を触り原因追跡不能。

### REGRESSION
repairが別の一致箇所を壊した。

### OVERFITTING
特定viewport/screenshotだけに合わせたhack。

### VISUAL_ONLY_HACK
画像化/不必要なabsolute positioning等で構造問題を隠した。

### SHARED_CHANGE_BYPASS
`PROPOSE_SHARED_CHANGE` / coordinator reviewを経ずshared contract/foundationを変更した。

### BREAKPOINT_EXCEPTION_BYPASS
`PROPOSE_BREAKPOINT_EXCEPTION`を経ずsection固有thresholdを追加した。

---

## Environment failures

### TOOL_UNAVAILABLE
MCP/browser/capture等が使えない。

### PERMISSION
Figma/repo/tool permission不足。

### RATE_LIMIT
tool rate limit。

### CLIENT_LIMITATION
agent client固有制限。

### DEPENDENCY_ENV
install/runtime/build environment問題。

### FONT_ENVIRONMENT
必要fontがclient/MCP/browser/build environmentで利用できず、typography/layoutが崩れた。

Tool/model/Figma updateで解消される可能性があるため永久rule化しない。

---

## Severity

### S0 — Observation
見た目/構造にほぼ影響なし。

### S1 — Minor
局所調整で直る。

### S2 — Material
明確にreference/contractと違いrepairが必要。

### S3 — Major
section/component単位の作り直し、またはshared foundation再構築が必要。

### S4 — Invalid run
比較条件が壊れrun自体を実験データとして扱いにくい。

Examples:

- wrong reference revision
- wrong shared contract hash
- wrong foundation commit
- COMMON比較なのに異なるbreakpoint contract

---

## Root-cause confidence

- HIGH: evidenceでほぼ特定
- MEDIUM: 強い仮説
- LOW: まだ切り分け不足

LOWのままplaybook ruleへ昇格しない。

---

## Example — breakpoint drift

```yaml
failure_id: F-004
severity: S2
primary: BREAKPOINT_CONTRACT_VIOLATION
secondary:
  - SHARED_FILE_MUTATION
surface: S03-Content01
observation: "Content01だけcompany指定と異なるmedia queryを追加"
evidence:
  - "shared-contract.yaml"
  - "Content01.module.css"
root_cause: "workerがglobal breakpointをlocal optimizationとして上書きした"
confidence: HIGH
repair: "shared breakpointへ戻しboundary captureを追加"
replay_required: true
```

## Example — section visual mismatch

```yaml
failure_id: F-005
severity: S2
primary: SPACING
secondary:
  - CONTEXT_MISSING
surface: S02-MainVisual
observation: "SPでCTA間gapがreferenceより大きい"
evidence:
  - "reference screenshot"
  - "implementation screenshot"
root_cause: "section contextにnested Auto Layout gapが含まれていなかった"
confidence: HIGH
repair: "nested node contextを追加してsectionだけrepair"
replay_required: true
```
