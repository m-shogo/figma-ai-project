# Frontend Decorative Pattern Cookbook

Status: ACTIVE decision guide / pattern evidence evolves independently

このCookbookは、吹き出し・リボン・波線・スタンプ等をAIが毎回ゼロからCSSで発明することを防ぐための小さい判断表である。

目的は巨大なcomponent libraryを自作することではない。まずFigma / Existing code / exact assetを確認し、最も単純で人間が直しやすい実装方式を選ぶ。

Authorityは `docs/frontend-authority-model.md`、reuse順序は `docs/frontend-reuse-before-build.md` を正本とする。

## 1. Success condition

成功条件は「CSSだけで作れた」ではない。

```text
Figma visual truthを守る
+ editable contentを守る
+ responsiveで壊れにくい
+ canonical ownerが分かる
+ 人間が最後の微調整をしやすい
```

「CSSで作れるか」ではなく「CSSで作る価値があるか」で判断する。

## 2. Preflight: 5方式を比較する

装飾を実装する前に、最低でも次を候補にする。

| Mode | 向いているもの | 主な利点 | 主なリスク |
| --- | --- | --- | --- |
| CSS | 単純な線・角丸・円・三角・規則的な装飾 | responsive/editable、asset不要 | 不規則形状を無理に再現するとpatch化 |
| CSS + SVG | live textを含む複雑な枠・tail・outline | contentとshapeの責務を分離できる | SVG sizing/viewBoxとCSS ownerの整合が必要 |
| SVG | 不規則vector、icon、logo、複雑な線 | exact sourceを保ちやすい | textまで焼くと編集性を失う場合がある |
| PNG/WebP | 水彩、紙、noise、brush、複雑texture | raster表現を忠実に保てる | 解像度、crop、容量、art direction |
| Figma export/rendered asset | Figmaに完成形の正しいsourceがある装飾 | 描き直し誤差を避けられる | source provenance / export更新手順が必要 |

既存production asset、Figma exact vector/export、既存Design System assetがある場合は、新規描画より先に確認する。

## 3. Complexity Escape Rule

CSS案が次の方向へ進み始めたら、CSS + SVG / SVG / rasterへ戻って比較する。

- pseudo-elementが複数必要
- 複雑な `clip-path` / maskをCSSだけで再構築する
- x/y補正用transformが増える
- negative marginがshape補正のために増える
- breakpointごとに形状そのものを修正する
- `top/left/translate` の微調整patchが連鎖する
- Figmaにexact vector / export assetが既にあるのに近似形を描いている

これはproperty-banではない。Hero artwork等で複数absoluteが自然なら普通に使う。問題は、選んだmechanismがFigmaの表現方式と保守コストに対して不自然になっているかである。

## 4. Responsibility split

Default candidate:

```text
HTML = meaning / editable text / control
CSS = layout / spacing / responsive / color / ordinary state
SVG = irregular vector shape / outline / tail / decorative geometry
PNG/WebP = texture / watercolor / paper / noise / photographic raster
```

SVG内へ文言を焼き込む場合は、Figma visual truth上それ自体がartworkであり、編集可能contentとして扱う必要がないことを確認する。

## 5. Pattern evidence table

最初から全patternを実装library化しない。実案件evidenceが得られたものだけ詳細化する。

| Pattern | First choice candidates | Current evidence | Lifecycle |
| --- | --- | --- | --- |
| Speech Bubble / irregular comment frame | CSS + exact SVG / SVG | REF-001 Student Voiceでlive text + exact SVG outlineを観測 | OBSERVATION (E1) |
| Exact icon / logo / irregular vector | Existing SVG / Figma exact export | REF-001 assetsと既存reuse policyで複数観測 | ACTIVE principle; assetごとの確認は必要 |
| Simple badge / pill / rectangular label | CSS | 一般原則のみ | UNPROMOTED |
| Ribbon | CSS / CSS+SVG / SVG | 案件evidence待ち | UNPROMOTED |
| Marker / underline | CSS / SVG / raster | 案件evidence待ち | UNPROMOTED |
| Wave / wavy line | SVG / CSS where genuinely simple | 案件evidence待ち | UNPROMOTED |
| Stamp | SVG / raster | 案件evidence待ち | UNPROMOTED |
| Sparkle | existing SVG / CSS when primitive | 案件evidence待ち | UNPROMOTED |
| Blob / irregular border | SVG / raster / CSS when simple | 案件evidence待ち | UNPROMOTED |
| Halftone / paper / brush texture | PNG/WebP | 案件evidence待ち | UNPROMOTED |
| Zig-zag / pointy box | CSS / CSS+SVG / SVG | 案件evidence待ち | UNPROMOTED |
| Hand-drawn frame | SVG / raster | 案件evidence待ち | UNPROMOTED |

`UNPROMOTED` は「使ってはいけない」ではなく、共通Good Patternとして証明されていないという意味。

## 6. REF-001 observation: Speech Bubble

2026-08-20にFigma node `21378:7766`（Student Voice）をstructured design contextで再確認した。

観測:

- 吹き出し/commentの不規則outlineはFigma側のSVG assetとして存在する
- title/body copyはlive textであり、shapeへ焼き込まれていない
- portrait/course artworkもmask/vector + rasterの組み合わせを持つ
- したがって「HTML text + CSS layout + exact SVG outline」はFigma evidenceと整合する有力方式

この1件だけでSpeech Bubbleを永久ACTIVE ruleへ昇格しない。次のclean replayまたは別案件でHuman correction/reworkが減るかを確認してからCANDIDATE化を検討する。

Failure example:

```text
Figmaにexact SVG outlineがある
→ AIが白背景 + border + ::before/::after + transformで近似
→ tail/line位置をbreakpointごとにpatch
→ さらにshadow/offsetで見た目を合わせる
```

これは「pseudo-element禁止」ではなく、source reuseを見落としたWrong implementation strategyの疑いが強い。

## 7. Responsive behavior checklist

装飾ごとに確認する。

- shapeはcontent height変化へ追従すべきか
- aspect ratio固定か、stretch可能か
- border/line thicknessはscaleさせるか固定か
- PC/SPで同じartworkか、real art directionで別sourceか
- crop / contain / cover / maskのどれがvisual truthか
- text wrappingが増えてもshapeと重ならないか
- intermediate widthでtail/arrow/ornamentが本文を塞がないか

SP/PCの見た目が違うだけで別DOMを作らない。source/structure/artworkが本当に違う時だけ分離する。

## 8. Human Repairability gate

FINAL前に最低限確認する。

- 文言変更にSVG編集が不要か（artwork textを除く）
- asset差し替えownerが分かるか
- shapeの位置/sizeを直すcanonical ownerが1箇所で分かるか
- breakpointごとのpatch archaeologyが残っていないか
- exact assetのprovenanceまたはsource nodeを追えるか
- SVG最適化後もviewBox / mask / clip / defs / stroke / accessibilityが壊れていないか

## 9. Promotion rule

```text
Observation
→ 同じdecisionをclean replay
→ before/afterとHuman Correction Costを記録
→ CANDIDATE
→ 別reference / 別案件で再現
→ ACTIVE
```

一度の失敗から `absolute禁止`、`pseudo-element禁止`、`CSS吹き出し禁止` のような永久banを作らない。

## 10. Backlog, not library

次のpatternは案件で出た時に調査する。

Speech Bubble / Ribbon / Marker / Wave / Wavy line / Stamp / Sparkle / Blob / Irregular Border / Halftone / Zig-Zag / Pointy Box / Hand-drawn Frame / Underline / Badge

案件evidenceが無いものを先回りして大量実装しない。