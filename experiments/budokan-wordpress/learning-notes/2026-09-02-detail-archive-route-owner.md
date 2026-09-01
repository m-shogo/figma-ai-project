# Budokan detail archive route ownership — 2026-09-02

## What happened

Current Figma detail families repeatedly use the same semantic return action, `一覧へ戻る`, after detail content. The shared visual owner is already `module_pager-02`; this pass did not change its visual contract.

While re-auditing the real `single.php` route behavior, the custom-post return URL was found to be reconstructed from the post type display label:

```php
$post_Type = get_post_type_object(get_post_type())->name;
home_url() . '/' . $post_Type . '/';
```

The Theme registers post type `event` with the Japanese display label `イベント` and `has_archive => true`. A display label is presentation metadata, not a route contract, so this construction can send Event detail users toward `/イベント/` instead of WordPress's canonical Event archive.

## Root cause

The implementation used human-readable metadata as if it were URL ownership. That bypassed the routing API WordPress already owns and created an unnecessary coupling between admin/display naming and frontend URLs.

This is not a Figma mismatch and does not require a new template, ACF field, CPT, rewrite rule, or page-specific CSS.

## Fix

Keep the existing shared detail pager semantics and resolve the destination from WordPress itself:

- normal posts: configured `page_for_posts` permalink, with home as a safe fallback
- custom post types: `get_post_type_archive_link($current_post_type)`, with home as a safe fallback when no archive exists

No visual markup, prev/next behavior, Form/Formidable, `parts.php`, Slider, Calendar, Search, ACF field model, or CPT registration is changed.

## Runtime proof

The existing disposable `budokan-news-single-runtime-qa.sh` path is extended instead of creating another fixture/workflow.

It now proves through real WordPress:

1. News detail still returns HTTP 200 and uses the configured posts page for `一覧へ戻る`.
2. Event detail returns HTTP 200 through the same `single.php`.
3. Event `一覧へ戻る` equals `get_post_type_archive_link('event')`.
4. Existing date markup and absent previous/next states for the News fixture remain intact.
5. Existing browser geometry QA remains News-focused because this change does not modify the shared visual presentation.

## Next-time rule

When WordPress already owns a route, taxonomy URL, archive URL, permalink, or posts page, obtain it from the corresponding WordPress API rather than reconstructing it from labels, translated names, or assumptions about slugs.

Before treating a visible label as a route identifier, distinguish:

- **presentation identity** — label/name shown to humans
- **data identity** — post type/taxonomy key
- **route ownership** — permalink/rewrite/archive API result

These may intentionally differ.

## Generalization scope

This is proven in the Budokan WordPress Theme and is immediately useful as a project-level rule. It is plausible across WordPress projects, but one project/reference is not enough to promote it to ACTIVE/CORE frontend policy. Keep it PROJECT_ONLY until independent evidence confirms the same failure boundary or measurable avoided rework.
