# WordPress Target Reconnaissance

## Purpose

Production Figma implementation must follow the **actual target codebase** before choosing theme structure, template ownership, ACF architecture, styling conventions, or global component ownership.

This scanner turns that rule into a read-only first pass:

```bash
python scripts/scan_wordpress_target.py /path/to/target-repository \
  --output /tmp/wordpress-target-recon.json
```

If automation must stop unless exactly one theme candidate is visible:

```bash
python scripts/scan_wordpress_target.py /path/to/target-repository \
  --require-single-theme
```

## What it observes

For each detected theme candidate, the scanner records evidence for:

- WordPress theme header / theme name
- Classic / Block / Hybrid family indicators
- `theme.json`
- PHP template headers
- slug-specialized `page-*.php` files
- block HTML templates
- ACF Local JSON directories/files
- ACF JSON load/save filters
- local field-group registration in PHP
- `get_field()` / `the_field()` usage
- classic or block Header/Footer files
- `get_header()` / `get_footer()` callers
- package scripts and observed style tooling
- CSS / SCSS / Sass / CSS Module file counts and examples

The scanner skips common generated/dependency directories and does not execute target code.

## Important: family is an inference

`CLASSIC_THEME`, `BLOCK_THEME`, and `HYBRID_THEME` are **filesystem/code evidence classifications**, not company authorization.

The output explicitly keeps:

```json
"family_is_inference": true
```

Use it to choose the next inspection path, not to override company/designer rules.

Examples:

- `theme.json` + HTML templates/parts => block-theme evidence
- PHP theme files => classic-theme evidence
- both => hybrid evidence

A real project can have custom architecture around those markers. Inspect before writing.

## Multiple candidates

A full WordPress repository may contain multiple installed themes. The scanner reports:

```text
MULTIPLE_CANDIDATES
```

and does **not** silently select one.

Selection must come from stronger evidence such as:

- connected target deployment/runtime
- company/project documentation
- owner-provided target
- active theme observed through the real WordPress runtime probe

The runtime probe and filesystem scanner are complementary:

```text
scan_wordpress_target.py
  -> repository candidates / code architecture

probe_wordpress_acf_runtime.py
  -> actually booted WordPress / active theme / ACF runtime

intersection
  -> stronger implementation target evidence
```

If they disagree, stop target binding and investigate instead of choosing whichever is convenient.

## Page template handling

A PHP `Template Name` header or a slug-specialized file is evidence that a template exists. It is not proof that REF-001 should use it.

Before binding a Figma page to a production template, verify:

- the intended Page/route
- current template assignment or routing convention
- global Header/Footer ownership
- existing content/CMS ownership
- company constraints

Do not create a new template merely because the research fixture had one.

## ACF handling

The scanner reports observed Local JSON and PHP ACF usage. It does not infer editor cardinality or automatically convert Figma repetition into Repeaters/Flexible Content.

If Local JSON already exists, its directory/filter architecture is stronger implementation evidence than this research repository's learning fixture conventions.

If no ACF evidence is observed, record that as `NONE_OBSERVED`; do not silently conclude that the production project can never use ACF. Runtime/plugin evidence may still exist outside the repository.

## Styling architecture

Observed package dependencies and style files are hints for **following** the target architecture.

For example, a target already using SCSS should normally be implemented through that pipeline rather than introducing CSS Modules because they happen to be a default candidate elsewhere. Conversely, absence of SCSS evidence is not a license to redesign the build system.

## Recommended production preflight

```text
1. Company Policy
2. target repository checkout + exact starting commit
3. scan_wordpress_target.py
4. real runtime probe when available
5. resolve candidate/active theme agreement
6. inspect target Header/Footer/global CTA ownership
7. inspect exact Page/route/template assignment
8. inspect ACF Local JSON / field ownership
9. freeze Implementation Profile
10. only then bind Figma sections to production write paths
```

This preserves the repository precedence:

```text
COMPANY POLICY
-> EXISTING CODEBASE / DESIGN SYSTEM
-> FIGMA IMPLEMENTATION EVIDENCE
-> AGENT INFERENCE
```
