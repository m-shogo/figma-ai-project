# Portable Playbook

ここは実験ログ置き場ではなく、**次案件へ持っていく価値があるruleだけを置く場所**。

## Directories

- `candidates/` — clean replayまで進み、追加検証中
- `proven/` — 別reference/contextでも再現した持ち出し候補

## Rule format

各ruleは最低限:

- statement
- target failure
- evidence runs
- scope
- metric effect
- known limits
- last verified date/tooling

を持つ。

## Important

このディレクトリへ「良さそうなprompt」を直接追加しない。

Observation → Candidate → Proven のpromotion ruleを通す。

現在はfoundation phaseのため、**proven ruleはまだ0件**。これは正常。
