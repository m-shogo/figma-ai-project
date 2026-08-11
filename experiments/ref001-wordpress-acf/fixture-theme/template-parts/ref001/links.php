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
		'label_top' => '数字で見る',
		'label_main' => '千葉経済大学',
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
					<?php if ( 'numbers' === $card['key'] ) : ?>
						<p class="ref001-links__label ref001-links__label--numbers">
							<span class="ref001-links__numbers-top"><?php echo esc_html( $card['label_top'] ); ?></span>
							<span class="ref001-links__numbers-main"><?php echo esc_html( $card['label_main'] ); ?></span>
						</p>
					<?php elseif ( 'instagram' === $card['key'] ) : ?>
						<p class="ref001-links__label ref001-links__label--instagram">
							<span class="ref001-links__instagram-line">Official</span><span class="ref001-links__instagram-line">Instagram</span>
						</p>
					<?php else : ?>
						<p class="ref001-links__label"><?php echo esc_html( $card['label'] ); ?></p>
					<?php endif; ?>

					<?php if ( ! empty( $card['sub'] ) ) : ?>
						<p class="ref001-links__sub">
							<span class="ref001-links__instagram-icon" aria-hidden="true"></span>
							<span><?php echo esc_html( $card['sub'] ); ?></span>
						</p>
					<?php endif; ?>
					<span class="ref001-links__arrow" aria-hidden="true">→</span>
				</div>
			</li>
		<?php endforeach; ?>
	</ul>
</section>
