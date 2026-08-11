<?php
/**
 * REF-001 shared Header visual First Pass.
 *
 * Production CTA destinations and global ownership are deferred until the final
 * WordPress integration pass. SP intentionally reproduces the supplied logo-only state.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'ref001-learning-fixture' ); ?>>
<?php wp_body_open(); ?>
<header
	class="ref001-header"
	data-figma-pc="21378:8066"
	data-figma-sp="21376:4918"
	data-global-ownership-status="deferred"
>
	<div class="ref001-header__logo" aria-label="千葉経済大学">
		<img
			class="ref001-header__logo-mark"
			src="<?php echo esc_url( get_theme_file_uri( 'assets/images/ref001-footer-logo-mark.svg' ) ); ?>"
			alt=""
			width="56"
			height="61"
		>
		<span class="ref001-header__logo-copy">
			<strong>千葉経済大学</strong>
			<small>CHIBA KEIZAI</small>
		</span>
	</div>

	<div class="ref001-header__actions" data-destinations="deferred">
		<span class="ref001-header__action ref001-header__action--document"><span aria-hidden="true">▮▮</span>資料請求</span>
		<span class="ref001-header__action ref001-header__action--oc"><span aria-hidden="true">⚑</span>オープンキャンパス</span>
	</div>
</header>
