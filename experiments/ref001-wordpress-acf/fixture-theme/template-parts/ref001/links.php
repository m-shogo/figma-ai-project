<?php
/**
 * REF-001 Links — visual-only learning First Pass.
 *
 * Interaction destinations are deliberately deferred. The Figma nodes define
 * the four visual cards but do not prove production URLs or WordPress ownership.
 * Do not add ACF fields or placeholder href values during the visual pass.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$link_cards = array(
	array(
		'key' => 'campus',
		'label' => 'キャンパス紹介',
		'tone' => 'purple',
	),
	array(
		'key' => 'numbers',
		'label' => '数字で見る\n千葉経済大学',
		'tone' => 'orange',
	),
	array(
		'key' => 'instagram',
		'label' => 'Official Instagram',
		'sub' => 'ckckoho',
		'tone' => 'instagram',
	),
	array(
		'key' => 'line',
		'label' => 'LINE登録',
		'tone' => 'line',
	),
);
?>
<section
	class="ref001-links"
	aria-label="関連リンク"
	data-figma-pc="21378:7458"
	data-figma-sp="21376:4919"
	data-interaction-status="deferred"
>
	<ul class="ref001-links__grid">
		<?php foreach ( $link_cards as $card ) : ?>
			<li class="ref001-links__item ref001-links__item--<?php echo esc_attr( $card['tone'] ); ?>" data-destination-status="deferred">
				<div class="ref001-links__shadow" aria-hidden="true"></div>
				<div class="ref001-links__face">
					<p class="ref001-links__label">
						<?php echo nl2br( esc_html( $card['label'] ) ); ?>
					</p>
					<?php if ( ! empty( $card['sub'] ) ) : ?>
						<p class="ref001-links__sub"><span aria-hidden="true">◎</span> <?php echo esc_html( $card['sub'] ); ?></p>
					<?php endif; ?>
					<span class="ref001-links__arrow" aria-hidden="true">→</span>
				</div>
			</li>
		<?php endforeach; ?>
	</ul>
</section>
