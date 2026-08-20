# Frontend Font Loading / Metrics Policy

Status: ACTIVE production policy

Figma fidelityではfont family名だけでなく、**font file availability・weight・fallback metrics・loading timingがlayout geometryへ影響する**。

AuthorityはCompany / Existing / explicit Project contractを優先する。

---

## 1. Font is a layout dependency

Font mismatchは:

- line wrap
- heading width
- card height
- section height
- CTA alignment
- breakpoint behavior
- CLS

へ連鎖する。

したがってfont setupをsection visual tuningの最後へ回さない。

Shared foundation/foundation commitで可能な限り先に固定する。

---

## 2. Record the actual font contract

Relevant fontごとに必要に応じて:

- family
- source: local / self-hosted / external service / system
- available weights/styles
- variable font axes
- unicode coverage
- CJK coverage
- fallback stack
- `font-display`
- preload policy
- license/use restriction
- Figma font availability vs production availability

を記録する。

Figmaで利用できる有償fontをproductionで使えない場合、勝手に同名fontとして扱わない。

---

## 3. Fallback behavior is part of fidelity

Primary font download前にもページはrenderされ得る。

確認対象:

```text
fallback render
→ font load/swap
→ final render
```

Relevant pageで:

- overflowしない
- contentが消えない
- severe layout jumpを起こさない
- final font適用後にcanonical fidelityへ戻る

ことを見る。

Fallback fontがfinal fontと大きくmetric差を持つ場合、browser supportとProject needに応じてmetric harmonizationを検討できる。

---

## 4. `@font-face` metric tools

Current CSSには候補として:

- `size-adjust`
- `ascent-override`
- `descent-override`
- `line-gap-override`
- `font-display`
- `unicode-range`

がある。

これらを「modernだから全部使う」ことはしない。

### `size-adjust`

Fallback/alternate faceのglyph outlineとmetricsをprimaryへ近づける候補。

Use when:

- measured metric mismatchがmaterial
- browser matrixで許容
- fallback visualの改善が確認できる

Do not:

- 数値を目測だけで決める
- final font自体をFigmaへ無理にscaleする

### ascent/descent/line-gap overrides

Line box metricを調整できるが、browser supportをRequired Environment Matrixで確認する。

利用できないbrowserがある前提でfallback behaviorを設計する。

---

## 5. `font-display`

一律値をglobal ruleにしない。

候補はfont role / performance / acceptable fallbackに応じて選ぶ。

Review:

- render blocking許容度
- FOIT/FOUT impact
- brand-critical typography
- LCP text
- final layout shift
- repeated route/page usage

`swap`を思考停止defaultにしないし、`block`をFigma fidelityのために機械採用しない。

---

## 6. Preload

Font preloadはcritical resourceだけ。

Do not preload:

- 全weight
- 全language subset
- below-foldでしか使わないface
- routeによって不要なfont

Preload数の多さをqualityにしない。

Check actual request/waterfall when performance is material.

---

## 7. CJK / Japanese typography

日本語案件ではLatin-only benchmarkだけでfont contractを評価しない。

Relevant points:

- full-width punctuation
- Japanese line breaking
- weight availability
- fallback glyph source
- mixed Latin/Japanese baseline
- punctuation spacing
- vertical metrics
- variable font behavior

Figmaとbrowserで同じfamily名でもfont versionやplatform fallbackが違う可能性を残す。

---

## 8. Localization / missing glyphs

Localized contentではglyph coverageを確認する。

Missing glyph/fallbackが一部文字だけ別fontになる場合、line metricsやvisual rhythmが変わり得る。

`unicode-range` / language subsetはperformance candidateだが、管理complexityとcache behaviorを含めて判断する。

---

## 9. Font mutation QA

Font-sensitive sectionでは必要に応じて:

- webfont disabled / delayed
- fallback only
- final font loaded
- long Japanese copy
- mixed Latin/CJK
- localized script
- required weights missing simulation

をTARGETED/DEEP QAへ選べる。

全PRでfont failure simulationを強制しない。

---

## 10. Change impact

Fontはshared dependency。

Font file / declaration / metrics / fallback stack変更時は:

```text
font change
→ known typography-sensitive dependents
→ representative headings/body/buttons/forms
→ representative full-page layout
```

へregression scopeを広げる。

Section local line-height修正と同じblast radiusではない。

---

## 11. Third-party font service

External font serviceはThird-party Boundaryでもある。

確認:

- privacy/company policy
- CSP
- outage/failure fallback
- cache behavior
- preload/preconnect policy
- self-hosting requirement

Company/Existingでself-hostingが決まっているならexternal serviceへ変更しない。

---

## 12. Learning

Font issueも条件付きevidenceとして保存する。

Record:

- font/version/source
- OS/browser
- fallback stack
- viewport
- language/script
- before/after wrap/CLS
- mitigation
- browser support limit

一度のplatform mismatchを永久ruleへ昇格させない。

---

## 13. Final rule

目標は「Figmaと同じfont-family文字列」ではない。

**productionで利用可能なfont contractを正しく固定し、loading中も壊れず、final renderでFigmaのtypography/geometryへ高く一致すること。**
