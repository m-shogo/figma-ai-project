# WordPress + ACF Delivery Standard

WordPress + ACF implementation has **two independent QA boundaries**. Passing one does not imply the other.

This document extends `docs/wordpress-acf-policy.md` and `docs/acf-json-delivery.md`. Existing company/project policy remains authoritative.

## 1. Development Runtime / Admin E2E

The implementation environment proves the field model is actually usable by an editor:

```text
ACF JSON
→ real WordPress
→ licensed ACF PRO active
→ import/sync
→ wp-admin target Page
→ representative fields visible
→ edit
→ real Save / Update
→ reload persistence
→ PHP frontend roundtrip
→ Playwright / Visual QA
```

A direct `update_field()` fixture is useful for deterministic mutation tests, but it does **not** replace this browser-level admin roundtrip.

Repeater/Flexible Content controls are exercised only when the project has a real editor add/remove/reorder requirement. Figma repetition alone never creates that CMS requirement.

## 2. Delivery Reconstruction Gate

The recipient normally receives implementation artifacts for an existing WordPress installation, not a copy of the development site.

The delivery gate therefore starts from a **second fresh WordPress database** and reconstructs the page from artifacts only:

```text
Development Runtime
→ export/stage delivery artifacts
→ destroy/isolate development DB state
→ Fresh WordPress + fresh DB
→ install theme/code + assets
→ activate separately supplied ACF PRO
→ import acf-export.json
→ assign Page Template
→ input deterministic fixture/content
→ frontend PHP render
→ Playwright
```

### Hard failures

The gate must fail when any of these are true:

- the development WordPress database is copied into the fresh runtime;
- the fresh runtime reuses ACF field-group state already stored in the development DB;
- the page works only because Local JSON or another hidden source silently supplied fields while `acf-export.json` was never consumed;
- ACF PRO plugin files or a license secret are included in the delivery package;
- the recipient would have to manually recreate field groups that are claimed as delivered;
- Page Template assignment or required initial values are undocumented and cannot be reconstructed;
- frontend verification is skipped after import.

Local JSON may coexist when the existing project explicitly owns that architecture. For a portable export/import gate, however, the test must prove the declared `acf-export.json` can be consumed independently. A fixture may temporarily exclude Local JSON while testing that claim.

## Delivery artifact classes

The Standard does not force one universal directory layout. A schema-v6 Implementation Profile instead declares paths for the project and covers these concepts:

- `THEME_CODE` — PHP, template parts, functions, CSS and JS as applicable;
- `ASSETS` — images, SVGs and legally/technically deliverable fonts;
- `ACF_EXPORT_JSON` — portable ACF export with stable group/field keys;
- `INSTALL_DOC` — project-specific installation instructions;
- `ACF_FIELD_MAP` — editor-facing field ownership and template mapping.

The default delivery excludes:

- ACF PRO plugin binaries;
- ACF license credentials;
- WordPress database dumps;
- customer runtime state.

## INSTALL.md contract

A project-specific installation document should state only facts that are known for that project. At minimum it resolves or explicitly marks as owner-provided:

1. WordPress and PHP requirements;
2. ACF PRO requirement/version constraint;
3. Theme/code and asset placement;
4. ACF JSON import/sync method;
5. Page Template assignment;
6. required initial values/content setup;
7. frontend verification procedure.

Do not invent a production theme name, hosting rule, license value, plugin version, or CMS behavior to fill the document.

## ACF-FIELD-MAP.md contract

The field map should make human maintenance traceable without mirroring every design value into CMS. Record, as applicable:

- field group/key;
- field name/key;
- field type and image return format;
- owning Page Template/template part;
- whether content is fixed-cardinality or editor-repeatable;
- optional/required behavior;
- important content constraints that are real product/editor requirements.

Stable `group_*` and `field_*` identities are part of delivery compatibility. A key change is a migration, not a visual repair.

## Machine gate

New WordPress + ACF Implementation Profiles use schema version 6 or later and are checked by:

```bash
python scripts/validate_wordpress_acf_delivery.py
```

The validator requires:

- package contract + required artifact classes;
- Admin E2E requirement;
- fresh-install requirement;
- explicit prohibition of DB copy and source ACF DB-state reuse;
- required reconstruction steps;
- for completed runs, PASS evidence for Admin E2E and the fresh-install Playwright flow.

Historical schema-v5-and-earlier experiment profiles remain valid evidence and are not retroactively rewritten.

## Reuse-Before-Build

Use existing project/runtime mechanisms before adding infrastructure:

1. existing project deployment/ACF workflow;
2. official ACF `wp acf json` commands when supported;
3. existing WordPress/WP-CLI disposable runtime;
4. existing Playwright harness;
5. only the smallest project-specific glue still missing.

The repository's standalone WordPress + ACF PRO fixture implements the reusable fresh-reconstruction probe. It intentionally uses a second Compose project/database and a staged theme copy so a hidden development DB dependency becomes observable.
