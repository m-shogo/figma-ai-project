# Figma Responsive Counterpart Resolution

## Purpose

PC/SPのFigma frameを毎回人間が手で対応付ける作業を減らす。

対象は、名前やページ構成が綺麗に揃っているFigmaだけではない。

- `join` ↔ `join_sp` のように素直な命名
- `parts` ↔ `SP_prototype` のように名前が一致しない
- `news_sp` と別の `SP_prototype` がどちらもNewsを表す
- PCだけ / SPだけに存在するsurface
- 古い案・別variant・wrapper frameが残っている

を含めて、**観測 evidence から候補を順位付けし、確信度に応じて追加観測する**。

これは新しいVisual QA engineではない。既存の Figma Structure Profile の
`signals.responsive_mapping` を埋めるための薄い discovery helper である。

## Principle

```text
Figma top-level/page-family inventory
        ↓
lightweight fingerprint
        ↓
responsive counterpart ranking
        ↓
HIGH    -> automatic candidate
MEDIUM  -> targeted Figma inspection
LOW     -> keep UNDETERMINED
        ↓
visual/structure evidence
        ↓
Section Manifest / Structure Profile
        ↓
SP -> PC implementation and acceptance
```

**1位だから正解とはしない。**

2位候補も強い場合は、古いvariant・別composition・wrapperの可能性があるため
自動採用を止める。

## Fingerprint evidence

粗い順に次を使う。

1. device語を除去したframe名
   - `join` / `join_sp` -> `join`
   - `training_center` / `training_center_sp` -> `training center`
2. semantic/page-family hint
3. descendant layer/component名
4. visible text vocabulary
5. frame順序
6. width/height比
7. 必要なら screenshot / design context / component lineage

名前だけをauthorityにしない。

`topdesign` ↔ `SP_prototype` のような対応や、同じ `SP_prototype` が複数あるFigmaを
扱うため、semantic fingerprintと追加観測を前提にする。

## Resolver

```bash
python scripts/resolve_responsive_counterparts.py path/to/frame-inventory.yaml
```

または:

```bash
python scripts/resolve_responsive_counterparts.py path/to/frame-inventory.yaml \
  --output /tmp/responsive-counterparts.yaml
```

inputはFigma MCP / Plugin APIからread-onlyで観測したframe evidenceを使う。
ユーザーにPC/SP対応表を先に作らせない。

最低限:

```yaml
frames:
  - page_role: PC
    node_id: "1:2"
    name: join
    width: 1380
    height: 3400
    order: 0
  - page_role: SP
    node_id: "3:4"
    name: join_sp
    width: 375
    height: 4600
    order: 0
```

精度を上げる場合:

```yaml
page_family_hint: FEATURE_PAGE_JOIN
semantic_tokens:
  - 大会に参加したい
  - 武道
text_samples: []
descendant_names: []
```

`page_family_hint`も人間の推測をCanon化するためのfieldではない。
Figmaのpage/frame/visible contentから観測できる場合だけ evidence として使う。

## Confidence policy

### HIGH / AUTO_CANDIDATE

明確な名前対応やsemantic evidenceがあり、強い競合候補もない。

自動候補としてSection discoveryへ渡してよい。
ただしFigma truthの最終確定ではなく、後続のvisual/structure evidenceと矛盾したら撤回する。

### MEDIUM / INSPECT_MORE

有力だが、次のどれかがある。

- frame名がgeneric
- 強い2位候補がある
- semantic fingerprintだけで対応している
- old/current variantの区別がつかない

この場合、対象candidateだけ追加で `get_metadata` / screenshot / design context / component lineageを確認する。
全Figmaを人間に整理させない。

### LOW / HUMAN_REVIEW

fingerprint不足または候補競合を追加観測でも解決できない。

まず `UNDETERMINED` を維持する。
人間へ質問するのは、Figma内の追加観測で解けないことを確認した後だけ。

## Important: responsive counterpart != identical layout

PC/SP counterpartが確定しても、同じDOM・同じcard数・同じ並びを意味しない。

REF-002では既に:

- About: PC 6 cards / SP 3-card authored composition
- Instagram: PC/SPでvisible cardinality差
- SNS placement差
- section stacking差

が観測されている。

resolverが決めるのは**同じsemantic surfaceの候補**であり、responsive parityではない。
実装では authored SP/PC differences を保持する。

## Missing counterpart is valid

全PC frameにSPがある、全SP frameにPCがある、とは仮定しない。

- PC-only
- SP-only
- alternate states
- old variants
- design-library/reference frame

は正当な可能性。
弱い候補へ無理に1:1 assignmentしない。

## REF-002 lesson

2026-08-23 live Figma inspectionで次を確認した。

- `join` ↔ `join_sp`: 名前/semanticとも強い
- `training_center` ↔ `training_center_sp`: 名前/semanticとも強い
- `parts` ↔ generic `SP_prototype` (`1399:19144`): 名前は違うが、Parts内容の順序とsemantic fingerprintが一致
- News: `news_sp` (`560:2524`) と generic `SP_prototype` (`1399:14225`) の両方がNews archiveを表す別compositionとして存在
- main TOP SP `446:10020`: visual evidenceは強いがprogrammatic descendant fingerprintは疎で、fingerprintだけなら自動HIGHにしてはいけない

この結果から、**name-only matchingもsemantic-only matchingも不十分**であり、confidence + candidate competition + targeted observation が必要と分かった。

## Human effort target

理想の通常フローは:

```text
ユーザー: Figmaを渡す
AI: pages/framesを観測
AI: PC/SPを自動候補化
AI: 曖昧な数件だけ追加観測
AI: それでも解けない箇所だけ具体的に質問
```

ユーザーが毎回PC/SP一覧を作る運用へ戻さない。
