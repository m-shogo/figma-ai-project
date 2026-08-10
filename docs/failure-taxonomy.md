# Failure Taxonomy

「なんか違う」「AIっぽい」で終わらせず、再発防止できる原因単位に分解する。

1 failure record に複数categoryを付けてよいが、**primary cause** は1つ選ぶ。

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

## Structural failures

### COMPONENT_REUSE_MISS
既存componentを使うべき箇所で再実装した。

### WRONG_COMPONENT
似ているが異なるcomponent/variantを選択。

### TOKEN_REUSE_MISS
既存token/variableを使わずraw valueを増やした。

### COMPONENT_PROP_MISS
Figma variant/property と code prop の対応を誤った。

### CODE_CONNECT_MISS
利用可能なmappingを使えなかった/誤読した。

### SEMANTIC_STRUCTURE
DOM/component hierarchy/meaningがreference意図と不整合。

### ACCESSIBILITY
semantic HTML / label / focus / contrast / interaction accessibility。

## Responsive failures

### RESPONSIVE_INVARIANT
幅が変わっても維持すべき性質を壊した。

### BREAKPOINT_GUESS
根拠なくbreakpointを選び不自然になった。

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

## State / behavior failures

### STATE_MISSING
必要state未実装。

### INTERACTION_MISMATCH
hover/click/open/close/scroll behavior mismatch。

### ROUTING_MISMATCH
既存routing contractを壊した。

### DATA_STATE_MISMATCH
loading/empty/error/data behavior mismatch。

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
画像化/absolute positioning等で構造問題を隠した。

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

## Severity

### S0 — Observation
見た目にほぼ影響なし。

### S1 — Minor
局所調整で直る。

### S2 — Material
明確にreferenceと違い、repairが必要。

### S3 — Major
section/component単位の作り直し。

### S4 — Invalid run
比較条件が壊れ、run自体を実験データとして扱いにくい。

## Root-cause confidence

- HIGH: evidenceでほぼ特定
- MEDIUM: 強い仮説
- LOW: まだ切り分け不足

LOWのままplaybook ruleへ昇格しない。

## Example

```yaml
failure_id: F-004
severity: S2
primary: RESPONSIVE_INVARIANT
secondary:
  - CONTEXT_MISSING
surface: mobile
observation: "SPでCTA順序がreferenceと逆"
evidence:
  - "reference screenshot"
  - "implementation screenshot"
root_cause: "PC→SP ordering ruleがcontext packageに明示されていなかった"
confidence: HIGH
repair: "responsive contractへordering invariantを追加"
replay_required: true
```
