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
| `unknowns` | Themeが来るまで解けない5件 |

`content_decisions`のsection一覧は
[`tools/implementation-intake/REAL_WEB_VALIDATION.md`](../../tools/implementation-intake/REAL_WEB_VALIDATION.md)
のPC geometry evidenceから**機械抽出**して照合する。手で足したり落としたりできない。

## 検証

```bash
python scripts/validate_wordpress_theme_intake.py
```

```bash
python -m unittest tests.test_validate_wordpress_theme_intake
```

## Theme到着後の手順

```text
1. Themeのrepository / starting commit を theme_delivery へ記録し status を THEME_SUPPLIED へ
2. python scripts/scan_wordpress_target.py <theme-repo> --output /tmp/recon.json
3. 実WordPressがあれば python scripts/coordinate_wordpress_target_readiness.py <theme-repo> --wp-path <wp>
4. observation checklist を OBSERVED / UNDETERMINED で埋める(埋まらないものは埋めない)
5. status を THEME_OBSERVED へ。ここで初めて target_path / ownership / implementation_unit を書ける
6. editor capability を確認して content_ownership を確定
7. CPT / taxonomy / form 要件を確定
8. unknowns を RESOLVED へ
9. freeze
10. 実装へ
```

5より前で`target_path`等を書こうとするとvalidatorが落ちる。それが意図した動作。

## Theme提供時にほしい情報

`theme_delivery.blocking_questions`に記録済み。

- 本番用初期ベーシックThemeのrepository / commit
- Classic / Block / Hybrid の前提
- Header/Footer/navigation の所有者
- 既存 form plugin と CPT 登録の有無
- ACF Local JSON の運用rule

## Secret

`ACF_PRO_LICENSE_KEY`はGitへcommitしない。
既存の`experiments/wordpress-acf-pro-standalone-lp`のsecret境界をそのまま使う。
