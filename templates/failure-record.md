# F-XXX — <short mismatch>

## Classification

- Severity: S0 / S1 / S2 / S3 / S4
- Primary category:
- Secondary categories:
- Root-cause confidence: HIGH / MEDIUM / LOW
- Surface: PC / SP / intermediate / state / structural

## Observation

Reference と implementation の差を、評価語ではなく観測可能な形で書く。

悪い例:

> なんか余白が変。

良い例:

> PC referenceではcard間gapが24相当だがfirst-passは32。3 cardすべてで同じ差がある。

## Evidence

### Reference

- Figma node:
- Screenshot/crop:
- Structured context/token evidence:

### Implementation

- Commit:
- Screenshot/crop:
- File/line/component:

## Suspected root cause

何が原因だったか。

- missing context
- ignored context
- wrong token/component selection
- responsive assumption
- prompt ambiguity
- agent behavior
- environment
- other

説明:

## Smallest repair

このfailureだけを直す最小変更。

## Repair result

- Repair round:
- Files changed:
- Before score/evidence:
- After score/evidence:
- Regression detected: yes / no

## Prevention hypothesis

次回first-passで防ぐなら何を変えるか。

- prompt
- context package
- reference contract
- Code Connect
- agent adapter
- verification
- codebase/design system

## Replay

- Clean replay required: yes / no
- Replay run:
- Reproduced: yes / no / not-run

## Promotion status

- Observation
- Candidate Rule
- Proven Playbook
- Project-only
