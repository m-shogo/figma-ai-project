# Context Package

AIへの入力を「会話の勢い」ではなく、runごとに再現できるpackageとして扱う。

## Two layers

Section-first productionでは入力を:

1. **Coordination Envelope** — production consistencyに必要な固定contract
2. **Context Tier** — agentへどこまで追加contextを取得/提供するか

に分ける。

Context Tierを低くしてもCoordination Envelopeは削らない。

---

## Coordination Envelope — production SECTION/INTEGRATIONで必須

### Frozen Reference

- reference manifest path/hash
- exact reference/node IDs
- exact acceptance viewports/states
- owner/company guidance tied to that reference

### Shared Contract

- contract path/SHA-256
- Figma Capability Profile + strategy decisions
- component resolution
- token resolution
- fonts
- shared breakpoint contract
- shared layout/container/gutter
- asset policy
- styling architecture
- coordinator-only/read-only shared surfaces

### Verified Foundation

- exact foundation commit
- shared components/tokens/fonts/layout primitives available at that commit

### Section Manifest

SECTION runではexact section entry:

- section ID / PC/SP node IDs
- boundary/mapping evidence
- dependencies/coupling
- allowed write paths
- parallel group/isolation
- responsive behavior at shared breakpoint(s)

### Per-section Figma Structure Profile

- profile path/SHA-256
- exact section profile entry
- signal states/confidence/evidence
- `recommended_translation_mode`
- trusted structure
- untrusted/missing structure
- codebase reuse priority
- tooling snapshot

This profile is a **translation strategy**, not a replacement source of design truth.

### Applicable Knowledge Slice

Production `SECTION` / `INTEGRATION` runでは、過去の学びを保存するだけでなく、**今回scopeへ適用可能なportable knowledgeを開始前に選択して入力へ含める**。

Source:

- `playbook/proven/*.yaml` — portability evidenceが十分なrule
- `playbook/candidates/*.yaml` — clean replay済みだが追加検証中のrule
- `docs/frontend-pattern-library.md` 等のdomain Pattern Library — target failure/intentが今回scopeへ一致するものだけ

Selectionは最低限:

- target failure / UI pattern / implementation familyが今回scopeへ関係するか
- scope labelが今回へ適用可能か
- evidence maturity / recommendation strength
- `last_verified_at`
- verified tooling / agent / CMS / framework条件
- known limits
- retest triggerが発火していないか

を見る。

**Candidateはhard ruleではない。** `OPTIONAL / PREFERRED / CAUTION`等のrecommendationとevidence maturityを保ったまま判断材料へ入れる。

適用ruleが0件なら0件でよい。無関係なplaybookを大量投入してcontextを汚染しない。

Run Recordには、実際に入力へ使ったruleをpath/SHA・maturity・recommendation・selection reason付きで残す。

```text
Past evidence
→ applicable knowledge selection
→ current run input
→ result
→ confirm / contradict / new observation
→ replay / promotion / demotion / retest
→ next run selection
```

これをlearning closed loopとする。

### Run lineage

- run ID/scope
- agent/model/client version if known
- prompt/context hashes
- isolation identity when parallel
- applicable knowledge refs / hashes

---

## Why Envelope and Tier are separate

Without this split, `C1 Structured Figma` could accidentally mean:

- no shared breakpoint contract
- no component/token resolution
- no profile revision
- no foundation pin
- no applicable learned-rule lineage

which would make section outputs incomparable and inconsistent.

Production comparison should vary context retrieval while keeping coordination fixed。

---

## Context tiers

### C0 — Visual/minimal

Research baseline.

Additional context beyond Coordination Envelope:

- reference screenshot(s)
- short task statement

For `PAGE_BENCHMARK` the envelope itself may intentionally be reduced; record that as the experiment variable.

### C1 — Structured Figma

C0 + relevant exact-section structured Figma:

- design context
- metadata as needed
- visible components/variants
- variables/tokens visible in returned context
- layout/sizing
- exact available assets

Retrieval scope is guided by the Section Structure Profile.

### C2 — Explicit design/behavior context

C1 + relevant:

- responsive invariants
- states
- annotations/behavior notes
- known unknowns/UNDETERMINED limitations
- detailed component/variable evidence

Note: Shared Contract and Structure Profile are already in the Envelope; C2 means **deeper supporting evidence**, not a second copy of the contract.

### C3 — Codebase-aware

C2 + targeted codebase context:

- existing implementation examples
- relevant nearby components
- routing/state/data conventions
- style utilities
- design-system source code needed by this Section

