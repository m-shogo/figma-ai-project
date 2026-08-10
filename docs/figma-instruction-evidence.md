# Figma Instruction / Interaction Evidence

## Goal

Figmaの見た目だけでなく、designerが残した**実装意図・interaction・comment**をSection実装へ失わず渡す。

Evidenceは同じ強さでは扱わない。

Current priority candidate:

```text
Owner/company explicit requirement
→ Figma Dev Mode annotation / explicit prototype interaction
→ Figma component/property/variant semantics
→ node-attached Dev Resource
→ Figma comment
→ agent inference
```

Commentは重要だが、discussion/古い指摘/解決済みfeedbackの可能性があるため、自動的に最上位仕様へしない。

---

## Annotations

Dev Mode annotationsはimplementation contextとして強いevidence。

Section inspectionでは対象nodeと子nodeのannotationを収集する。

Examples:

- implementation note
- spacing behavior
- accessibility intent
- responsive note
- property pin

Section Profile / Inspect Briefへ引用ではなく要約・source ID付きで残す。

---

## Prototype interactions

Figma nodeのprototype interaction/reactionから:

- trigger
  - click
  - hover
  - key/gamepad/etc when represented
- action
- destination/state
- transition
- duration/easing
- variable/state change

をimplementation evidenceとして読む。

Hover、menu open、slider transition等がprototypeに存在するなら、見た目から推測するより優先する。

---

## Comments

Figma REST comments endpointが利用可能ならfile commentsをcaptureする。

Comment record candidate:

```yaml
- comment_id: ""
  parent_id: ""
  created_at: ""
  resolved: false
  author: ""
  message_summary: ""
  client_meta: {}
  mapped_scope: SECTION # GLOBAL | SECTION | BOUNDARY | UNKNOWN
  mapped_section_ids: []
  confidence: MEDIUM
  implementation_relevance: UNKNOWN # YES | NO | UNKNOWN
```

Raw comment text/author dataの保存は案件のprivacy/data policyに従う。

---

## How comments map to sections

Section-firstでもcommentsを捨てない。

Mapping order:

1. comment pin/frame metadataがSection node/descendantを直接指す
2. client_metaのframe/relative positionでSection boundsへmapping
3. comment textのnamed layer/section reference
4. multi-section boundaryにかかる場合`BOUNDARY`
5. page-level ruleなら`GLOBAL`
6.確定できなければ`UNKNOWN`

Low-confidence mappingを1Sectionへ無理に押し込まない。

---

## Boundary comments

Examples:

- 「Heroとの間をもう少し空ける」
- 「次Sectionの背景とつなげる」
- 「このdecorative imageを次Sectionまでまたがせる」

これらはSection local commentではなく**Boundary evidence**。

`B02 = S02↔S03`等のIntegration Ladderへ紐付ける。

---

## Global comments

Examples:

- 「全ページ同じhover」
- 「SPではmenuをdrawer化」
- 「Safariでblurを使わない」

Company Policy/Shared Contract候補としてcoordinatorへ上げる。

Section workerがlocal ruleとしてコピーしない。

---

## Resolved / stale comments

Resolved commentや古いcommentを自動で仕様化しない。

Possible states:

```text
ACTIVE_INSTRUCTION
RESOLVED_HISTORY
STALE_UNVERIFIED
DISCUSSION_ONLY
CONFLICT
```

Reference revision/dateと照合する。

---

## Missing comments access

Current tool/clientでcommentsを取得できない場合:

```text
UNDETERMINED / ACCESS_UNAVAILABLE
```

として記録する。

「コメントが無い」とは扱わない。

Annotations/prototype/structured design contextで進め、comments accessが将来可能になった時にretestする。

---

## Section worker input

Section workerへ渡すのはfile comments全件ではなく:

- Section-mapped active instructions
- Boundary instructions involving this Section
- relevant GLOBAL instructions
- unresolved conflict summaries

だけ。

Progressive disclosureを保つ。

---

## Verification

Verify phaseではinteraction instructionも確認する。

Examples:

- hover state exists
- focus equivalent exists
- menu opens/closes as specified
- animation timing/state roughly matches evidence
- reduced motion/company accessibility rule is respected
- comment/annotation instruction was not silently ignored

Visual screenshotだけでinteraction PASSにしない。
