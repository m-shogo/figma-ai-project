# Human Review Web Dashboard

Purpose: automated QAが通った実装を、人間が**URLを1つ開くだけ**でFigmaと目視比較できる状態にする。

Human ReviewはAI visual QAの別名ではない。ユーザー本人からfeedbackが届くまで、run record上のHuman Review / Human Feedbackは`PENDING`のまま維持する。

## Primary URLs

REF-001の通常確認用URLは固定する。

```text
/ref-001/latest/review/
/ref-001/latest/preview/
```

run履歴も残す。

```text
/ref-001/runs/run-2/review/
/ref-001/runs/run-2/preview/
```

`latest`は人がブックマークする入口、`runs/*`は研究比較用。

## Review model

Desktopの基本配置は固定。

```text
LEFT  = LIVE WEB OUTPUT
RIGHT = FIGMA REFERENCE
```

左右をrunごとに入れ替えない。

### Normal Review

- 左: same-originのArtifact Previewをiframeで表示
- Web iframeのCSS viewport幅はexact acceptance width (`1380` / `375`)
- dashboard panelへは表示上だけscaleする
- 右: Figma Embed Kitのlive file embed
- Section選択時:
  - Webはsame-origin selectorへscroll
  - Figmaは対応する`node-id`へembed URLを切り替える

cross-originのFigma iframeをDOM操作して無理にscroll同期しない。この方式はsemantic section anchor同期として扱う。

### Pixel / Overlay Review

OverlayはLIVE iframe同士ではなく、deterministic capture同士を使う。

```text
WEB CAPTURE
+
FIGMA CAPTURE
```

Figma deterministic captureが未materializeなら、Overlay buttonは自動的にdisabledになる。Normal Reviewはlive Figma embedで継続できる。

SP Figma rootの先頭`40px`は`Status-Bar_W` device chromeであり、Web contentではない。OverlayではFigma側だけ40px offsetを引き、Web-content座標へ正規化する。

## Source manifest

Canonical review configuration:

```text
review-dashboard/manifests/ref001-run-2.json
```

manifestには:

- reference/run identity
- Human Review status
- Figma file/root/node ids
- PC/SP acceptance viewport
- section order
- Web selector/index
- section geometry
- deterministic capture source paths
- automated metrics

を持たせる。

DashboardのHTMLへREF-001 section情報を直接散らさない。REF-002以降はmanifest差し替えで再利用できる構造を維持する。

## Human feedback UX

各Section × PC/SPについて、人に求める最初の入力は3段階だけ。

- `✅ ほぼ同じ`
- `🟡 少し違う`
- `🔴 明らかに違う`

任意category:

- 文字
- 画像
- 画像の切り取り
- 位置
- 大きさ
- 余白
- 色
- 背景
- 全体の雰囲気
- 動き
- その他

コメントは専門用語不要。

> 理由は分からなくても大丈夫です。「何か違う」だけでも重要なフィードバックです。

入力はbrowser `localStorage`へ保存する。Review Dashboard専用DB/authenticationは追加しない。

`このFBをコピー`と`全FBをコピー`でMarkdownを生成し、そのままChatGPTへ貼れるようにする。

## Build

```bash
python scripts/build_human_review_site.py --output _site
python scripts/validate_human_review_site.py _site
python -m unittest tests.test_human_review_dashboard
```

Buildはsource repoへgenerated dashboard dataを書き戻さない。

Generated tree:

```text
_site/
  ref-001/
    latest/
      review/
      preview/
    runs/
      run-2/
        review/
        preview/
```

Artifact PreviewはPHP fixtureをbuild時にstatic HTMLへrenderし、Review UIを混ぜない。

Deterministic Web captureはcanonical evidenceからPages artifactへcopyする。大量のrun review outputをGit historyへ重複保存しない。

## Figma reference policy

Visual source of truthはlive Figma。

REF-001:

```text
file key: ZYTdtw4wCgkcBy2cVnhxVI
PC root: 21384:8173
SP root: 21376:4401
acceptance: PC 1380 / SP 375
```

Normal Reviewはstable `embed.figma.com` URLを使う。Figma MCPが返すshort-lived asset URLをDashboard source/manifest/Pages artifactへ保存しない。

Overlay用のFigma PNGはdurable asset pipelineでhash/lineage検証されたものだけを採用する。

## Deployment

Canonical workflow:

```text
.github/workflows/publish-human-review.yml
```

PR:

```text
build
→ validate
→ focused tests
→ browser smoke
→ backup artifact
```

`so` push / manual dispatch:

```text
build
→ validate
→ browser smoke
→ Pages artifact
→ configure Pages
→ deploy
```

GitHub Pagesが未設定の場合は`configure-pages`のenablementをまず試す。repository/environment policyで自動enableが拒否された場合だけ外部blockerとして扱い、UIを作っただけで「公開完了」としない。

## Completion gate for Dashboard

Dashboard deliveryは最低以下を確認してからready扱いする。

- fixed Review URL opens
- fixed Preview URL opens
- LIVE Web loads
- live Figma loads
- PC/SP switch works
- all 13 section entries work
- feedback survives reload
- current/all feedback copy works
- mobile Web/Figma switch works
- Overlay is either functional or explicitly capability-gated
- Human feedback status remains `PENDING` until real feedback arrives

## After Human Feedback

Human feedbackをshared ruleへ即変換しない。

```text
Human Feedback
→ classification
→ root cause investigation
→ repair
→ automated QA
→ Human Editability regression
→ same URL redeploy
→ Human re-review
→ generalization judgment
```

Run 3へ進むのはRun 2 Human Review後。
