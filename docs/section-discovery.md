# Figma Section Discovery

目的は、人間がFigmaからHeader/MV/Content/FooterのURLを1つずつ抜く作業を減らし、**AI/MCPがページ全体のsparse metadataから論理Sectionを発見し、PC/SPを対応付けてSection Manifestへ落とす**こと。

デザインを変更する工程ではない。

## Principle

```text
Full page reference
  ↓ sparse metadata
Section candidates
  ↓ confidence + evidence
PC/SP logical mapping
  ↓ targeted deep context
Section Manifest
```

最初からpage全体のfull design contextを読むのではなく、metadata/hierarchyで候補を作り、必要なnodeだけ深掘りする。

## 1. Find reference roots

Reference Manifestから:

- PC root frame/node
- SP root frame/node
- tablet/other state if present
- page/file identity

を取得する。

PC/SPのframeサイズやbreakpointはここで発明しない。

## 2. Sparse hierarchy first

まずtop-level metadata/hierarchyを見る。

候補signal:

- Figma native Section
- top-level Frame / Auto Layout child
- semantic node name
- full-width content region
- background boundary
- repeated container boundary
- Header/Nav/Footer role
- large content block with internal child hierarchy

ここではCardやButtonなどの内部componentまでSectionへ分割しない。

## 3. Candidate boundary rules

### Strong boundary evidence

- native Figma Sectionとして明確
- semantic top-level nameがHeader/Hero/Footer等
- top-level Auto Layout childとして独立
- PC/SP双方に対応する明確なregionがある
- independent background/container/layout scope

### Weak boundary evidence

- `Frame 123`など非semantic nameのみ
- visual whitespaceだけで区切られて見える
- background decorationとcontent hierarchyが混在
- neighboring regionとabsolute overlapが強い
- PC/SPでnode groupingが大きく異なる

弱い場合はすぐownerへ聞かず:

1. child metadata
2. screenshot
3. text anchors
4. component/instance relationship
5. assets
6. Auto Layout/position relationship

を追加取得してconfidenceを上げる。

## 4. Do not over-split

以下を独立Sectionにしないことが多い:

- Button/Card単体
- background-only shape
- decorative image only
- tiny text group
- local component instance
- one section内のsubheading/content group

SectionはAI task isolationに意味がある粒度にする。

目安:

- separate implementation file/areaとして自然
- local layout responsibilityを持つ
- shared foundation以外の依存が少ない
- page orderで独立regionとして説明できる

## 5. PC/SP logical mapping

PCとSPでnode IDは異なってよい。

対応付けpriority:

1. same component/component-set identity
2. same semantic node name/role
3. same distinctive text anchors
4. same image/icon/assets
5. same relative page order
6. similar child structure
7. visual similarity

1つのsignalだけで決めない。

### Mapping confidence

#### HIGH

複数の強いsignalが一致。

例:

- `Hero` name一致
- same image asset
- same heading text
- page order一致

#### MEDIUM

mappingはかなり妥当だが、一部grouping差やsemantic name不足あり。

追加deep contextを取得し、可能ならHIGHへ上げる。

#### LOW

複数候補が成立、またはPC/SP groupingが大きく異なる。

Production parallel workerへ直ちに渡さず追加調査する。

#### NOT_APPLICABLE

単一viewport reference等で対応付け自体が不要。

## 6. Boundary confidence

各Sectionへ:

```yaml
figma:
  boundary_source: FIGMA_TOP_LEVEL
  boundary_confidence: HIGH
  boundary_evidence:
    - "top-level Auto Layout child"
    - "semantic name Hero"
  pc_sp_mapping_confidence: HIGH
  mapping_evidence:
    - "same heading text"
    - "same hero asset"
```

を保存する。

### Boundary sources

- `FIGMA_SECTION`
- `FIGMA_TOP_LEVEL`
- `SEMANTIC_STRUCTURE`
- `AI_CANDIDATE`
- `OWNER`

## 7. Integration coupling detection

Section discovery時点でneighbor dependencyも見る。

### LOW

- independent background
- shared container/tokenだけ利用
- no cross-boundary overlap

### MEDIUM

- visual rhythm/background transitionが重要
- nearby overlapはあるがlocal implementation可能

### HIGH

- one visual composition spans multiple candidate sections
- shared absolute layers/z-index
- continuous interactive behavior
- splitting would likely require editing each other's files

HIGHの場合、Section boundary自体を見直すかserial waveにする。

## 8. Deep inspection after discovery

Candidateが固まったらsectionごとに必要なcontextだけ取得する。

- exact section node
- screenshot
- components/variants
- variables used
- typography
- Auto Layout/Grid/sizing
- local assets/crop
- states/annotations
- responsive behavior at shared breakpoint

これをworker contextへ渡す。

## 9. Section Manifest output

最終的に最低限:

- logical section id/name/order
- PC node ID
- SP node ID
- boundary source/confidence/evidence
- PC/SP mapping confidence/evidence
- dependencies
- integration coupling
- allowed write paths
- shared dependencies
- responsive behavior

を持つ。

## 10. Human involvement policy

人間へ聞くのは最後。

### AIで先に解決する

- metadataで取れる
- component relationで取れる
- screenshot/text/assets比較で高confidenceになる
- codebase structureで自然なboundaryが分かる

### Owner confirmationが価値あるケース

- 2つ以上の合理的boundaryが残る
- implementation ownershipが会社ルール依存
- PC/SPで意図的にcontent groupingが異なる理由が原本から分からない
- split choiceがcomponent API/analytics/CMS ownershipへ影響する

質問する場合も「どこですか？」ではなく、候補とevidenceを提示する。

## 11. Failure learning

Section discoveryも評価対象。

記録したいfailure:

- OVER_SPLIT
- UNDER_SPLIT
- PC_SP_MAPPING_MISS
- HIDDEN_CROSS_SECTION_DEPENDENCY
- WRONG_COUPLING_CLASS

1回失敗してもそのheuristicを永久禁止しない。

Figma metadata/MCP/model update後に再検証する。

## Future

実データが貯まったら:

- metadata → section manifest automatic adapter
- boundary confidence scoring
- PC/SP matching model/prompt
- screenshot-assisted mapping
- code ownershipを見たautomatic allowed_paths proposal

へ進める。
