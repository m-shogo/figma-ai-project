# Future Platform — Prompt Library → Reproduction Workbench

このrepoの最終形を「prompt集」だけに限定しない。

データが十分に貯まり、実験運用で必要性が確認できたら、**Figma reference・生成コード・画像・diff・failure・tooling updateを1つにまとめて、人間とAIの両方が評価できるworkbench/dashboard**へ発展させる。

現時点では設計原則とdata contractだけ決め、UI自体はreference designと実データが揃うまで作らない。

---

# Vision

```text
Figma Reference
    │
    ├── structured context
    ├── reference screenshots
    ├── assets
    └── component/token metadata
             │
             ▼
      Context / Run Engine
             │
     ┌───────┼────────┐
     ▼       ▼        ▼
   Codex   Claude   Cursor
     │       │        │
     └───────┼────────┘
             ▼
      Browser Captures
             │
      ┌──────┼────────────┐
      ▼      ▼            ▼
 side-by-side overlay   pixel/region diff
      │      │            │
      └──────┼────────────┘
             ▼
        AI Visual Review
             │
             ▼
 Failure Records + Scores
             │
             ▼
 Candidate / Proven Knowledge
```

## Dashboard goals

1. 原本と生成物を同時に見る
2. PC/SP/中間幅を切り替える
3. agent/model/runを横並び比較する
4. first-passとfinalを分けて見る
5. overlay/diffでズレを確認する
6. AIが同じevidence bundleを見てfailure候補を出せる
7. 人間がfailure/scoreを修正できる
8. prompt/context/version差を追える
9. tooling updateで古いruleをretest queueへ戻せる
10. 別案件へexport可能なproven rulesだけ抽出する

---

# Evidence Bundle

AIに「出来上がったものを組み合わせて見せる」ため、runごとのvisual evidenceを標準化する。

```text
EvidenceBundle
├── reference/
│   ├── pc.png
│   ├── sp.png
│   └── states/...png
├── first-pass/
│   ├── pc.png
│   ├── sp.png
│   └── intermediate/...png
├── final/
│   └── ...
├── compare/
│   ├── side-by-side/*.png
│   ├── overlay/*.png
│   ├── diff/*.png
│   └── contact-sheet.png
├── manifests/
│   ├── reference.yaml
│   └── run.yaml
└── review/
    ├── ai-review.json
    └── human-review.json
```

## Why contact sheet

1枚ずつ別contextで見るより、必要なcomparisonを1枚にまとめることでAIが:

- PC/SPの共通ズレ
- agent間差
- before/after
- responsive pattern

を同時に判断しやすくなる可能性がある。

ただし画像圧縮で細部が潰れるため、contact sheetだけに依存せず、必要箇所は原寸cropも渡す。

これはCandidate workflowとして実験する。

---

# Image ingestion

将来dashboardは画像をupload/importできる構造を想定する。

Input type:

- Figma node screenshot
- browser screenshot
- user-uploaded reference image
- generated visual
- cropped detail
- overlay/diff

画像にはmetadataを必ず付ける。

```yaml
image_id: IMG-001
role: REFERENCE # REFERENCE | FIRST_PASS | FINAL | DIFF | DETAIL | EXTERNAL
source: FIGMA # FIGMA | BROWSER | UPLOAD | GENERATED
viewport:
  width: null
  height: null
state: ""
run_id: ""
reference_id: ""
captured_at: ""
sha256: ""
notes: ""
```

同名画像の上書きで履歴を失わない。

---

# AI review contract

AIは画像だけを見て最終判断しない。

可能な場合:

```text
visual evidence
+ reference manifest
+ Figma structured context
+ run metadata
+ failure taxonomy
```

を組み合わせる。

AI review output候補:

```json
{
  "summary": "",
  "confidence": "MEDIUM",
  "failures": [],
  "protected_matches": [],
  "suggested_next_inspection": [],
  "suggested_repair_scope": []
}
```

AIのscoreはhuman ground truthではなくreview candidateとして扱う。

---

# Dashboard views

## 1. Run Matrix

| Reference | Agent | Model | Context | First-pass | Rework | Replay |

全体比較。

## 2. Visual Compare

- Reference
- First Pass
- Final
- Overlay
- Diff

を同期表示。

## 3. Responsive Strip

同runの:

```text
PC → intermediate(s) → SP
```

を横一列で確認。

## 4. Failure Explorer

- taxonomy
- severity
- viewport
- agent
- model
- context tier
- current recommendation

でfilter。

## 5. Knowledge Graph

```text
External signal
→ Experiment
→ Failure
→ Repair
→ Clean replay
→ Candidate rule
→ Proven rule
```

証拠のつながりを見る。

## 6. Update Radar

- current Figma updates
- agent updates
- community signals
- stale rules
- RETEST_NOW

を一覧化。

## 7. Image Lab

画像中心の実験用。

- upload reference image
- generated attempt
- side-by-side
- region crop
- prompt version
- tool/model
- result

---

# Implementation philosophy

Dashboard自体を先に豪華に作り込まない。

順序:

1. data formatを実験で安定させる
2. YAML/JSON + artifact foldersで手動運用
3. 3–5実験たまる
4. 手作業で辛い箇所を特定
5. そこだけdashboard化
6. AI review/importを追加
7. proven workflowだけ自動化

UIのためのUIを作らない。

---

# Candidate technical direction

まだ固定しないが、Web dashboardなら将来:

- static/local-first first
- YAML/JSONをsource of truth
- screenshots/artifactsをfilesystemまたはobject storage
- diff生成はCLI/worker
- dashboardはread-heavy
- experiment creation/editはschema-backed forms

が自然。

Framework/storageは、その時点のrepo/利用環境/最新toolingを見て決める。

---

# Success condition

Dashboardが成功と言えるのは:

- experiment記録時間が減る
- AIが比較evidenceを読みやすくなる
- failureの見逃しが減る
-過去の学びを検索しやすくなる
- update後のretest対象が分かる
-次案件へproven rulesを取り出しやすくなる

ことであり、「綺麗な管理画面ができた」ことではない。
