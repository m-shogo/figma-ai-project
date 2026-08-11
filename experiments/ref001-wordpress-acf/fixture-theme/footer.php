<?php
/**
 * REF-001 shared Footer visual First Pass.
 *
 * This reproduces the shared Figma Footer component structure only. Production
 * destinations, social URLs, logo asset plumbing, and page-top behavior are
 * deliberately deferred until the final WordPress integration pass.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<footer
	class="ref001-footer"
	data-figma-pc="21378:7457"
	data-figma-sp="21376:4402"
	data-global-ownership-status="deferred"
>
	<div class="ref001-footer__profile">
		<div class="ref001-footer__logo" data-asset-status="deferred" aria-label="千葉経済大学">
			<span class="ref001-footer__logo-mark" aria-hidden="true">CK</span>
			<span class="ref001-footer__logo-copy">
				<strong>千葉経済大学</strong>
				<small>CHIBA KEIZAI</small>
			</span>
		</div>

		<p class="ref001-footer__address">
			〒263-0021<span class="ref001-footer__pc-inline">　</span><br class="ref001-footer__sp-only">
			千葉市稲毛区轟町3-59-5<br>
			Tel.043-253-9111（大代表）<span class="ref001-footer__pc-inline">/</span><br class="ref001-footer__sp-only">
			043-253-5524（入試広報センター）
		</p>
	</div>

	<div class="ref001-footer__external" data-destinations="deferred">
		<div class="ref001-footer__site-links">
			<span>千葉経済大学公式サイト</span>
			<span class="ref001-footer__separator" aria-hidden="true">/</span>
			<span>千葉経済短期大学公式サイト</span>
		</div>

		<div class="ref001-footer__sns" aria-label="公式SNS" data-destinations="deferred">
			<span aria-hidden="true">f</span>
			<span aria-hidden="true">▶</span>
			<span aria-hidden="true">◎</span>
			<span class="ref001-footer__line" aria-hidden="true">LINE</span>
		</div>
	</div>

	<p class="ref001-footer__copyright">Copyright CHIBA KEIZAI UNIVERSITY, All Rights Reserved</p>

	<span class="ref001-footer__pagetop" data-interaction-status="deferred" aria-hidden="true">⌃</span>
</footer>
<?php wp_footer(); ?>
</body>
</html>
