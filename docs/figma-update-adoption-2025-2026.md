# Figma Update Adoption — 2025-08 to 2026-08

Checked: 2026-08-10 JST

目的はrelease historyを並べることではなく、**Figma→AI→code workflowへ何を取り入れるか / legacyをどう扱うか**を記録すること。

公式release/docsをsource of capability truthとする。古い手法も削除せず、CURRENT / LEGACY / RETESTに分類する。

---

## 2025-09-23 — Remote MCP + design context portability

Official:
- https://www.figma.com/blog/design-context-everywhere-you-build/

What changed:
- Figma MCP remote access
- IDE/AI agentからFigma contextを取得しやすくなった
- Code Connect in-app mapping改善
- design/code contextをFigma外へ運ぶ方向が明確化

Adopt:
- remote MCPをcurrent defaultとしてpreflight
- Figma link/node IDをsection manifestへ保存
- project code component mappingをcontext packageに含める

Legacy:
- desktop selection-based flowは削除しない
- remoteで不足/障害があるclientではdesktop pathを比較対象にする

---

## 2025-10-28 — MCP GA / Code Connect UI / design-system guidance

Official:
- https://www.figma.com/blog/schema-2025-design-systems-recap/

What changed:
- MCP GA
- remote/desktop feature parity at that point
- Code Connect UI + GitHub mapping flow
- AIがdesign systemへ従うためのguideline/rule file方向

Adopt:
- `AGENTS.md` / client adapters / design-system rulesをprompt本文から分離
- Code Connect mapping coverageを実験metadataにする
- mappingがあるcomponentをsection workerが再実装しないgateを置く

Legacy:
- CLI mappingは引き続き重要。UI/CLIどちらか一方を永久標準にしない

---

## 2026-02-17 — Code → editable Figma roundtrip

Official:
- https://www.figma.com/blog/introducing-claude-code-to-figma/
- https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/

What changed:
- running code/UIをeditable Figma layersへ戻せるworkflow
- multiple states/flowsをcanvas上で比較可能

Adopt later:
- Evidence Dashboardと連携
- implementation → Figma comparison page → designer/AI review → code repair のroundtrip研究
- source referenceとは別page/fileへcaptureする

Legacy:
- screenshot-only reviewも軽量evidenceとして残す

---

## 2026-03 to 2026-05 — Agents / skills / write-to-canvas workflows

Official examples:
- https://www.figma.com/blog/figma-mcp/
- https://help.figma.com/hc/en-us/articles/40219873508247-Release-notes-roundup-May-2026

What changed:
- agentがcanvasへ直接働きかけるworkflowが増えた
- repeatable procedureをskillsとして扱う方向
- prototype/code → Figma → refinement → codeのloopが強化

Adopt:
- giant promptではなく reusable skill/procedureを研究対象にする
- Section Inspect / Section Implement / Verify / Repair をskill化可能な単位として設計

Legacy:
- clientがskills未対応ならMarkdown instructionsへfallback

---

## 2026-06-16 — download_assets / broader MCP workflows / custom fonts

Official:
- https://www.figma.com/blog/4-ways-were-using-our-mcp-server-at-figma/

What changed:
- `download_assets` によりactual export/source assets取得が容易になった
- MCP workflowの適用範囲拡大
- custom font supportの改善例

Adopt:
- image/iconを手動でFigmaから1個ずつ抜く作業を減らす
- section manifestごとに必要assetをAI/MCPで抽出する
- screenshotとsource assetを混同しない

Legacy:
- unsupported font/client/environment issueは依然preflight対象

---

## 2026-06-24 — Code layers on Figma canvas

Official:
- https://www.figma.com/blog/code-on-the-figma-canvas/

What changed:
- code and canvasを同じ検討空間で扱う方向が強化

Adopt as research:
- future visual workbenchでcode-backed proposalとnative referenceを並べる
- current production referenceをcode layerで置換しない

---

## 2026-07-01 — Reusable Skills

Official:
- https://www.figma.com/blog/got-skills-make-the-figma-agent-a-better-collaborator/

What changed:
- team procedure/promptをreusable skill化
- repeated workflowを毎回説明する必要を減らす方向

