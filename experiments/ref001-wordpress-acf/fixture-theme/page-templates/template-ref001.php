<?php
/**
 * Template Name: REF-001 Learning Fixture
 * Template Post Type: page
 *
 * Learning-only fixed Page template for the REF-001 Figma → WordPress + ACF
 * experiment. Production theme conventions must replace this fixture later.
 *
 * VISUAL FIRST: Figma-derived fixture values render before ACF admin entry.
 * ACF values later override content without changing the section DOM/CSS.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>
<main
	id="primary"
	class="ref001-page"
	data-reference-id="REF-001-CHIBA-KEIZAI-SAMPLE"
	data-fixture-completeness="partial"
>
	<?php get_template_part( 'template-parts/ref001/main-visual' ); ?>
	<?php get_template_part( 'template-parts/ref001/reason' ); ?>
	<?php get_template_part( 'template-parts/ref001/education' ); ?>

	<?php /* Student Voice / Messages / intervening CTA visuals are the next visual-first wave. */ ?>

	<?php get_template_part( 'template-parts/ref001/courses' ); ?>
</main>
<?php
get_footer();
