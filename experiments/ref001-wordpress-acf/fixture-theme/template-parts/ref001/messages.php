<?php
/**
 * REF-001 Messages — current supplied item only.
 *
 * Figma visually indicates 1 / 4 but supplies only one message record in the
 * inspected section. No additional records or slider behavior are invented.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$messages_composite_root  = dirname( __DIR__, 2 ) . '/assets/images/visual-qa/messages/';
$messages_composite_parts = array(
	'messages-mask-group.part01.b64',
	'messages-mask-group.part02.b64',
	'messages-mask-group.part03.b64',
	'messages-mask-group.part04.b64',
	'messages-mask-group.part05.b64',
	'messages-mask-group.part06.b64',
	'messages-mask-group.part07.b64',
);
$messages_composite_b64 = '';
foreach ( $messages_composite_parts as $messages_composite_part ) {
	$messages_composite_path = $messages_composite_root . $messages_composite_part;
	if ( ! is_readable( $messages_composite_path ) ) {
		$messages_composite_b64 = '';
		break;
	}
	$messages_composite_b64 .= preg_replace( '/\s+/', '', (string) file_get_contents( $messages_composite_path ) );
}
?>
<section
	class="ref001-messages"
	aria-labelledby="ref001-messages-title"
	data-figma-pc="21378:7746"
	data-figma-sp="21376:4629"
	data-current-item="1"
	data-visible-total="4"
	data-supplied-item-count="1"
	data-interaction-status="deferred"
>
	<div class="ref001-messages__copy">
		<header class="ref001-messages__header">
			<p class="ref001-messages__kicker"># MESSAGES</p>
			<h2 id="ref001-messages-title">力をつけ活躍する<strong>先輩たち</strong></h2>
		</header>

		<div
			class="ref001-messages__headline"
			aria-label="大学で培った企画力を武器に、今はIT企業のマーケターとして挑戦の毎日です！"
		>
			<span class="ref001-messages__headline-line ref001-messages__headline-line--first" aria-hidden="true">大学で培った企画力を武器に、</span>
			<span class="ref001-messages__headline-line ref001-messages__headline-line--pc" aria-hidden="true">今はIT企業のマーケターとして挑戦の毎日です！</span>
			<span class="ref001-messages__headline-line ref001-messages__headline-line--sp ref001-messages__headline-line--second" aria-hidden="true">今はIT企業のマーケターとして</span>
			<span class="ref001-messages__headline-line ref001-messages__headline-line--sp ref001-messages__headline-line--third" aria-hidden="true">挑戦の毎日です！</span>
		</div>

		<p class="ref001-messages__profile">経営学科ビジネス経営コース3年 Tさん<br>千葉県立生浜高等学校出身</p>

		<div class="ref001-messages__indicator" aria-label="1 / 4" data-slider-status="deferred">
			<span class="ref001-messages__arrow ref001-messages__arrow--prev" aria-hidden="true">←</span>
			<span class="ref001-messages__current">1</span>
			<span class="ref001-messages__progress" aria-hidden="true"><i></i></span>
			<span class="ref001-messages__total">4</span>
			<span class="ref001-messages__arrow ref001-messages__arrow--next" aria-hidden="true">→</span>
		</div>
	</div>

	<div
		class="ref001-messages__image"
		data-asset-status="deferred"
		data-figma-image-hash="0cd34d406c04a31f4a32bc2628d184f80db47fad"
		data-figma-composite-node="21378:7760"
		<?php if ( $messages_composite_b64 ) : ?>style="background-image:url(data:image/jpeg;base64,<?php echo esc_attr( $messages_composite_b64 ); ?>)"<?php endif; ?>
		aria-hidden="true"
	></div>
</section>
