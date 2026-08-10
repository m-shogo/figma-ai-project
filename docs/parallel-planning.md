# Parallel Section Planning

Section-first実装を速くするための並列化は、**人が勘で同時実行数を決めるのではなく、Section Manifestのdependency / coupling / write scopeから安全なWaveを計画する**。

Current planner:

```bash
python scripts/section_planner.py path/to/section-manifest.yaml
```

Machine-readable:

```bash
python scripts/section_planner.py path/to/section-manifest.yaml --json
```

## Wave semantics

**1 Wave = そのWave内のSectionはすべて同時実行して安全と判定された集合。**

異なるWaveは原則順番に進める。

例:

```text
Wave 1: Header, MainVisual, Content01
Wave 2: Content02
Wave 3: Footer
```

Wave 2/3へ送られる理由は、依存関係だけとは限らない。

- another sectionへのdependency
- allowed write path overlap
- write scope未確定
- HIGH integration coupling

があれば安全側へ分離する。

## Inputs

`templates/section-manifest.yaml` の各Sectionから使う。

### `dependencies.section_ids`

先に完成している必要があるSection。

```yaml
dependencies:
  section_ids: [S01]
```

### `dependencies.integration_coupling`

- `LOW`: 通常は独立実装可能
- `MEDIUM`: 並列可能だがintegration時に重点確認
- `HIGH`: current defaultでは単独Wave

HIGHを永久禁止扱いしない。実験で安全性が確認できれば将来planner policyを変更できる。

### `implementation.allowed_paths`

Workerが書き込めるownership root。

```yaml
implementation:
  allowed_paths:
    - src/sections/Hero
```

同じWaveで:

```text
src/sections
src/sections/Hero
```

のように包含関係がある場合は競合するため分離する。

Globは使わない。

### `worker.parallel_group`

実際に起動する並列group名。

Planner出力の `recommended_parallel_group` を現在の推奨値として使える。

ただしmanifestへ自動書換えすること自体をsource of truthにはしない。Coordinatorがdependency/coupling/write scopeを確認して確定する。

## Scheduling flow

```text
Section Manifest DRAFT
  ↓
dependency / coupling / allowed_pathsを記録
  ↓
section_planner.py
  ↓
Safe Waves
  ↓
Coordinator review
  ↓
worker.parallel_groupを確定
  ↓
validate_parallel_paths.py
  ↓
Workers start
```

## Fail closed cases

以下は並列実行前に止める。

- dependencyが存在しないSectionを参照
- self dependency
- dependency cycle
- required dependencyがBLOCKED
- active workerのparallel_groupが空
- same parallel group内でdependency関係あり
- same parallel group内でwrite scope overlap
- HIGH coupling Sectionを他Sectionと同groupに配置
- allowed pathにglob / absolute path / `..`

## Conservative by design

Current plannerは少し保守的。

例えば同じdependency layer内でwrite conflictにより2Waveへ分かれた場合、次dependency layerは両方が完了してから開始する。

これは最大並列度より:

1. reproducibility
2. merge safety
3. failure attribution
4. integration consistency

を優先しているため。

実験データが貯まり、dynamic schedulerの方がIntegration Taxを増やさず速いと確認できたら改善候補にする。

## Parallelism is not the goal

最大同時実行数をKPIにしない。

見るもの:

- First-pass Fidelity
- Section Rework
- Integration Rework
- merge conflicts
- Shared Contract revisions
- foundation rebuild/fanout
- human coordination
- elapsed time / critical path when reliable

**速いがintegrationで大量修正になる並列化は失敗。**

`docs/rework-metrics.md` を参照。

## Future improvement candidates

Evidenceができてから検討する。

- automatic worker.parallel_group application
- dynamic scheduling after each completed Section
- estimated critical path
- agent/model-specific concurrency limits
- automatic code-path ownership extraction from target repo
- Figma section dependency inference
- integration-coupling inference from continuous backgrounds/overlap/shared interactions

これらも一度の成功/失敗で固定しない。
