# Visual Verification Protocol

目的: 「見た感じ近い」を、run間で比較可能な証拠へ変える。

## Principle

Screenshot comparison は重要だが、**撮影条件が違えばdiff自体がノイズになる**。

Reference/implementationのcapture条件を固定する。

## Capture contract

各captureで記録する。

- frame/reference id
- viewport width/height
- browser + version if known
- device pixel ratio
- page zoom = 100%
- locale
- timezone when content depends on time
- theme/color mode
- fixture/data state
- auth state if relevant
- scroll position
- reduced motion / animation policy
- capture timestamp
- implementation commit

## Before capture

### Stable content

- random値を固定
- current time依存表示を固定または記録
- network responseをfixture化できる場合は固定
- carousel/auto-rotationを停止または既知stateへ
- loading終了を待つ
- webfontロード完了を待つ

### Stable motion

comparison screenshotでは原則animation/transitionsを停止する。

ただしmotion自体がreference requirementなら、静止画比較とは別のbehavior evidenceとして扱う。

### Stable viewport

Reference manifestのexact viewportを使用する。

「だいたいPC」「iPhoneっぽい幅」では比較しない。

## Capture sets

### Required

Reference manifestでacceptance対象になっている各frame/state。

### Intermediate

Responsive verificationに必要な場合、**Implement前に幅を固定してrun recordへ記録**する。

選び方:

1. known breakpointの直前/直後
2. PC/SPの間でlayout transitionが起きる領域
3. long textなどでwrapが起きる幅
4. reference情報がない場合は探索幅として明示し、acceptance referenceと混同しない

実装結果を見てから都合の良い幅だけ選ばない。

## Comparison layers

### Layer A — side by side

人間/agentがreferenceとimplementationを並べる。

見るもの:

- hierarchy
- section proportion
- typography
- spacing rhythm
- asset/crop

### Layer B — overlay / pixel diff

可能な環境では同寸法へ揃えoverlay/diffを作る。

用途:

- offset
- width/height drift
- line wrap drift
- repeated spacing mismatch

注意:

font anti-aliasing、OS/browser rendering、sub-pixel差でnoiseが出るため、pixel diff単独を合否判定にしない。

### Layer C — structural evidence

Visualが一致しても以下を別確認する。

- reused component
- tokens
- responsive structure
- semantic HTML
- accessibility
- state logic

## Evidence naming

推奨:

```text
artifacts/
  EXP-0001/
    RUN-CODEX-C2-001/
      first-pass/
        pc-main.png
        sp-main.png
      verify/
        pc-main-diff.png
        sp-main-diff.png
      final/
        pc-main.png
        sp-main.png
```

## First-pass rule

Repair前のcaptureを上書きしない。

`first-pass/` と `final/` は必ず分離する。

## Diagnostic ordering

大きいdifferenceから直す。

1. wrong structure/layout model
2. container geometry
3. typography/wrapping
4. repeated spacing/token errors
5. assets/crop
6. local decoration

親layoutが間違っている状態で1px単位の装飾修正を始めない。

## Verification output

Verify phaseは最低限以下を返す。

- capture inventory
- first-pass score
- ordered failure records
- highest-impact root cause
- areas already matching and protected from repair
- reference ambiguity if any

## Current tooling direction

Browser-based projectsでは、Playwright等のreal-browser captureを第一候補にする。

特定toolを永久固定はしない。重要なのは:

- exact viewport
- deterministic state
- evidence preservation
- reference comparison

の4条件。
