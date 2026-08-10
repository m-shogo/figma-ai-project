# Section Integration Ladder

## Intent

Section-firstは「各Sectionを別々に完成させて最後に一発結合」ではない。

Production QAを3層に分ける。

```text
1. SECTION
2. BOUNDARY / CLUSTER
3. PAGE
```

---

# 1. Section Implementation Unit

Sectionはplatform-nativeな独立unitへする。

Examples:

### React / Next

```text
sections/Hero/Hero.tsx
sections/Hero/Hero.module.css
```

### WordPress classic

```text
template-parts/sections/hero.php
assets/css/sections/hero.css
assets/js/sections/hero.js
```

### ACF Blocks / block architecture

```text
blocks/hero/block.json
blocks/hero/render.php
blocks/hero/style.css
```

つまり「include file」を概念として固定するのではなく、**Section Implementation Unit**を抽象契約にする。

Company/existing architectureがPHP include/template partならinclude方式を使う。

---

# 2. SECTION capture

各SectionのFIRST_PASSを保存する。

原則page shell/context内でcaptureする。

```text
S01 Header
S02 Hero
S03 Content01
...
```

Evidence:

- PC
- SP
- specified states
- relevant breakpoint boundary

Section単体で:

- geometry
- typography
- image crop
- local interaction
- local responsive behavior

を検証する。

---

# 3. BOUNDARY capture

Section統合で最も壊れやすいのは**Section境界**。

Default:

```text
B01 = S01 + S02
B02 = S02 + S03
B03 = S03 + S04
...
```

を見る。

Check:

- previous section bottom spacing
- next section top spacing
- background transition
- full-bleed/container切替
- overlapping decoration
- z-index
- sticky/fixed behavior
- heading rhythm
- anchor/scroll offset

これによりfull-pageでズレを見つけた後に原因Sectionを探すコストを減らす。

---

# 4. Integration clusters

Adjacent pairだけでは足りないinteractionはcluster化する。

Examples:

```text
Header + MegaNav + Hero
Hero + floating CTA + Content01
Slider + following pagination/caption section
Sticky story sections S03-S06
```

Section Manifestの`integration_coupling`を利用する。

HIGH couplingは独立完成扱いせず、cluster captureを必須にする。

---

# 5. Cumulative include capture

User-proposed:

```text
S01
S01+S02
S01+S02+S03
...
```

も有効だが、default必須にはしない。

理由:

- ページが長いほどcapture/compare costが増える
- boundary failureの原因が見えにくい
- adjacent pairで十分検出できるケースが多い

Use when:

- cumulative vertical rhythmが重要
- sticky positionが上流section高さに依存
- scroll animationがpage progress依存
- full-page cumulative errorを早期検出したい

つまり:

```text
Section screenshot = REQUIRED
Adjacent boundary screenshot = REQUIRED
High-coupling cluster = REQUIRED when applicable
Cumulative prefix screenshot = CONDITIONAL
Full page screenshot = REQUIRED
```

---

# 6. PAGE capture

全Section統合後は必ずfull pageで確認する。

Checks:

- section order
- accumulated spacing
- global container alignment
- page background continuity
- fixed/sticky layers
- z-index
- header/footer interaction
- global overflow
- anchor navigation
- smooth scroll offset
- page-level animation
- PC/SP and breakpoint continuity

Section単体scoreだけで完成扱いしない。

---

# 7. Screenshot naming

Candidate:

```text
evidence/
  sections/
    S01-header/
      pc-first-pass.png
      sp-first-pass.png
  boundaries/
    B01-S01-S02/
      pc-first-pass.png
      sp-first-pass.png
  clusters/
    C01-header-hero/
      pc-first-pass.png
  page/
    pc-first-pass.png
    sp-first-pass.png
    pc-final.png
    sp-final.png
```

Exact namingはexperiment/bootstrap automationへ将来接続する。

---

# 8. Integration responsibility

Section worker:

- owns Section output
- owns local FIRST_PASS
- reports dependency/boundary risk

Coordinator:

- owns root composition/include order
- owns Boundary/Cluster/Page capture
- owns shared spacing/background/z-index conflicts
- does not hide integration repair inside Section score

---

# 9. Why this is better than only full-page diff

Full-page only:

```text
Mismatch found
→ where did it begin?
→ which section owns it?
→ shared or local?
```

Boundary ladder:

```text
S02 PASS
S03 PASS
B02 FAIL
→ integration boundary cause
```

Failure attributionが明確になる。

---

# 10. Planned automation

Real reference runsで価値が確認できたら:

- Section ManifestからBoundary IDs自動生成
- required capture matrix生成
- section/boundary/page contact sheet
- visual diff
- AI mismatch classification

へ繋げる。

DashboardではSection → Boundary → Pageを同じEvidence Treeとして表示する。
