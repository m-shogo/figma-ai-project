# Agent Execution / Ownership / Escalation Policy

この文書は、このrepositoryを扱う複数AI agentの**実行速度・作業所有権・重複防止・Human escalation**のcanonical policyである。

目的は「確認を最も多く行うこと」ではなく、**正しい現行Authorityを最短経路で完成させ、再現可能なQAを通し、Gitを綺麗な状態へ戻すこと**。

安全・security・secrets・Company Policyのhard constraint・明示的なprotected scopeを弱めるためのpolicyではない。

## 1. Current Authority first

作業開始時は、古いfixture・古いtest・古いCI契約を先に守ろうとせず、まず今回のCurrent Authorityを確定する。

優先して確認するもの:

- ユーザーが現在の会話で明示した決定
- active Company Policy / project contract
- latest base branch
- current production/runtime implementation
- current Figma/reference authority
- active PR / branch / worktree ownership

ユーザーが明示的に

- 「これが正本」
- 「これは消していい」
- 「これで完成」
- 「それ以外は修正しない」
- 「古い仕様はいらない」
- 「マスター権限で廃止してよい」

と決定したproject-local contractは、**staleなactive test / validator / CI / fixture / legacy implementationより上位のCurrent Authority**として扱う。

ただし、これはsecurity、secrets、法令、Company Policyのhard constraint、protected scopeを無視する権限ではない。そこに衝突がある場合は勝手に突破せずHumanへ短くescalateする。

Human-approved な portable contract は **この Git repository が standing memory** である。`.cursor/rules` / Claude 専用追記 / Copilot copies / chat memory だけへ保存しない。置き場所は `AGENTS.md` / canonical docs / `experiments/<case>/` / machine-readable config。client adapter は読み方の差だけ。詳細は `docs/agent-adapters.md`。

## 2. Retire stale contracts instead of preserving them

Current Authorityと旧仕様が矛盾する場合、旧仕様を維持するためにproduction codeを複雑化しない。

必要なら以下を現行仕様へ更新またはactive pathから削除してよい。

- stale test
- legacy validator rule
- old breakpoint contract
- obsolete fixture
- deprecated CSS/JS layer
- old CI expectation
- superseded implementation path

History / research evidence / frozen benchmarkは証拠として価値があるため、active runtimeと区別する。証拠まで機械的に削除しない。

## 3. Agent ownership — one implementation owner per write scope

複数Agentが同じ作業を二重実装しない。

開始時に最低限:

- latest base
- current branch
- open PR
- recent commits
- active worktree / uncommitted workを確認できる環境ならその状態
- 同じscopeを示す他Agent branch / PR

を確認する。

明確なcurrent ownerがいる場合、別Agentは同じscopeを最初から実装し直さない。

### Default lane split

**Local implementation lane — Claude Code / Codex / Code系Agent**

優先担当:

- repository file editing
- refactor / implementation
- git / branch / commit
- `gh`
- lint / test / build
- Playwright
- PHP / JS / CSS
- WordPress runtime
- CI fix
- PR preparation
- merge前Git cleanup

**Design / authority / review lane — ChatGPT / Claude等のorchestrator**

優先担当:

- Figma/reference確認
- Visual direction
- Human feedbackのAuthority化
- architecture / scope判断
- root-cause整理
- implementation brief
- review / QA観点
- research
- handoff

このlane splitは絶対固定ではない。Agentに実行能力がありcurrent ownerが不在なら安全に進めてよい。

ただし**同じfiles / same implementation scopeを2つのAgentが並行writeすることは禁止**する。

### Existing owner wins

Claude Code / Codex / 他Agentが既にbranch・commit・PRで作業を進めている場合、後から来たAgentは:

1. current成果を読む
2. latestとの差分だけ確認する
3. 必要ならreview / root-cause / handoffを返す
4. 同じ実装を別branchで作り直さない

をdefaultとする。

## 4. No duplicate investigation

