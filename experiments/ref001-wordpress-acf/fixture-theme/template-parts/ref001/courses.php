<?php
/**
 * REF-001 Courses — learning First Pass.
 *
 * Figma strategy: HYBRID.
 * CMS contract: seven fixed institutional course identities. Page ACF owns
 * description/recommendation copy only. Identity, order, color and exact Figma
 * pictogram source remain code/domain-owned so the eventual target theme can
 * replace this fixture with a shared Course model without migrating page content.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$course_contract = array(
	array(
		'key' => 'public_service',
		'title' => '公務員コース',
		'color' => '#fabf12',
		'figma_icon_node' => '21378:7722',
		'description' => '国家公務員、地方公務員、公安職、公益法人などを目指すコース',
		'recommendations' => array(
			'経済や地域の課題を解決し、安心して暮らせる街をつくりたい人',
			'試験対策だけでなく実務で役立つ生きた経済の知識を身につけたい人',
		),
	),
	array(
		'key' => 'accounting',
		'title' => '会計コース',
		'color' => '#f29800',
		'figma_icon_node' => '21378:7683',
		'description' => '税理士、公認会計士、その他経理部門などを目指すコース',
		'recommendations' => array(
			'企業の「お金」のプロとして、専門資格を在学中に武器にしたい人',
			'数字の強さを活かして、企業の経営を裏から支えたい人',
		),
	),
	array(
		'key' => 'business_management',
		'title' => 'ビジネス経営コース',
		'color' => '#ed6c4e',
		'figma_icon_node' => '21378:7655',
		'description' => 'ビジネスパーソン、ビジネスリーダーを目指すコース',
		'recommendations' => array(
			'自由なアイデアを形にして、起業やヒット商品開発に挑戦したい人',
			'リーダーシップや、実践的なマーケティングを学びたい人',
		),
	),
	array(
		'key' => 'finance',
		'title' => '金融コース',
		'color' => '#df4473',
		'figma_icon_node' => '21378:7623',
		'description' => '銀行業界、証券業界などを目指すコース',
		'recommendations' => array(
			'経済の仕組みを深く学び、人や企業の夢を「融資」で応援したい人',
			'地元・千葉をはじめとする地域経済の活性化に貢献したい人',
		),
	),
	array(
		'key' => 'teaching',
		'title' => '教職コース',
		'color' => '#00a5e3',
		'figma_icon_node' => '21378:7594',
		'description' => '中学（社会）・高校（公民）の免許取得、教員を目指すコース',
		'recommendations' => array(
			'「社会や経済の面白さ」をわかりやすく伝えられる先生になりたい人',
			'教職課程と経済の専門知識を両立させた視野を持つ教育者を目指す人',
		),
	),
	array(
		'key' => 'curator',
		'title' => '学芸員コース',
		'color' => '#28b6aa',
		'figma_icon_node' => '21378:7565',
		'figma_sp_icon_node' => '21376:4587',
		'responsive_icon_status' => 'FIGMA_SOURCE_ANOMALY',
		'description' => '学芸員資格の取得、関連する仕事を目指すコース',
		'recommendations' => array(
			'歴史や文化の魅力を、展示や企画を通して多くの人に伝えたい人',
			'経済の視点も持ち合わせた「文化の専門家」を目指したい人',
		),
	),
	array(
		'key' => 'it',
		'title' => 'ITコース',
		'color' => '#8cc66c',
		'figma_icon_node' => '21378:7533',
		'description' => 'ITスキルを駆使するビジネスパーソンを目指すコース',
		'recommendations' => array(
			'プログラミングだけでなく、AIやデータでビジネスを変革したい人',
			'ITの最先端技術×経済の知識で、DX時代に最適な人材になりたい人',
		),
	),
);

$courses = array();
foreach ( $course_contract as $course ) {
	$field_prefix = 'course_' . $course['key'];
	$icon_asset = 'assets/images/courses/' . str_replace( '_', '-', $course['key'] ) . '.svg';
	$icon_asset_sp = 'curator' === $course['key'] ? 'assets/images/courses/teaching.svg' : $icon_asset;
	$courses[] = array(
		'key' => $course['key'],
		'title' => $course['title'],
		'color' => $course['color'],
		'figma_icon_node' => $course['figma_icon_node'],
		'figma_sp_icon_node' => isset( $course['figma_sp_icon_node'] ) ? $course['figma_sp_icon_node'] : '',
		'responsive_icon_status' => isset( $course['responsive_icon_status'] ) ? $course['responsive_icon_status'] : 'SAME_VECTOR_RESIZED',
		'icon_asset' => $icon_asset,
		'icon_asset_sp' => $icon_asset_sp,
		'description' => ref001_get_field( $field_prefix . '_description', $course['description'] ),
		'recommendations' => array(
			ref001_get_field( $field_prefix . '_recommendation_1', $course['recommendations'][0] ),
			ref001_get_field( $field_prefix . '_recommendation_2', $course['recommendations'][1] ),
		),
	);
}
?>
<section class="ref001-courses" aria-labelledby="ref001-courses-title" data-figma-pc="21378:7505" data-figma-sp="21376:4403">
	<header class="ref001-courses__header">
		<p class="ref001-courses__kicker"># COURCES</p>
		<h2 id="ref001-courses-title" class="ref001-courses__title">
			<span class="ref001-courses__paren" aria-hidden="true">（</span>
			<span>未来につながる<strong>７つのコース</strong></span>
			<span class="ref001-courses__paren" aria-hidden="true">）</span>
		</h2>
	</header>

	<ol class="ref001-courses__grid">
		<?php foreach ( $courses as $course ) : ?>
			<li
				class="ref001-courses__item"
				style="--ref001-course-color: <?php echo esc_attr( $course['color'] ); ?>;"
				data-course-key="<?php echo esc_attr( $course['key'] ); ?>"
				data-responsive-icon-status="<?php echo esc_attr( $course['responsive_icon_status'] ); ?>"
			>
				<article class="ref001-course-card">
					<div class="ref001-course-card__identity">
						<div
							class="ref001-course-card__icon"
							data-figma-icon-node="<?php echo esc_attr( $course['figma_icon_node'] ); ?>"
							<?php if ( $course['figma_sp_icon_node'] ) : ?>data-figma-sp-icon-node="<?php echo esc_attr( $course['figma_sp_icon_node'] ); ?>"<?php endif; ?>
						>
							<picture>
								<source media="(max-width: 600px)" srcset="<?php echo esc_url( get_theme_file_uri( $course['icon_asset_sp'] ) ); ?>">
								<img
									src="<?php echo esc_url( get_theme_file_uri( $course['icon_asset'] ) ); ?>"
									alt=""
									loading="lazy"
									decoding="async"
								>
							</picture>
						</div>
						<div class="ref001-course-card__heading">
							<h3><?php echo esc_html( $course['title'] ); ?></h3>
							<span class="ref001-course-card__marker" aria-hidden="true"></span>
						</div>
					</div>

					<p class="ref001-course-card__description"><?php echo esc_html( $course['description'] ); ?></p>

					<div class="ref001-course-card__recommendations">
						<p class="ref001-course-card__recommend-label">こんな人にオススメ！</p>
						<ul>
							<?php foreach ( $course['recommendations'] as $recommendation ) : ?>
								<li><?php echo esc_html( $recommendation ); ?></li>
							<?php endforeach; ?>
						</ul>
					</div>
				</article>
			</li>
		<?php endforeach; ?>
	</ol>
</section>
