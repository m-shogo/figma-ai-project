<?php
/**
 * REF-001 CTA Value — visual-only learning First Pass.
 *
 * Destinations and CMS ownership are deferred until the final integration pass.
 * Figma annotation says the background grid is a repeated pattern-grid asset;
 * the fixture preserves that as a repeatable CSS layer rather than page content.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<section
	class="ref001-cta-value"
	aria-labelledby="ref001-cta-value-title"
	data-figma-pc="21378:7481"
	data-figma-sp="21376:4942"
	data-interaction-status="deferred"
>
	<div class="ref001-cta-value__frame">
		<div
			class="ref001-cta-value__person ref001-cta-value__person--left"
			aria-hidden="true"
			data-asset-status="deferred"
			data-figma-image-hash="6b082e6c3630c06394f659125e8ab1a5dfedb588"
		></div>
		<div
			class="ref001-cta-value__person ref001-cta-value__person--right"
			aria-hidden="true"
			data-asset-status="deferred"
			data-figma-image-hash="9f70f5f08727bc3367f4fe1f3ed848d7c82c41ba"
		></div>

		<div class="ref001-cta-value__content">
			<h2 id="ref001-cta-value-title" class="ref001-cta-value__title">
				<span aria-hidden="true" class="ref001-cta-value__slash">／</span>
				<span class="ref001-cta-value__title-text">まずは大学を<span class="ref001-cta-value__sp-break"><br></span>体験してみよう！</span>
				<span aria-hidden="true" class="ref001-cta-value__slash">＼</span>
			</h2>

			<div class="ref001-cta-value__actions" data-destinations="deferred">
				<span class="ref001-cta-value__action ref001-cta-value__action--document">
					<span aria-hidden="true">▮▮</span>
					<span>資料請求</span>
				</span>
				<span class="ref001-cta-value__action ref001-cta-value__action--oc">
					<span aria-hidden="true">⚑</span>
					<span>オープンキャンパス</span>
				</span>
			</div>
		</div>
	</div>
</section>
