# Portability — 他案件へ持ち出す方法

このrepoの最終成果は特定画面の完成コードではなく、**次案件で最初から精度を上げる再利用可能なinstruction / procedure package**。

重要なのは、汎用ruleと案件固有contractを混ぜないこと。

---

## Five layers

### Layer 1 — Universal reproduction core

案件/agentに依存しない。

例:

- external referenceをfreezeする
- tooling update preflight
- global reconnaissance before implementation
- shared foundation before parallel sections
- section-scoped Inspect → Implement → Verify → Repair
- first-pass preservation
- exact viewport verification
- failure class/root cause単位のrepair
- clean replay
- one failure/successを永久rule化しない

置き場所:

- `AGENTS.md`
- `docs/`
- `playbook/proven/`

### Layer 2 — Agent adapter

Codex / Claude Code / Cursor固有。

例:

- instruction file配置
- MCP config/use pattern
- client固有skill
- tool orchestration

案件固有design ruleは入れない。

### Layer 3 — Framework / implementation adapter

React / Next / Vue / native app / design system等。

例:

- CSS Modules/Tailwind等の既存architectureへの接続
- token source discovery
- component directory discovery
- screenshot runner
- test commands
- breakpoint lint adapter

複数案件で再利用できる証拠があるものだけ共通化する。

### Layer 4 — Organization / Design-System adapter

会社やdesign systemで共有される可能性がある。

例:

- company breakpoint source
- shared design-system package
- Code Connect mapping conventions
- typography/token naming conventions
- accessibility/coding standards

同じ会社/プロダクト群では再利用できても、全案件共通とは限らない。

Scopeを`ORG_SPECIFIC`等として明示してもよい。

### Layer 5 — Project Reference / Contract package

案件固有。

- Figma URL/node
- exact PC/SP frames
- assets/states
- Reference Manifest
- Shared Contract
- Section Manifest
- foundation commit
- actual breakpoint values/source
- project component names/paths
- target route

**原則として別案件へそのままコピーしない。**

Shared Contractの「形式」はportableだが、その中身はproject-specific。

---

## Portable bundle goal

将来的に別repoへ導入する理想形:

```text
<target-repo>/
  AGENTS.md
  .ai-figma/
    templates/
      reference.yaml
      shared-contract.yaml
      section-manifest.yaml
      run.yaml
    prompts/
      coordinator/
      section/
      integration/
    adapters/
      <framework-or-agent-specific>
```

新案件ではtemplateを**空の状態から、その案件のFigma/codebase/company rulesで埋める**。

過去案件のcolors/breakpoints/node IDsをコピーしない。

---

## What may be exported

### Proven procedure

例:

- metadata → section node → child detailのprogressive disclosure
- shared foundation freeze → section parallel
- contract hash/foundation lineage check

複数reference/案件で効果確認されたらportable candidate。

### Generic validators

例:

- manifest schema validation
- parallel allowed-path overlap check
- dependency-cycle check
- stale contract hash check

project path/valueを引数/manifestから読む形ならportable性が高い。

### Adapter patterns

例:

- CSS Modules project adapter
- Tailwind existing-project adapter
- Next.js screenshot adapter

実案件で再現してから昇格する。

---

## What not to export as universal truth

- 1回しか成功していないprompt hack
- 特定画面のmagic number
- actual breakpoint値
- project-specific Shared Contractの中身
- specific section names/node IDs
- company-only ruleをuniversal扱いしたもの
- 特定modelの一時的癖
- old Figma workaroundをcurrent確認なしで固定したもの
- historical failure logs全部

これらはresearch repoへ残す。

---

## Export gate

他案件へ持ち出すrule/procedureは:

- evidence maturityが明示
- clean replay済み
- scope labelあり
- known limitsあり
- current toolingで再確認済み
- project-specific valuesと分離済み

を満たす。

Candidateを実験目的で持ち出すのは可。ただし`Candidate`であることを明記する。

---

## Import into a new project

新案件ではまず:

1. current tooling preflight
2. target codebase/style architecture確認
3. company/designer breakpoint確認
4. Figma reference freeze
5. fresh Shared Contract作成
6. fresh Section Manifest作成
7. foundation verify
8. section run開始

を行う。

過去案件のShared Contractをrenameして使い回さない。

---

## Success metric

Portability成功は「ファイルをコピーできた」ではなく:

- 新案件のFirst-passが以前より高い
- 同じfailureが減る
- Shared Contract準備が速くなる
- initial human explanation量が減る
- integration reworkが減る
- project-specific instructionが少なく済む
- old project valuesのcontaminationがない

で判断する。

最終的には、**案件固有情報を入れ替えるだけで、同じ高品質な再現工程を起動できる**状態を目指す。