`CODEBASE_FIRST` profile sections may retrieve this earlier/deeper than STRUCTURE_FIRST sections, while still recording the same tier semantics.

### C4 — Connected design system

C3 + actual connected mapping where available:

- Code Connect mappings
- source component implementation
- prop/variant mapping
- implementation examples supplied by the connection

Code Connect `NONE/UNDETERMINED` is not a blocker; do not fabricate C4 context.

---

## Translation-mode-aware retrieval

### STRUCTURE_FIRST

Prefer exact structured section context first; screenshots remain visual verification evidence.

### HYBRID

Retrieve trusted structured nodes plus visual/codebase evidence for untrusted or UNDETERMINED areas.

### VISUAL_FIRST

Avoid spending large context on low-value weak structure. Prioritize:

- screenshots
- exact dimensions/content/assets
- codebase semantics
- only useful Figma values/metadata

### CODEBASE_FIRST

Read pinned production components/tokens first, then retrieve enough Figma/screenshot evidence to configure them faithfully.

**Translation mode changes retrieval order, not reference authority.**

---

## Retrieval discipline

### Figma: broad → narrow

1. reference/root identity
2. sparse metadata
3. section discovery/profile
4. exact section node
5. only needed children/mappings/assets

Do not fetch one huge page context because the tool allows it.

### Repo: architecture → relevant files

1. styling/design-system map from Global Reconnaissance
2. resolved shared component/token paths
3. section-local target files
4. nearby implementation examples only when needed
5. applicable playbook/pattern entries only when target failure/scope matches

Do not let every section worker independently crawl the whole repository.

---

## Epistemic discipline

- `UNKNOWN` — insufficiently investigated; active worker should not receive it in required profile signals
- `NONE` — inspected and absent
- `UNDETERMINED` — inspected but current tool cannot establish it

UNDETERMINED should carry:

- evidence
- limitation
- conservative fallback
- future retest trigger

Never silently convert it to NONE.

---

## Context contamination

COMMON first-pass comparison must not leak:

- previous agent output
- previous repair diff
- human scoring comments
- another agent's same-reference failure analysis
- final repaired implementation

Use fresh context/clean baseline where possible.

Portable playbook knowledge is different from leaking the answer. However controlled experiments may intentionally exclude Candidate/Proven knowledge to measure a baseline. In that case:

- exclusion itselfをexperiment variableとして記録する
- production defaultと混同しない
- same-reference final repair diffやhuman answerをportable ruleとして偽装しない

OPTIMIZED run may use applicable agent-specific procedures but records them separately.

---

## Context manifest / Run Record

Record at least:

```yaml
coordination:
  shared_contract_path: "..."
  shared_contract_sha256: "..."
  section_manifest_path: "..."
  section_manifest_sha256: "..."
  figma_structure_profile_path: "..."
  figma_structure_profile_sha256: "..."
  foundation_commit: "..."

knowledge_context:
  mode: PRODUCTION_APPLICABLE
  selected_rules:
    - rule_id: CR-XXXX
      path: playbook/candidates/cr-xxxx.yaml
      sha: "..."
      evidence_maturity: E2
      recommendation: OPTIONAL
      selection_reason: "target failure and scope match"
  excluded_rules: []

context:
  tier: C2
  prompt_version: "..."
  prompt_hash: "..."
  figma_design_context: true
  figma_metadata: true
  figma_screenshots: true
  figma_components: true
  figma_variables: true
  code_connect: false
  files_read: []
  figma_nodes_inspected: []
```

After run, record whether selected knowledge was confirmed, contradicted, irrelevant under current conditions, or requires retest. Do not silently upgrade/demote rule maturity from one observation.

---

## Context efficiency

Possible diagnostic metrics:

- MCP calls
- nodes inspected
- screenshots fetched
- repo files read
- selected knowledge entries
- prompt/context bytes/tokens if observable
- turns before FIRST_PASS

同品質なら小さいcontextを優先する。

ただし**context削減のためにCoordination Envelopeを削らない。**

---

## Update-aware

Model/MCP capabilityが上がれば、最適なTier・translation mode・retrieval粒度は変わる。

- old context workaroundを永久rule化しない
- Structure Profileはtool snapshot/hash付きで保持
- Candidate/Proven ruleも`last_verified_at` / verified tooling / retest triggerを見る
- major update後はre-profile/re-run/retest可能
- contradicted evidenceは削除せずdemotion/retest evidenceとして残す

目的はcontextを最大化することではなく、**現在のtoolで、必要な証拠と適用可能な過去知識だけを使ってFirst-passとReworkを最適化すること**。