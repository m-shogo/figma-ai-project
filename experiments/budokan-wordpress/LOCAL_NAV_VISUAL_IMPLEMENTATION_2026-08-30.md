# Local Navigation visual implementation — 2026-08-30

## Scope

This pass implements the closed-state visual layer for the existing `sidebar-nav` Local Navigation family without creating a second renderer or inventing production menu data.

Authoritative Figma nodes:

- SP: `560:632`
- PC: `1216:6311`

Existing Theme owner path:

`template-oneColumnLocalNav.php` → `get_sidebar()` → `sidebar.php` → `sidebar-nav` → `Custom_Sidebar_Walker_Nav_Menu`

The walker remains the data/markup owner. It emits both `lnl_*` and shared `mm_*` classes, and the existing `moduleNavToggle()` remains the interaction owner.

## Figma facts used

### SP `560:632`

- gray background `#f2f2f2`
- horizontal padding `20px`
- vertical padding `40px`
- title/selector gap `24px`
- title `16px`
- exact visible title: `武道 振興・普及事業`
- selector `50px` high
- selector prompt `選択してください`
- right control `50px × 50px`

### PC `1216:6311`

- white background with top/bottom separator
- vertical padding `56px`
- title/list gap `48px`
- exact visible title: `指導者研修・指導法研究`
- title `20px`
- four columns
- column gap `20px`
- list horizontal inset `36px`
- child text `14px`
- bullet `5px`, gold
- current child uses gold bottom border and medium weight
- visible children: `全国武道指導者研修会`, `地域社会武道指導者研修会`, `中学校武道授業指導法研究事業`, and literal placeholder `ローカルナビゲーション`

The fourth Figma child is still a literal placeholder. No production label was invented for it.

## Implementation already present

`css/module/local_navigation.css` is mobile-first.

The initial implementation assumed that one depth-0 walker title could serve as the heading at both breakpoints, while the existing `moduleNavToggle()` owns the SP open/closed state. At `min-width:768px` the selector button is hidden and the existing depth-1 list is laid out as four columns.

No Japanese menu item label is used as a CSS selector or PHP condition. Current state continues to come from WordPress menu classes.

## Runtime re-check: hierarchy gate discovered after the first visual pass

A later exact `get_design_context` re-check proved that the SP and PC heading labels are not the same string or the same semantic level:

- SP heading: `武道 振興・普及事業`
- PC heading: `指導者研修・指導法研究`
- PC children: the four entries listed above

That means the previous two-level assumption (`lnl_item-02` heading + `lnl_item-03` four-column children) is **not sufficient evidence for a final responsive PASS**. A coherent WordPress tree may require three levels — broad business family → instructor/research subgroup → page links — but production menu ownership has not yet been supplied, so Theme CSS must not silently promote that inference into a production contract.

The current CSS is therefore retained as an implementation candidate, not declared final. In particular, no label-hiding/pseudo-content workaround is allowed to fake the breakpoint-specific headings.

To make this uncertainty executable instead of conversational, `scripts/seed-budokan-local-nav-qa.php` now creates a **local-only disposable fixture** containing exactly the hierarchy visible across the current Figma nodes:

1. `武道 振興・普及事業`
2. `指導者研修・指導法研究`
3. four children, where the fourth stays the literal Figma placeholder

The fixture is deliberately guarded by `WP_ENVIRONMENT_TYPE=local`, requires the `nipponbudokan` Theme, assigns only a QA page to `templates/template-oneColumnLocalNav.php`, and does not claim to be production menu data.

This fixture gives the next runtime pass a truthful way to inspect the walker depths (`02` / `03` / `04`) and verify whether the SP and PC visuals can be expressed structurally. If that three-level runtime confirms the expected DOM, CSS can then be corrected against it; if it does not, the implementation must remain blocked rather than guessing.

## Important correction found during final review

The first PC draft kept the Local Navigation inside the already-padded `.global_inner` and added another `50px` internal padding. That double-constrained the component and reduced the intended `1160px` Theme content width.

Cause: the Figma component padding was copied locally without first resolving the parent shell's width contract.

