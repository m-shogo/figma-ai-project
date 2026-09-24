<?php

/**
 * Disposable Budokan normal-page content interaction fixture.
 *
 * QA-only: renders existing Gutenberg button/link families through the current
 * one-column Theme template. It creates no durable content or ACF ownership and
 * refuses to run outside the disposable local WordPress runtime.
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed Budokan content interaction QA outside a local WordPress environment.');
}

$theme = wp_get_theme();
if ($theme->get_stylesheet() !== 'nipponbudokan') {
    WP_CLI::error('Budokan content interaction fixture requires the nipponbudokan theme.');
}

$slug = 'qa-budokan-content-interaction';
$existing = get_posts(array(
    'post_type' => 'page',
    'post_status' => 'any',
    'name' => $slug,
    'posts_per_page' => 1,
    'orderby' => 'ID',
    'order' => 'ASC',
    'no_found_rows' => true,
));

$content = <<<'HTML'
<!-- wp:group {"className":"qa-content-interaction-fixture"} -->
<div class="wp-block-group qa-content-interaction-fixture">
<!-- wp:paragraph --><p>Normal-page CTA / inline-link interaction runtime QA fixture.</p><!-- /wp:paragraph -->
<!-- wp:spacer {"height":"820px"} --><div style="height:820px" aria-hidden="true" class="wp-block-spacer"></div><!-- /wp:spacer -->

<!-- wp:buttons -->
<div class="wp-block-buttons">
<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#qa-anchor-target" data-qa-control="default">標準ボタン</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->

<!-- wp:buttons {"className":"cta"} -->
<div class="wp-block-buttons cta">
<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#qa-anchor-target" data-qa-control="cta">CTAボタン</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->

<!-- wp:buttons -->
<div class="wp-block-buttons">
<!-- wp:button {"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="#qa-anchor-target" data-qa-control="outline">輪郭ボタン</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-small"} -->
<div class="wp-block-button is-style-small"><a class="wp-block-button__link wp-element-button" href="#qa-anchor-target" data-qa-control="small">小ボタン</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->

<!-- wp:paragraph --><p><a href="#qa-anchor-target" data-qa-control="inline">本文インラインリンク</a></p><!-- /wp:paragraph -->

<!-- wp:spacer {"height":"940px"} --><div style="height:940px" aria-hidden="true" class="wp-block-spacer"></div><!-- /wp:spacer -->
<!-- wp:heading {"anchor":"qa-anchor-target"} --><h2 class="wp-block-heading" id="qa-anchor-target">ページ内リンク到達点</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>アンカー到達後もヘッダー・固定ショートカット・本文が落ち着いていることを確認するための到達点です。</p><!-- /wp:paragraph -->
<!-- wp:spacer {"height":"760px"} --><div style="height:760px" aria-hidden="true" class="wp-block-spacer"></div><!-- /wp:spacer -->
</div>
<!-- /wp:group -->
HTML;

$payload = array(
    'post_type' => 'page',
    'post_status' => 'publish',
    'post_title' => 'Content Interaction QA',
    'post_name' => $slug,
    'post_content' => $content,
);

if ($existing) {
    $payload['ID'] = (int) $existing[0]->ID;
    $page_id = wp_update_post($payload, true);
} else {
    $page_id = wp_insert_post($payload, true);
}

if (is_wp_error($page_id)) {
    WP_CLI::error($page_id->get_error_message());
}

update_post_meta((int) $page_id, '_wp_page_template', 'templates/template-oneColumn.php');
update_option('budokan_content_interaction_qa_page_id', (int) $page_id, false);
flush_rewrite_rules(false);

WP_CLI::success(sprintf('Seeded Budokan content interaction QA page #%d.', (int) $page_id));
