# Theme drop-in

ここに **編集する本番 Theme を 1 つだけ**置く。

```text
theme-dropin/
  budokan/          ← style.css を持つ Theme ディレクトリ
    style.css
    functions.php
    ...
```

置き方:

```bash
# 例: 手元のベーシック Theme をコピー
cp -R /path/to/budokan-theme ./theme-dropin/budokan
```

またはコピーせず:

```bash
THEME_SOURCE_DIR=/path/to/budokan-theme make smoke
```

注意:

- 同時に 2 つ以上置くと失敗する
- このディレクトリの中身は gitignore（commit しない）
- `../theme/sample-theme` は検証用サンプル。本番 Theme にしない