Fix: reuse the Theme shell tokens. At PC the Local Navigation breaks out by `--padding-TB` and then uses the same `--padding-TB` internally. This preserves the canonical `--width-base:1160px` content geometry instead of introducing another width system.

Reusable lesson: when a full-width derivative is nested inside a padded master shell, resolve the parent padding/content-box geometry before copying child-frame padding from Figma. Do not compensate with arbitrary extra width or absolute positioning.

## Cascade correction

`local_navigation.css` previously loaded before `module_menu.css`, even though Local Navigation intentionally specializes the shared `mm_*` baseline. That means later generic menu rules could override the Local Navigation variant.

The import now follows `module_menu.css`, allowing the component-specific variant to override the shared baseline without `!important` or specificity escalation.

This is recorded as a project-local finding only. It is not promoted to a higher standard yet.

## Runtime closure of the three-level implementation

A focused GitHub Actions job now executes the disposable WordPress instance and the actual Theme render path for this family. The verified runtime tree is:

`lnl_item-02` broad family → `lnl_item-03` subgroup → four `lnl_item-04` page links.

The PC CSS was corrected to that proven structure: depth `02` remains the SP closed-state heading, while `min-width:768px` promotes the existing depth `03` subgroup to the visible heading and lays out the existing depth `04` children as the four-column row. No content string is used as a selector and no second menu renderer was introduced.

The CI harness exposed three useful failures before reaching green:

1. **Fixture safety guard rejected WP-CLI.** The Apache container had `WP_ENVIRONMENT_TYPE=local`, but the separate CLI service did not inherit it. Fix: pass `WP_ENVIRONMENT_TYPE=local` only to the disposable fixture `eval-file`; do not weaken the fixture's production guard.
2. **`?page_id=N` returned 301 after pretty permalinks were enabled.** This was normal WordPress canonicalization, not a Theme failure. Fix: follow a bounded redirect chain and assert the final response is 200.
3. **The real Theme returned 500 because `header.php` immediately calls the established ACF `get_field()` contract.** The harness had omitted that runtime dependency. Fix: install/activate the public `advanced-custom-fields` plugin in the disposable instance rather than stubbing `get_field()` or changing Theme code.

Reusable lesson: runtime QA must reproduce the component's actual framework/plugin dependency path. When the harness fails, fix missing environment/dependency fidelity first; never relax a production safety guard or distort product code merely to make the test pass.

The structural runtime job now passes. A Chromium pass then checks the authored states directly:

- SP 375px: broad-family heading remains visible, selector remains visible and 50px high, gray background resolves to `rgb(242, 242, 242)`, and the closed wrapper is collapsed.
- PC 1380px: broad-family heading is hidden, `指導者研修・指導法研究` is the visible subgroup heading, depth-02/depth-03 selector buttons are hidden, exactly four depth-04 children occupy one row/four distinct columns, and `地域社会武道指導者研修会` carries the WordPress current-item state.

This closes the **disposable WordPress SP closed-state + PC runtime/browser QA** for the currently authored Figma states. It does not convert the disposable fixture into production menu authority.

## Verification and limits

The closed SP and PC Figma states were re-fetched and the CSS was reviewed against their measured geometry and state treatment.

A disposable headless-browser screenshot probe was attempted in the earlier pass, but Chromium did not complete in that execution container because its headless process stalled on the container runtime/DBus path. This was classified as a harness failure rather than evidence of a Theme failure; no product CSS was changed to accommodate the harness. The later hosted-runner Chromium QA described above now provides executable browser evidence for the authored closed SP and PC states.

The remaining production authority gate is now stated more precisely:

- which real WordPress page(s) are assigned `template-oneColumnLocalNav.php`
- the actual production `sidebar-nav` hierarchy/current-item state
- whether the intended production tree is the three-level structure implied by the current SP/PC Figma headings
- the SP **open-state** contents/visuals, which are not visible in the closed Figma node

Until those are resolved, this work does **not** claim production WordPress runtime visual PASS. The QA fixture proves the structural implementation without writing production content.

## Files intentionally untouched

- `parts.php`
- Form/Formidable files
- ACF schema/contracts
- production menu content
- `sidebar.php`
- `Custom_Sidebar_Walker_Nav_Menu`
- `common.js`
