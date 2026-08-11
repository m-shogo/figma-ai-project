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

		<div class="ref001-messages__headline">
			<span>大学で培った企画力を武器に、</span>
			<span>今はIT企業のマーケターとして挑戦の毎日です！</span>
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
		aria-hidden="true"
	></div>
</section>
