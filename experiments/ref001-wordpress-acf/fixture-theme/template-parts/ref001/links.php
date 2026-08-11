<?php
/** REF-001 links — Figma visual fixture, no ACF dependency. */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$links = array(
	array( 'class' => 'campus', 'title' => 'キャンパス紹介', 'meta' => '' ),
	array( 'class' => 'numbers', 'title' => '千葉経済大学', 'meta' => '数字で見る' ),
	array( 'class' => 'instagram', 'title' => 'Official Instagram', 'meta' => '◎ ckckoho' ),
	array( 'class' => 'line', 'title' => 'LINE登録', 'meta' => '' ),
);
?>
<nav class="ref001-links" aria-label="関連リンク" data-figma-pc="21378:7458" data-figma-sp="21376:4919">
	<?php foreach ( $links as $item ) : ?>
		<a class="ref001-link-circle ref001-link-circle--<?php echo esc_attr( $item['class'] ); ?>" href="#">
			<span class="ref001-link-circle__face">
				<?php if ( $item['meta'] ) : ?>
					<span class="ref001-link-circle__meta"><?php echo esc_html( $item['meta'] ); ?></span>
				<?php endif; ?>
				<span class="ref001-link-circle__title"><?php echo esc_html( $item['title'] ); ?></span>
				<span class="ref001-link-circle__arrow" aria-hidden="true">→</span>
			</span>
		</a>
	<?php endforeach; ?>
</nav>
