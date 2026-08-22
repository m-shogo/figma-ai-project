# REF-002 日本武道館 — WordPress / ACF Pro 受け入れ基盤

## これは何か

REF-002を**本物のWordPress案件**へ移行するための、Theme到着前の受け入れ境界。

Themeそのものは作らない。ここにあるのは、Themeが届いた瞬間に実装へ入れるようにするための
**observation checklist / coverage matrix / decision matrix / QA再利用方針**である。

正本contract: [`docs/wordpress-theme-intake.md`](../../docs/wordpress-theme-intake.md)

## これは何でないか

- 本番Themeではない
- Theme代用品ではない
- REF-002 Visual benchmark(`experiments/ref002-budokan-fullcalendar-validation`, Draft PR #142)ではない
- REF-001の資産を参照/変更するものではない

`experiments/wordpress-acf-pro-standalone-lp`はdisposable runtime fixtureであり、
本番Theme構造の継承元ではない。

## 現在の状態

```text
status: AWAITING_THEME
theme_delivery.state: NOT_SUPPLIED
freeze.ready: false
```

本番用の初期ベーシックThemeはユーザー側で用意される予定。
到着するまで、Theme-relativeな具体path / slug / `implementation_unit` / form plugin / CPT slug は
validatorが機械的に拒否する。

ただし、**Theme repoから観測できる情報をユーザーへ質問しない**。
Theme family / Header/Footer ownership / `theme.json` / block registration / CSS/JS pipeline /
breakpoint / ACF Local JSON / CPT registration / form plugin evidence は、Theme受領後にAIがread-onlyで観測する。

## Record

[`theme-intake.yaml`](theme-intake.yaml)

| block | 中身 |
| --- | --- |
| `theme_delivery` | Theme受領state + 15項目のobservation checklist + blocking questions |
| `template_coverage` | WordPress template surface 13種の受け入れ境界 |
| `content_decisions` | REF-002の11 sectionそれぞれのreuse / content ownership / editor capability / interaction分類 |
| `cpt` / `taxonomies` | UNDETERMINED。candidatesはhypothesisでありCanonではない |
| `forms` | plugin未選定。挿入境界だけを定義 |
| `qa_reuse` | 既存QA資産7層の再利用モード + canonical viewport + secret境界 |
| `unknowns` | Theme/運用要件が来るまで解けない項目 |

`content_decisions`のsection一覧は
[`tools/implementation-intake/REAL_WEB_VALIDATION.md`](../../tools/implementation-intake/REAL_WEB_VALIDATION.md)
のPC geometry evidenceから**機械抽出**して照合する。手で足したり落としたりできない。

## Figma asset truth は取り直さない

Protected Draft PR #142の旧HTML/CSS/JSは本番architecture authorityにしないが、
そこでmaterialize済みの**exact Figma asset bytesは再利用候補**として保存する。

正本 evidence:
[`baseline-asset-source.yaml`](baseline-asset-source.yaml)

このevidenceは以下を固定する。

- protected source branch / immutable head commit
- raster manifest location
- 25 raster assetsのSHA-256
- 12 partner PNG / Footer vector authorityの存在
- 「asset bytesは再利用可、旧HTML/CSS/JSはproduction authorityにしない」という境界

Theme到着後は、必要assetだけをTheme側の正しい配置先へselective importし、再hashする。
旧asset pathを都合だけで本番Themeへ持ち込まない。

## 検証

```bash
python scripts/validate_wordpress_theme_intake.py
```

```bash
python -m unittest tests.test_validate_wordpress_theme_intake
```

## Theme到着後の手順

Themeを動かすローカル環境は既存 runtime を再利用します（PR #151）。

```bash
cd experiments/wordpress-acf-pro-standalone-lp
cp -R /path/to/supplied-theme theme-dropin/
make smoke
```

`theme-dropin/` は git-ignored です。client Theme をこの repository へ commit しないでください。

```text
1. Theme repository / starting commit を theme_delivery へ記録し status を THEME_SUPPLIED へ
2. Theme repoから自動観測できる項目はユーザーに聞かず scan/readiness で取得
3. python scripts/scan_wordpress_target.py <theme-repo> --output /tmp/recon.json
4. 実WordPressがあれば python scripts/coordinate_wordpress_target_readiness.py <theme-repo> --wp-path <wp>
5. observation checklist を OBSERVED / UNDETERMINED で埋める(埋まらないものは埋めない)
6. status を THEME_OBSERVED へ。ここで初めて target_path / ownership / implementation_unit を書ける
7. existing Theme -> Core -> style/variation -> Pattern -> existing block -> ACF Block -> new custom block の順に解決
8. editor capabilityをTheme/既存運用/明示要件から確認し content_ownership を確定
9. CPT / taxonomy / form は existing registration / company policy /案件要件を確認して確定
10. #142から必要なexact Figma assetだけselective importしSHA-256を再検証
11. unknowns を RESOLVED へ
12. freeze
13. Section単位で SP implementation -> SP QA -> PC adaptation -> PC QA
14. Block Editor insert/edit/save/reload/front-end parity / CMS mutation QA
15. Full Page SP -> PC / Human Editability / Before-After measurement
16. reusable lessonをEvidence Indexへ戻す。自動promotionはしない
```

6より前で`target_path`等を書こうとするとvalidatorが落ちる。それが意図した動作。

## Theme提供時に本当に必要な入力

原則としてユーザーに必要なのは次だけ。

- 本番用Themeのrepository / commit（またはTheme実体へのアクセス）
- Theme repo外に会社固有の実装policy / coding standard / editor運用仕様がある場合、その所在
- repoから観測できない**業務要件**（例: editorがカードを自由に追加/並び替えする必要、NewsとEventsの運用主体、form送信要件）

以下は原則AIがThemeから観測するため、最初からユーザーへ質問しない。

- Classic / Block / Hybrid
- Header/Footer/navigation ownership
- existing block / Pattern / style variation
- form plugin / CPT登録の存在
- ACF Local JSON policyのコード evidence
- CSS/JS/breakpoint/image pipeline

観測しても複数の正解が残る場合だけ、具体的な選択肢と影響を添えて確認する。

## Secret

`ACF_PRO_LICENSE_KEY`はGitへcommitしない。
既存の`experiments/wordpress-acf-pro-standalone-lp`のsecret境界をそのまま使う。