既に十分な証拠付きで完了している以下の調査を、Agentが変わっただけで繰り返さない。

- Figma comparison
- root cause
- CI failure attribution
- Visual QA
- architecture decision
- existing codebase reconnaissance
- approved Human feedback

再確認は**latest stateとの差分がmaterialに変わった場合のみ**行う。

「念のため」で同じfactを複数回取得しない。

## 5. Scope-out failures are not blockers

今回の変更と無関係なCI / fixture / branch / experimentのfailureは、今回の変更が原因でないことを1回確認したら`OUT_OF_SCOPE`として扱う。

例:

- REF-001変更中のREF-002 failure
- protected V3 fixtureのfailure
- 別案件のWordPress fixture
- unrelated scheduled infrastructure failure

`OUT_OF_SCOPE`をgreenにするために別scopeへ侵入したり、validationを弱めたりしない。

ただし今回の変更がfailureを誘発している可能性がある場合はscope-outしてはいけない。

## 6. Human-approved Visual Freeze

ユーザーが「これで完成」「それ以外修正なし」等を明示した時点で、そのscopeは`VISUAL_FROZEN`として扱う。

以降許可されるのは原則:

- integration
- CMS / ACF
- runtime
- accessibility requirement
- build
- asset path
- interaction bug
- CI

のための**非redesign修正**。

勝手なpolish、CSS再設計、別versionへの寄せ直し、Figmaの再解釈を行わない。

Visual変更が本当に必要ならHumanへescalateする。

## 7. QA economy

既存QAで十分に証明できる場合、新しいvalidator / workflow / evidence systemを追加しない。

禁止:

- QAを通すためだけのQA基盤作成
- one-off failureのための恒久workflow追加
- 同じruntime factを複数の似たtestで再証明
- obsolete contractを守るためのproduction workaround

新しい恒久QAを追加するのは、少なくとも以下のどれかを満たす場合:

- 再発可能性が高い
- 現行QAに明確なblind spotがある
- 複数案件で再利用できる
- Humanが恒久gateを要求した

### Mobile-first execution invariant

Frontend実装でEffective Project Contractが別順序を明示しない限り、`Mobile First`はCSS authoringだけでなく**実装・stabilization・FINAL acceptanceの実行順**として扱う。

```text
Section:
SP → PC

Boundary / Cluster:
SP → PC

Final full-page / relevant interaction:
SP → PC
```

PC側のrepairがshared CSS、shared component、DOM、JS、asset、token、container等のSPにも影響し得るownerを変更した場合、そのscopeの既存PASSを保持したまま完了してはいけない。影響scopeのacceptance sequenceを無効化し、**SPから再確認してからPC**を再確認する。

PC/SP evidenceを並行取得すること自体は許可するが、並行captureを理由にacceptance順序を曖昧にしない。

このruleのためだけに新しいvisual engineやworkflowを作らない。既存のFigma evidence、Playwright、Section / Boundary / Page captureを再利用する。

## 8. Fast re-check rule

同じ状態を何度もpollしない。

原則の確認点:

### Start

- latest base
- current owner / branch / PR
- requested scope
- protected scope

### Before merge

- relevant tests / CI
- runtime / Visual gate where relevant
- diff scope
- secrets / temp garbage
- current base drift

Frontendのfinal Visual/runtime gateがSP/PCを含む場合、Project exceptionが無い限り**SP → PC**でacceptanceし、PCでshared ownerを修正した場合はSPからsequenceをやり直す。

### After merge

- merged state
- latest base
- production / Pages等、今回必要な公開runtimeの1回の実確認
- duplicate PR / unnecessary branchが残っていないこと

同じfactの反復取得は、state transitionを待つ合理的理由がある場合だけ行う。

## 9. Stuck rule

同じ手段を無制限に繰り返さない。

```text
1回目の失敗
→ root causeを確認

同じ原因で2回目も失敗
→ route / assumption / toolを変更

それでも進まない、またはHumanのMaster判断で大幅短縮可能
→ Humanへ短くescalate
```