Adopt:
- project learningsのうちE3+になったprocedureをskill candidateへ
- client-specific skillとcross-agent ruleを分離

Legacy:
- current MCP/client availabilityをrun前に再確認

---

## 2026-07-07 — Parallel AI image edits

Official release notes:
- https://www.figma.com/release-notes/

What changed:
- multiple AI image editsを並列実行可能

Adopt later:
- image-only research / asset repair / background variantsでparallel generationを検証
- UI implementation pipelineとは分離して評価

Legacy:
- image generation quality/cost/modelは頻繁に変わるためversion付きevidenceにする

---

## 2026-07-16 — Code-backed screens bind existing Variables + more Auto Layout

Official release notes:
- https://www.figma.com/release-notes/
- https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/

What changed:
- code/live UIをcanvasへ持ち込む際、color/type/spacingがcompatibleなexisting Variablesへ自動bindingされる範囲が拡大
- more frames imported with Auto Layout

Adopt:
- roundtrip capture先Figma fileに正しいlibrary/variablesを先にsubscribeしておく
- Dashboard/evidence captureをeditable layerとして保持できる可能性を検証

Legacy:
- bindingは`most/compatible`であり100%前提にしない。capture後にauditする

---

## 2026-07-24 — Updated Auto Layout closer to CSS

Official release notes:
- https://www.figma.com/release-notes/

What changed:
- Figma Auto LayoutとCSS layoutの差を縮めるupdated option
- new frames use updated behavior automatically
- existing frames remain legacy unless updated
- legacyへ戻すoptionは2027-01まで提供予定

Adopt immediately:
- reference manifestへ `auto_layout_generation: UPDATED | LEGACY | MIXED | UNKNOWN` を記録
- Flex/Grid translation ruleをgeneration-awareにする
- old workaroundを永久ruleにしない

Critical:
- 同じfile内でlegacy/newが混在し得る
- visual appearanceだけでlayout semanticsを決めない

---

## 2026-07-30 — Figma Make editing panel / annotation / screen-size review

Official release notes:
- https://www.figma.com/release-notes/

What changed:
- spacing/type/layoutをpropertiesで直接調整
- point/annotationによるintent伝達
- device frame switchingでscreen-size確認

Adopt as signal:
- visual feedbackは「もっと近く」ではなくannotation-like targeted mismatchとしてRepairへ渡す
- PC/SP/in-between evidenceをAI review bundleへまとめる

---

# Still-relevant pre-1-year foundations

一年より少し古くても、現在のworkflowへ直接効くものはlegacy knowledgeとして残す。

## Auto Layout Grid (2025-05)

Current docs:
- https://help.figma.com/hc/en-us/articles/31289469907863-Use-the-grid-auto-layout-flow

Still relevant:
- `fr`, Grid, min/max, hug/fillがFigma構造として存在
- CSS Gridへtranslateできるdesign intentが増えた

Do not assume:
- old screenshots/tutorial UI equals current Auto Layout generation semantics

---

# Current adoption matrix

| Capability | Current default | Legacy handling | Research |
|---|---|---|---|
| Large frame handoff | section-first | whole-page one-shot retained as benchmark | re-test after major model/MCP update |
| MCP | remote preferred | desktop retained | reliability/client comparison |
| Variables | extract/map first | raw values allowed when truly one-off | roundtrip auto-binding |
| Components | inspect/reuse first | native one-off when no reusable component exists | Code Connect coverage |
| Auto Layout | read actual generation/semantics | legacy frames supported | updated-vs-legacy fidelity |
| Assets | MCP/source extraction preferred | manual export fallback | image pipeline |
| Prompting | staged + section-scoped | one-shot benchmark | Skills/procedural memory |
| Review | exact screenshots + structured evidence | manual visual check retained | editable-Figma/dashboard loop |

# Update rule

この文書の内容を固定best practiceにしない。

Significant run前にrelease notes/MCP docsを再確認し:

- capability changed → update this map
- old CAUTION related update → RETEST_NOW
- old workaround unnecessary → SUPERSEDED
- legacy reference still exists → compatibility pathを維持
