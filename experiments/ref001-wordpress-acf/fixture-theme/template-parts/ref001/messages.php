<?php
/**
 * REF-001 Messages visual First Pass.
 *
 * Only one real message is supplied by Figma. The visible 1 / 4 state is kept
 * static; no additional records or slider behavior are invented.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$message_image = 'data:image/jpeg;base64,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';
?>
<section class="ref001-messages" data-figma-pc="21378:7746" data-figma-sp="21376:4629" data-interaction-status="deferred">
	<div class="ref001-messages__copy">
		<p class="ref001-middle-kicker"># MESSAGES</p>
		<h2>力をつけ活躍する<strong>先輩たち</strong></h2>
		<div class="ref001-messages__headline">
			<span>大学で培った企画力を武器に、</span>
			<span>今はIT企業のマーケターとして挑戦の毎日です！</span>
		</div>
		<p class="ref001-messages__profile">経営学科ビジネス経営コース3年 Tさん<br>千葉県立生浜高等学校出身</p>
		<div class="ref001-messages__indicator" aria-label="1 / 4">
			<span class="ref001-messages__arrow is-disabled" aria-hidden="true">←</span>
			<span class="ref001-messages__current">1</span>
			<span class="ref001-messages__track"><i></i></span>
			<span class="ref001-messages__total">4</span>
			<span class="ref001-messages__arrow" aria-hidden="true">→</span>
		</div>
	</div>
	<div class="ref001-messages__visual">
		<img src="<?php echo esc_attr( $message_image ); ?>" alt="">
	</div>
</section>
