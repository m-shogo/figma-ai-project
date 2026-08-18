<?php
/**
 * Template Name: Standalone LP Fixture
 * Template Post Type: page
 */
declare(strict_types=1);

if (!function_exists('get_field')) {
    wp_die(esc_html__('ACF PRO is required for this runtime fixture.', 'standalone-lp-sample'), '', ['response' => 500]);
}

$hero_title = (string) (get_field('lp_hero_title') ?: '');
$hero_body = (string) (get_field('lp_hero_body') ?: '');
$hero_cta = standalone_lp_normalize_link(get_field('lp_hero_cta'));
$cards = get_field('lp_cards');
$cards = is_array($cards) ? $cards : [];
$fixture_id = (string) get_option('standalone_lp_fixture_id', 'unknown');
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class('standalone-lp'); ?>>
<?php wp_body_open(); ?>
<main class="lp" data-fixture-id="<?php echo esc_attr($fixture_id); ?>">
    <section class="lp-hero" aria-labelledby="lp-hero-title">
        <div class="lp-shell lp-hero__inner">
            <p class="lp-eyebrow">WORDPRESS × ACF PRO</p>
            <h1 id="lp-hero-title" class="lp-hero__title" data-qa-readable><?php echo esc_html($hero_title); ?></h1>
            <?php if ($hero_body !== '') : ?>
                <p class="lp-hero__body" data-qa-readable><?php echo nl2br(esc_html($hero_body)); ?></p>
            <?php endif; ?>
            <?php if ($hero_cta) : ?>
                <a class="lp-button" href="<?php echo esc_url($hero_cta['url']); ?>" target="<?php echo esc_attr($hero_cta['target']); ?>"<?php echo $hero_cta['target'] === '_blank' ? ' rel="noopener noreferrer"' : ''; ?>>
                    <?php echo esc_html($hero_cta['title']); ?>
                </a>
            <?php endif; ?>
        </div>
    </section>

    <section id="cards" class="lp-cards" aria-labelledby="lp-cards-title">
        <div class="lp-shell">
            <div class="lp-section-heading">
                <p class="lp-eyebrow">CMS MUTATION TARGET</p>
                <h2 id="lp-cards-title">Editable cards</h2>
            </div>
            <div class="lp-card-grid" data-card-count="<?php echo esc_attr((string) count($cards)); ?>">
                <?php foreach ($cards as $index => $card) :
                    $card_title = (string) ($card['card_title'] ?? '');
                    $card_body = (string) ($card['card_body'] ?? '');
                    $image_id = isset($card['card_image']) ? (int) $card['card_image'] : 0;
                    $card_link = standalone_lp_normalize_link($card['card_link'] ?? null);
                ?>
                    <article class="lp-card" data-card-index="<?php echo esc_attr((string) $index); ?>">
                        <div class="lp-card__media">
                            <?php if ($image_id > 0) : ?>
                                <?php echo wp_get_attachment_image($image_id, 'large', false, ['class' => 'lp-card__image', 'loading' => 'lazy']); ?>
                            <?php else : ?>
                                <div class="lp-card__placeholder" role="img" aria-label="No image"></div>
                            <?php endif; ?>
                        </div>
                        <div class="lp-card__body">
                            <h3 data-qa-readable><?php echo esc_html($card_title); ?></h3>
                            <?php if ($card_body !== '') : ?>
                                <p data-qa-readable><?php echo nl2br(esc_html($card_body)); ?></p>
                            <?php endif; ?>
                            <?php if ($card_link) : ?>
                                <a class="lp-card__link" href="<?php echo esc_url($card_link['url']); ?>" target="<?php echo esc_attr($card_link['target']); ?>"<?php echo $card_link['target'] === '_blank' ? ' rel="noopener noreferrer"' : ''; ?>>
                                    <?php echo esc_html($card_link['title']); ?>
                                </a>
                            <?php endif; ?>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>
            <?php if (!$cards) : ?>
                <p class="lp-empty" data-qa-readable>No cards are currently configured.</p>
            <?php endif; ?>
        </div>
    </section>
</main>
<?php wp_footer(); ?>
</body>
</html>
