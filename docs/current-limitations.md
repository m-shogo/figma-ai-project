# Current Limitations / Deferred Decisions

この文書は「できないこと一覧」ではない。

**2026-08時点で、まだ実run evidenceが足りないため固定実装しない判断**を記録する。

Figma/MCP/model/codebase条件が変われば再評価する。

---

## 1. Figma Structure Profile is external to Section Manifest

Current:

```text
section-manifest.yaml
+
figma-structure-profile.yaml
→ production_execution_gate.py
```

Profile path/hashをSection Manifest本体へ常設していない。

### Why deferred

- profile schema/metricsはまだ成長段階
- Figma/MCP updateで取得可能signalが変わる
- section ownership/dependency manifestを頻繁なprofile schema変更で壊したくない
- Production Gateで両file SHA-256は取得できる

### Promotion trigger

3–5 real runsで:

- profileが毎run必須だった
- mode変更をlineage追跡する価値が高い
- Dashboardでprofile hash常設が有用

と確認できたら:

```yaml
structure_profile_path:
structure_profile_sha256:
```

をSection Manifest/Run Recordへ昇格候補。

---

## 2. Translation mode selector is advisory

`suggest_translation_mode.py`は:

- STRUCTURE_FIRST
- HYBRID
- VISUAL_FIRST
- CODEBASE_FIRST

を候補提示するだけ。

### Why not automatic

同じsignalでも:

- production design system成熟度
- current MCP visibility
- Figma update
- framework constraint

で最適modeが変わる可能性がある。

### Promotion trigger

実runで:

- advisory suggestion
- confirmed mode
- First-pass / Rework

を比較してselector精度を測る。

十分安定した部分だけautomationを強める。

---

## 3. Production Gate and detailed breakpoint viewport validation are separate layers

Current:

- Production Gate: structure + Shared Contract/foundation + base breakpoint semantics + discovery/dependency/isolation
- CI supplemental validator: each breakpoint ↔ validation viewport mapping

### Why acceptable now

Frozen contractはCIでも検証され、Production Gateだけが唯一のsource of validationではない。

### Future

実run orchestrationを1command/1Dashboard actionへ寄せる段階で、supplemental breakpoint validatorをProduction Gate内部へ統合する。

Gate数を増やし続けず、実際の運用摩擦を見て統合する。

---

## 4. Target implementation repo-specific breakpoint lint is not implemented

Shared Contractはbreakpoint source/valueを固定できるが、production repoの全CSS/TSをscanして:

```text
UNAPPROVED_BREAKPOINT
```

を検出するadapterはまだ無い。

### Why deferred

Target repo/style architecture未確定。

- CSS Modules
- Tailwind
- styled/typed styling
- PostCSS custom media
- JS breakpoint utilities

でscan方法が異なる。

### Build when

最初のtarget implementation repoが決まったら既存style architectureを調査して最小adapterを作る。

汎用linterを先に作って誤検知を増やさない。

---

## 5. Section discovery is AI/MCP-assisted, not fully deterministic

Current:

- semantic names
- hierarchy
- components
- Auto Layout boundaries
- screenshot/content identity

からsection候補を作りconfidence/evidenceを保存する。

LOWはREADY/RUNNING不可。

### Why not fully automatic

Editorial/creative designでは:

- continuous background
- intentional overlap
- visual grouping

がlayer treeだけでは判断できない場合がある。

### Future

Vision/MCP improvement後に:

- boundary prediction
- PC/SP pairing
- integration coupling inference

を再benchmarkする。

---

## 6. Parallel planner is conservative

Current plannerはdependency layerを安全側に分割する。

### Why

最大並列度より:

- reproducibility
- merge safety
- failure attribution
- integration consistency

を優先。

### Future trigger

実runでserial/parallel timingとIntegration Taxが取れたらdynamic schedulerを検討する。

---

## 7. Whole-page implementation is not current production default

Section-firstをcurrent defaultにしているが永久禁止ではない。

### Retest trigger

- major Figma MCP large-frame improvement
- model context/vision improvement
- structured context compression improvement
- repeated field evidence that whole-page one-shot reaches comparable rework/fidelity

PAGE_BENCHMARKで再試験する。

---

## 8. Image-only workflow is a research lane

Current best production pathはstructured Figma contextがある場合それを使う。

しかし将来:

```text
image
→ section/layout/component inference
→ native code/editable Figma
→ render/diff
→ repair
```

が十分高精度になる可能性がある。

一度の低品質runで永久却下しない。

Issue #3 / `docs/image-only-research-track.md`で追跡。

---

## 9. Dashboard is not built yet

Machine-readable foundationはかなり揃っている。

- Reference
- Structure Profile
- Shared Contract
- Section Manifest
- Run Record
- planner waves
- readiness/next actions
- failures/scores

### Why not build yet

UIを先に作ると、実際に必要な操作/比較が分からないままdashboard architectureを固定してしまう。

### Build gate

3–5 real runsで繰り返すmanual painを確認してから。

---

# Principle

`DEFERRED`は`FORBIDDEN`ではない。

各項目は:

- current reason
- missing evidence
- promotion/retest trigger

を持つ。

新しいFigma/AI/tool capabilityが来たら、この文書は古い制約を残す理由ではなく**再試験queue**として使う。
