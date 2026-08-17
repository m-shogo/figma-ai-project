# Fast Loop — Next Capabilities

These capabilities extend the merged Fast Loop / Visual Cause Engine. They are **not** a second framework and they are not all-on-by-default.

The rule remains:

> observe risk/evidence → activate only checks that can prevent likely rework.

## One planner

`fast_loop_next.py plan` converts project evidence into an activation plan and an `advancedCapture` contract. It keeps optional capabilities off unless risk, interaction, company policy, or explicit project evidence activates them.

## 1. Asset Materializer

Short-lived Figma MCP asset URLs are input-only secrets.

```text
Figma download_assets
→ URL passed only by environment variable
→ bytes downloaded
→ SHA-256 content address
→ materialized file
→ optional chatgpt-git-bridge v1 manifest
```

The manifest follows `m-shogo/chatgpt-git-bridge/schema/manifest.schema.json`. No concrete ephemeral URL is written into output records.

## 2. Trace-on-failure

`advanced_capture.mjs` starts Playwright tracing when requested. Successful runs discard the trace; failed runs retain `<browser>-trace.zip` plus a failure screenshot. Normal FAST runs therefore stay light.

## 3. Interaction State Matrix

Project-owned states may describe default, hover, focus, open, selected, error, disabled, etc. Supported actions include click, hover, focus, fill, press, check/uncheck, and bounded wait. State QA activates only when interaction evidence exists.

## 4. Human Repair Learning

`fast_loop_next.py human-learning` turns final human CSS edits into scoped learning evidence. A single human edit is E1 project evidence, not a global rule.

```text
Figma → AI first pass → AI repair → human final adjustment → Git diff → learning
```

## 5. Risk-gated cross-browser QA

Chromium remains the normal Fast Loop browser. WebKit/Firefox are added only when Company Policy or concrete risk signals justify them. The advanced runner supports Chromium, WebKit, and Firefox.

## 6. ARIA / Semantic QA

When supported by the installed Playwright version, the runner records `locator.ariaSnapshot()`. Visual fidelity and semantic fidelity remain separate evidence dimensions.

## 7. Container-aware responsive QA

Declared components record query-container ancestors (`container-type`, `container-name`, width, height). The analyzer distinguishes viewport-driven, container-driven, and mixed transitions.

## 8. Figma annotations / Dev Resources / Code Connect

Observed Figma instruction evidence is preserved explicitly. Missing evidence remains `UNKNOWN`; inaccessible capability such as a seat/plan limitation is `UNDETERMINED`, never `NONE`.

A real Code Connect mapping becomes `existing-code-component` authority ahead of name-only reuse guesses.

## 9. Layout Shift Cause Recorder

The browser runner registers a buffered `layout-shift` PerformanceObserver before page code executes and records shift score/time, input state, affected node identity, and previous/current rectangles when the engine exposes them.

## 10. Font Provenance

The runner records computed font family, FontFaceSet families/status, readable `@font-face` sources, and stylesheet accessibility. The analyzer can flag likely fallback/loading/license-provenance problems before layout nudging.

## 11. Bounded Repair Optimizer

Counterfactual candidates are bounded (default max five), must come from cause diagnosis, must improve measured visual score by the configured gain, and are disqualified by runtime regression. No accepted candidate means re-diagnose, not broaden search indefinitely.

## 12. Responsive Continuum

The planner probes between authored endpoints and always preserves `breakpoint-1 / breakpoint / breakpoint+1` around observed project breakpoints. It does not invent conventional breakpoints.

## 13. Typed CSS Evidence

CSS values are classified as lengths, unitless numbers, colors, or tokens. `1rem` and `16px` are not treated as a fake raw numeric delta without runtime conversion context.

## 14. Evidence maturity

Learning promotion follows E0–E5. One success or failure never creates a portable rule. Portable promotion requires repeated cross-reference evidence and more than one evidence domain.

## 15. Activation policy

```text
normal FAST              → Chromium + existing section evidence
interaction evidence     → State Matrix + semantic QA
browser-specific risk    → WebKit/Firefox only as needed
failure                  → trace retained
container behavior       → container evidence + continuum
human final adjustment   → human repair learning
asset bytes needed       → Asset Materializer
```

The system should become **smarter and smaller with evidence**, not accumulate a mandatory checklist forever.
