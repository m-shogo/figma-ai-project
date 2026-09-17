<?php

/**
 * Disposable Budokan Core Details runtime fixture.
 *
 * QA-only: renders WordPress Core native <details>/<summary> markup through
 * the existing one-column Theme template. It does not create content or ACF
 * ownership outside the disposable local WordPress runtime.
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed Budokan Core Details QA outside a local WordPress environment.');
}

$theme = wp_get_theme();
if ($theme->get_stylesheet() !== 'nipponbudokan') {
    WP_CLI::error('Budokan Core Details fixture requires the nipponbudokan theme.');
}

$slug = 'qa-budokan-core-details-interaction';
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
<!-- wp:group {"className":"qa-core-details-fixture"} -->
<div class="wp-block-group qa-core-details-fixture">
<!-- wp:paragraph --><p>Core Details interaction runtime QA fixture.</p><!-- /wp:paragraph -->

<!-- wp:details {"className":"qa-details-standard"} -->
<details class="wp-block-details qa-details-standard" data-qa-details="standard"><summary>通常アコーディオン</summary><!-- wp:paragraph --><p>展開するとテキスト、写真などが表示されます。幅広いコースやプログラムを提供しています。</p><!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"_qa qa-details-faq"} -->
<details class="wp-block-details _qa qa-details-faq" data-qa-details="faq"><summary>QAアコーディオン タイトルが入ります。</summary><!-- wp:paragraph --><p>展開するとテキスト、写真などが表示されます。日本武道館のFAQ回答サンプルです。</p><!-- /wp:paragraph --></details>
<!-- /wp:details -->
</div>
<!-- /wp:group -->
HTML;

$payload = array(
    'post_type' => 'page',
    'post_status' => 'publish',
    'post_title' => 'Core Details Interaction QA',
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

update_post_meta((int) $page_id, '_wp_page_template', 'default');
update_option('budokan_core_details_qa_page_id', (int) $page_id, false);
flush_rewrite_rules(false);

WP_CLI::success(sprintf('Seeded Budokan Core Details interaction QA page #%d.', (int) $page_id));