ConnectorやCIの制約で本来の実装より迂回作業が大きくなり始めた場合も同様。

「調査を続ければいつか解決する」だけを理由に長時間消費しない。

## 10. Ask Human early when one decision removes large work

通常は確認待ちで止まらず自律実行する。

ただし以下では、遠回りを始める前にHumanへ短く聞く。

- 旧仕様を廃止できれば大幅に短縮できる
- compatibility維持の要否で実装量が大きく変わる
- legacy test / validatorをCurrent Authorityへ更新してよいかが唯一のblocker
- Visual変更の許可が必要
- 2つのAgentが同じwrite scopeを所有しようとしている
- protected scopeへ入らないと解決できない
- 恒久的な新infraを追加しないと進めないように見える
- secrets / credentials / external manual operationが必要
- 同じblockerに2回以上当たった

質問は長い報告書にしない。

推奨形式:

```text
Aなら現行仕様としてそのまま進められます。
Bを維持すると互換対応が大きく増えます。
Master AuthorityでAを正本にしてよいですか？
```

HumanがMaster Authorityを与えたら、その判断をactive contractへ反映し、同じ点を再確認しない。

## 11. Do not ask Human for routine implementation decisions

以下はCurrent Authorityから明確なら聞かずに進める。

- lint / formatting
- obvious bug fix
- duplicate code removal
- temp file cleanup
- approved contractに合わせたtest更新
- stale active residue removal
- scope外failureの分類
- Human-approved Visualを維持するintegration fix
- asset path repair
- duplicate enqueue / listener除去
- Git cleanup

「自分でrepoを読めば解決する質問」をHumanへ丸投げしない。

UI / hover / overlay では、現行 Figma に既にある open / hover / disabled を Human が URL 貼るまで待たない。完了前に `docs/agent-human-fb-weak-spots.md` を自分で回す。Figma に幅・高さ・gap・塗りがある塊は live computed と照合する。Budokan ページ実装は `experiments/budokan-wordpress/FIRST_PASS_MEASURE.md`。未測りで完了しない。

## 12. Local CLI fast path

local repositoryへアクセスできるimplementation Agentは、細かいAPI往復より既存toolchainを優先する。

例:

- `git`
- `gh`
- `rg`
- `find`
- project test runner
- `npm` / package scripts
- PHP tooling
- Playwright
- WordPress runtime tooling

同じ情報をconnectorとCLIの両方で毎回再確認しない。

Connectorしか使えないAgentはconnectorで進めてよいが、tool limitationを理由に不要な恒久infraを作らない。

## 13. Git economy

基本は:

```text
latest base
→ one clear branch
→ one clear PR
→ relevant CI / QA
→ squash merge
→ cleanup
```

避ける:

- unnecessary stacked PR
- temporary PR
- QAだけのbranchを乱立
- duplicate branch
- 同じ変更のAgent別branch

並行作業が必要な場合だけ明確なwrite scopeで分離する。

## 14. Completion gate

特別な案件契約が無い場合、原則以下を満たせば完了とする。

- requested implementation complete
- relevant tests green
- relevant runtime / Visual QA green
- Figma UI を触ったなら、対象塊の Figma 数値と live computed を照合済み（Budokan は `experiments/budokan-wordpress/FIRST_PASS_MEASURE.md`）
- no unrelated diff
- no secrets / temp garbage
- Git clean
- PRが必要な運用なら整理済み
- merge可能ならsquash merge済み
- latest base verified

これ以上の証跡・validator・workflow追加は、必要性が明確な場合のみ行う。

## 15. Priority statement

AgentのKPIは調査量ではない。

優先順位:

```text
Correct Current Authority
→ No duplicated ownership
→ Smallest safe implementation
→ Relevant QA
→ Clean Git
→ Next useful work
```

安全性を維持したうえで、重複調査・再確認・過剰QA・stale contract互換・Agent間二重実装を最小化する。