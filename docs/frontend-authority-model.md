# Frontend Authority Model

Status: CORE / canonical authority interpretation

Frontend implementationで「Company Policy / Existing Codebase / Project decision / Figma / Frontend Standardのどれをどう扱うか」を、1本の単純な順位表へ押し込まないための共通モデル。

この文書はFrontend scopeのauthority解釈を正本化する。別文書の短いprecedence表が曖昧な場合は、このモデルで解釈する。

## 1. Authority roles

### A. Company hard constraints

最上位technical hard constraint。

例:

- security/privacy requirement
- protected scope
- browser/device support
- accessibility hard target
- approved/prohibited libraries
- required CMS/runtime constraints

Project/Agent判断だけで無断overrideしない。

### B. Existing baseline + explicit project/owner decision

Existing Codebase / Design Systemは**実装baseline**。

```text
Existing architecture / design system / conventions
```

を先に読み、互換性と変更コストを理解する。

ただしExistingは永久不変のhard ruleではない。

Owner/User/Projectが明示的に:

- 旧実装を廃止する
- 新しいarchitectureへmigrationする
- stale validator/testを置き換える
- project-local exceptionを採用する

と決定し、そのdecisionがCompany hard constraint / security / protected scopeに反しない場合、**明示Current Authorityは対象scopeのstale Existing baselineを上書きできる**。

```text
Company hard constraints
↓
Existing baseline
↔ Explicit authorized Project/Owner override or exception
↓
Effective Project Contract
```

つまり:

- Existingを無視してgeneric best practiceへ飛ばない
- Existingだからという理由だけでHuman-approved migrationを拒否しない

の両方を守る。

### C. Visual authority

```text
FIGMA REFERENCE
```

Visual/design truthはFigma reference。

Company technical constraintとFigma visual/behaviorが両立できない場合、Frontend Standardを使って勝手にredesignせず `CONFLICT` として扱う。

### D. Implementation evidence

Figmaには「見た目」と「Web mechanismを考えるためのevidence」がある。

Evidence strengthは同じではない。

強い例:

- owner/designer explicit requirement
- Dev Mode annotation
- explicit prototype interaction
- component/property/variant semantics
- verified responsive relationship

弱い/解釈が必要な例:

- nodeがabsolute
- fixed frame size
- Auto Layoutが無い
- current screenshotで1行
- current item countが3

弱いstructure evidenceを、そのままWeb mechanismへ1対1変換しない。

```text
Figma node absolute
!= Web must use position:absolute

Figma section height 559
!= Web must use height:559px
```

ただしWebでもabsolute/fixed sizeが最も自然なintentなら普通に使う。

### E. Frontend Standard

`docs/frontend-quick-contract.md` と `docs/frontend-implementation-standard.md` はauthorityを上書きする規約ではなく、**Effective Project Contract + Figma evidenceからWeb mechanismを選ぶdecision framework**。

```text
Effective Project Contract
+ actual Figma visual/evidence
→ interpret intent / ownership / content risk / repeatability
→ choose maintainable Web mechanism
```

Evidenceだけではmechanismが一意に決まらない時にFrontend Standard defaultを使う。

### F. Agent inference

最後。

Company/Existing/explicit project decision/Figma/Standardから決まらない部分だけAgentが推論する。

推論をFigma fact、Company rule、Human decisionとして記録しない。

## 2. Practical decision flow

```text
1. Company hard constraintsを読む
2. Existing architecture/design systemを読む
3. Explicit project/owner Current Authorityを読む
4. Existing baselineに対するauthorized override/exceptionを解決する
5. Effective Project Contractを確定する
6. Actual Figma visual + implementation evidenceを取る
7. Conflictの有無を確認する
8. Frontend StandardでWeb mechanismを選ぶ
9. Agent inferenceで未確定部分だけ補う
10. Visual + relevant resilience/regression QAで検証する
```

## 3. Explicit decisionの扱い

Explicit decisionがExisting baselineを上書きできるのは、**そのscopeと意図が明確な場合**。

良い例:

```text
「このLPでは旧absolute中心実装を廃止して、保守可能な構造へ作り直す」
「このprojectでは既存SCSSではなく既に導入済みCSS Modulesへ統一する」
「このstale fixtureは正本ではないので置換してよい」
```

曖昧な会話やAgent推測を「explicit override」として昇格させない。

Company Policy hard constraint、security、protected branch/scope等へ反するoverrideは採用しない。

## 4. Project-local exceptions

案件固有の明示decisionは `PROJECT_ONLY` として残せる。

例:

- このLPはbreakpoint 768pxのみ
- このHero人物はabsolute art direction
- この短いlabelはsingle-line contract
- このcollectionは常に3件固定

Project-only ruleをcommon COREへ自動昇格しない。

## 5. Figma explicit instruction vs inferred structure

同じFigma由来でも分ける。

```text
Explicit annotation / prototype / owner instruction
→ strong implementation evidence

Auto Layoutなし / absolute node / current frame size
→ structure evidence requiring interpretation
```

Figma structureを無視しないが、そのmechanismをWebへコピーすることを目的にしない。

## 6. External best practice

W3C/MDN/WordPress/web.dev/industry guidanceは判断evidenceとして使う。

ただし:

```text
External best practice
!= Company Policy
!= authorized Project decision
!= Existing baseline
!= Figma visual truth
```

外部知見は、未確定なimplementation choiceを改善するために使う。

## 7. Conflict handling

次が同時に成立しない場合:

```text
Company hard constraint
Existing/effective project contract
Figma visual/behavior
```

Agentが勝手にどれかを捨てない。

`CONFLICT`としてscope・原因・選択肢を明示し、必要なauthorityへ戻す。

## 8. Definition

Frontend authorityが正しく解決されている状態:

- Company hard constraintを守る
- Existing baselineを最初に理解する
- authorized Human/Project decisionがstale Existingを更新できる
- Figma visual truthを守る
- Explicit instructionとinferred structureとAgent inferenceを区別する
- Figma structureをWeb mechanismへ直写ししない
- Frontend Standardをproperty-ban engineにしない
- conflictを隠さない
- project-only ruleをglobal ruleへ誤昇格しない
