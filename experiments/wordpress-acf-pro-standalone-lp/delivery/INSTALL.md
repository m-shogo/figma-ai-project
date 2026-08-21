# Standalone LP Sample — Delivery Installation Contract

This file is a **validation fixture example**, not a production-theme instruction sheet. Real projects must replace fixture-specific values with verified project facts.

## Requirements

- WordPress/PHP: this fixture validates against WordPress 7.0.2 / PHP 8.3. A production delivery must state its own supported versions.
- ACF PRO: required for this sample because the field model includes a Repeater. ACF PRO plugin files and license credentials are **not included** in the delivery package.
- ACF CLI import in the automated Fresh Delivery Gate requires ACF 6.8+ and WP-CLI 2.0+.

## Install

1. Copy the delivered theme/code and assets into the target WordPress theme location according to that project's theme ownership rules.
2. Install and activate the recipient's licensed ACF PRO copy separately.
3. Import the delivered `acf/acf-export.json` through the approved ACF import path. The fixture gate uses `wp acf json import`.
4. Create or select the target Page and assign the `page-lp.php` Page Template.
5. Enter the required content. For this fixture, `Hero title` is required; the other fields may be empty according to the field map.
6. Publish/update the Page and verify the frontend.

## Verification

The repository Fresh Delivery Gate proves this package on a second clean WordPress database, without copying the development DB and without relying on the sample theme's Local JSON. It then runs the existing Playwright runtime/mutation checks.

Production instructions must additionally document any project-specific deployment, cache, asset, security, or content rules that are actually known. Do not infer them from this fixture.
