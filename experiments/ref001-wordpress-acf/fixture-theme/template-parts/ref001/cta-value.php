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

$ref001_load_cta_value_fixture = static function ( $file_name ) {
	$path = dirname( __DIR__, 2 ) . '/assets/images/visual-qa/cta-value/' . $file_name;
	if ( ! is_readable( $path ) ) {
		return '';
	}

	return (string) preg_replace( '/\s+/', '', (string) file_get_contents( $path ) );
};

$cta_value_people = array(
	'left' => array(
		'pc'      => $ref001_load_cta_value_fixture( 'pc-left.b64' ),
		'sp'      => $ref001_load_cta_value_fixture( 'sp-left.b64' ),
		'pc_node' => '21378:7489',
		'sp_node' => '21376:4958',
		'hash'    => '6b082e6c3630c06394f659125e8ab1a5dfedb588',
	),
	'right' => array(
		'pc'      => $ref001_load_cta_value_fixture( 'pc-right.b64' ),
		'sp'      => $ref001_load_cta_value_fixture( 'sp-right.b64' ),
		'pc_node' => '21378:7485',
		'sp_node' => '21376:4962',
		'hash'    => '9f70f5f08727bc3367f4fe1f3ed848d7c82c41ba',
	),
);
?>
<section
	class="ref001-cta-value"
	aria-labelledby="ref001-cta-value-title"
	data-figma-pc="21378:7481"
	data-figma-sp="21376:4942"
	data-interaction-status="deferred"
>
	<div class="ref001-cta-value__frame">
		<?php foreach ( $cta_value_people as $side => $person ) : ?>
			<?php
			$person_style = '';
			if ( $person['pc'] && $person['sp'] ) {
				$person_style = sprintf(
					'--ref001-person-pc:url(data:image/png;base64,%1$s);--ref001-person-sp:url(data:image/png;base64,%2$s);',
					$person['pc'],
					$person['sp']
				);
			}
			?>
			<div
				class="ref001-cta-value__person ref001-cta-value__person--<?php echo esc_attr( $side ); ?>"
				aria-hidden="true"
				data-asset-status="deferred"
				data-figma-image-hash="<?php echo esc_attr( $person['hash'] ); ?>"
				data-figma-composite-pc="<?php echo esc_attr( $person['pc_node'] ); ?>"
				data-figma-composite-sp="<?php echo esc_attr( $person['sp_node'] ); ?>"
				<?php if ( $person_style ) : ?>style="<?php echo esc_attr( $person_style ); ?>"<?php endif; ?>
			></div>
		<?php endforeach; ?>

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
