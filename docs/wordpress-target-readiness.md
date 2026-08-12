# WordPress Target Readiness Coordinator

Production WordPress targetが接続された時に、別々のpreflightを手でつなぎ合わせず、**read-only evidenceを1つのreportへまとめる**ためのcoordinatorです。

```text
target repository
  -> static WordPress/theme reconnaissance
optional real WordPress path
  -> generic WordPress + ACF runtime capability
  -> REF-001 ACF import readiness preflight
  -> one readiness report
```

## Repoだけ受け取った時

```bash
python scripts/coordinate_wordpress_target_readiness.py \
  /path/to/target-repository \
  --output /tmp/wordpress-target-readiness.json
```

この段階では、theme候補、template、ACF Local JSON/PHP evidence、Header/Footer ownership、style architectureを静的に観測できます。

実WordPress pathが無いので、runtimeは意図的に`NOT_RUN`となり、`WORDPRESS_RUNTIME_NOT_SUPPLIED`を残します。repoを見ただけでWordPress/ACFが実際にbootするとは主張しません。

## Repo + 実WordPress runtimeがある時

```bash
python scripts/coordinate_wordpress_target_readiness.py \
  /path/to/target-repository \
  --wp-path /path/to/wordpress \
  --output /tmp/wordpress-target-readiness.json \
  --require-binding-ready
```

必要ならmultisite等のWP-CLI targetを明示します。

```bash
python scripts/coordinate_wordpress_target_readiness.py \
  /path/to/target-repository \
  --wp-path /path/to/wordpress \
  --site-url https://example.test \
  --require-binding-ready
```

`--site-url`はREF-001 import preflightへ渡され、credentialsを含むURLは拒否されます。

## `READY_FOR_PRODUCTION_BINDING_REVIEW` の意味

これはproduction完成ではありません。以下が揃った状態です。

- static target scanでtheme候補が1つに絞れている
- 実WordPress runtimeがbootする
- ACF runtime capabilityがready
- REF-001 ACF JSON import command/preflightがready
- static theme directory slugとruntime active stylesheetが、両方観測できた場合は一致している

この状態になったら、production Page template、global Header/Footer/CTA、Local JSON運用等を**実targetのownershipへ明示的にbindするreview**へ進めます。

## 完了判定は別

Coordinatorは常にbrowser Admin UIを実行しません。

```json
{
  "completion_readiness": {
    "ready": false,
    "admin_ui_smoke_executed": false,
    "blockers": ["ADMIN_UI_SMOKE_NOT_RUN"]
  }
}
```

したがって`READY_FOR_PRODUCTION_BINDING_REVIEW`でも、REF-001 runを`COMPLETE`へ変えてはいけません。

Browser `ADMIN_UI_SMOKE_PASS`には、実target adminへloginし、対象bundleをACF toolingからimportし、field groupsと対象Page/templateが実runtimeで正常に読める証拠が別途必要です。

## 既存toolとの役割

- `scripts/scan_wordpress_target.py`
  - filesystem/code only
  - theme/template/ACF/global/style evidence
- `scripts/probe_wordpress_acf_runtime.py`
  - real WordPress runtime only
  - WP-CLI/WordPress/ACF/admin/theme/version evidence
- `scripts/probe_ref001_acf_runtime.py`
  - REF-001 import bundle specific
  - ACF JSON CLI import readiness and optional disposable-runtime CLI smoke
- `scripts/coordinate_wordpress_target_readiness.py`
  - 上記をread-only preflightとしてまとめ、blockerを1箇所に集約

## Safety boundary

Coordinatorは以下を行いません。

- themeを自動選択してproduction authorityとしてfreeze
- production route/templateを発明
- plugin install/activate
- user作成
- ACF import実行
- content seed
- database変更
- browser ADMIN_UI実行済みという偽装

Static scanとruntime active themeが食い違う場合は`STATIC_RUNTIME_THEME_MISMATCH`でfail-closedします。
