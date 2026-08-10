# Parallel Git / Sandbox Isolation

Sectionを並列実装する場合、write pathが分かれていても**同じworking treeを複数workerで共有しない**。

理由:

- checkout/index競合
- generated filesの競合
- formatter/build outputの競合
- agentが想定外fileを読む/書く可能性
- failure attributionが曖昧になる

## Current production default

```text
Verified foundation commit
  ├─ Section S01 → isolated branch/worktree or agent sandbox
  ├─ Section S02 → isolated branch/worktree or agent sandbox
  └─ Section S03 → isolated branch/worktree or agent sandbox
             ↓
      coordinator integration branch
             ↓
      integration verification
             ↓
      one clean delivery PR / merge unit
```

## Allowed isolation modes

### `BRANCH_WORKTREE`

Git branch + separate worktree/check-out。

Strong default when local agents can use Git directly.

### `AGENT_SANDBOX`

Codex/other agent environmentが提供するisolated workspace/ref。

Branch/worktreeと同等に、他workerから独立していることを確認する。

### `OTHER`

別container/clone等。

`worker.isolation.ref`へ一意なidentityを記録する。

### `SERIAL_SHARED_TREE`

同一working treeを使うserial execution。

1 workerだけなら利用可能だが、同じparallel groupへ複数Sectionを入れない。

## Manifest

```yaml
worker:
  parallel_group: wave-01
  isolation:
    mode: BRANCH_WORKTREE
    ref: section/S01-header
```

同じparallel groupでは`ref`を共有しない。

## Git history policy

Parallel executionのために最終履歴を散らかさない。

### Worker

- verified foundation commitから開始
- target Sectionだけ変更
- 可能ならSection単位で1つのreviewable commitへまとめる
- unrelated cleanupを混ぜない
- shared contract変更をworker branchへ勝手に混ぜない

### Coordinator

- manifest order/dependencyに従い成果を統合
- conflictがあれば原因を記録
- Integration fixはworker commitと分離して追跡可能にする
- delivery前にtemporary section branches/worktreesの残骸を確認
- project policyが許せば最終deliveryは1つの明確なPR/merge unitへ整理

## Conflict is evidence

Merge conflictを単なるGit作業として消さない。

記録する:

- conflicting sections
- conflicting paths
- expected isolation rule violationか
- shared abstraction不足か
- integration-only conflictか

同じpatternが繰り返される場合:

- allowed path設計
- shared foundation
- section boundary
- parallel planner

のどこを直すべきか評価する。

## Shared change during parallel work

Workerから`PROPOSE_SHARED_CHANGE`が出た場合:

1. 既存worker outputへ直接混ぜない
2. coordinatorが提案を評価
3. 必要ならfoundation branchで実装
4. foundation再verify
5. Shared Contract revision/hash更新
6. affected Sectionだけ再base/re-run

古いfoundation commitと新しいfoundation commitの成果物を同じcohortとして扱わない。

## Cleanup

Integration完了後に確認:

- temporary section branches
- worktrees
- abandoned agent refs
- duplicate PRs
- stacked changes that should be collapsed

研究証拠として必要なcommit SHAはRun Recordへ残すが、remote branchを永久に保持する必要はない。

## CI

`scripts/validate_parallel_isolation.py` はactive parallel groupについて:

- isolation modeがassignedか
- parallel-safe modeか
- isolation refが空でないか
- refがgroup内でuniqueか
- `SERIAL_SHARED_TREE`を並列利用していないか

を検証する。

これは安全性のcurrent default。将来agent platformがより強いtransaction/isolationを提供したら再評価する。
