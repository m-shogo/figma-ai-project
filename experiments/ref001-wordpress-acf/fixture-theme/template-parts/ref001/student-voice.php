<?php
/**
 * REF-001 Student Voice — supplied visual states only.
 *
 * Figma proves one expanded visual state and two collapsed visual states. It
 * does not prove accordion behavior, so these remain static articles until the
 * final interaction pass.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$classroom_composite_path = dirname( __DIR__, 2 ) . '/assets/images/visual-qa/student-voice/classroom-mask-group.b64';
$classroom_composite_b64  = '';
if ( is_readable( $classroom_composite_path ) ) {
	$classroom_composite_b64 = preg_replace( '/\s+/', '', (string) file_get_contents( $classroom_composite_path ) );
}

$voices = array(
	array(
		'state' => 'open',
		'tone' => 'blue',
		'title' => 'まだやりたいことが決まっていなくても大丈夫だった。',
		'profile' => '経営学部ITコース3年  Mさん',
		'school' => '千葉県立生浜高等学校出身',
		'portrait_hash' => '7a0569464ece1a5ffe4e6c5a1e50fb4b5efaac0c',
		'composite_node' => '',
	),
	array(
		'state' => 'closed',
		'tone' => 'yellow',
		'title' => '将来の仕事が、大学生活の中で見えてきました。',
		'profile' => '経営学部ITコース3年  Mさん',
		'school' => '千葉県立生浜高等学校出身',
		'portrait_hash' => '33aab97f8b6328f273150c0578bc5b6230d0c5e2',
		'composite_node' => '21378:7826',
	),
	array(
		'state' => 'closed',
		'tone' => 'blue',
		'title' => '学芸員になる夢を、安心して目指せると思った。',
		'profile' => '経営学部学芸員コース3年  Mさん',
		'school' => '千葉県立生浜高等学校出身',
		'portrait_hash' => '8c372ab3f8d02f36020b3b7c1bd719545105ff26',
		'composite_node' => '21378:7795',
	),
);
?>
<section
	class="ref001-student-voice"
	aria-labelledby="ref001-student-voice-title"
	data-figma-pc="21378:7766"
	data-figma-sp="21376:4650"
	data-interaction-status="deferred"
>
	<header class="ref001-student-voice__header">
		<p class="ref001-student-voice__kicker"># STUDENTS_VOICE</p>
		<h2 id="ref001-student-voice-title" class="ref001-student-voice__title">
			<span aria-hidden="true">（</span>
			<span>私が千葉経済大学を<strong>選んだ理由</strong></span>
			<span aria-hidden="true">）</span>
		</h2>
	</header>

	<div class="ref001-student-voice__list">
		<?php foreach ( $voices as $index => $voice ) : ?>
			<article class="ref001-student-voice__item ref001-student-voice__item--<?php echo esc_attr( $voice['state'] ); ?> ref001-student-voice__item--<?php echo esc_attr( $voice['tone'] ); ?>" data-visual-state="<?php echo esc_attr( $voice['state'] ); ?>">
				<div class="ref001-student-voice__summary">
					<div
						class="ref001-student-voice__portrait"
						data-asset-status="deferred"
						data-figma-image-hash="<?php echo esc_attr( $voice['portrait_hash'] ); ?>"
						data-figma-composite-node="<?php echo esc_attr( $voice['composite_node'] ); ?>"
						aria-hidden="true"
					></div>
					<div class="ref001-student-voice__bubble">
						<h3><?php echo esc_html( $voice['title'] ); ?></h3>
						<p><?php echo esc_html( $voice['profile'] ); ?><br><?php echo esc_html( $voice['school'] ); ?></p>
					</div>
				</div>

				<?php if ( 0 === $index ) : ?>
					<div class="ref001-student-voice__open-content">
						<div
							class="ref001-student-voice__class-photo"
							data-asset-status="deferred"
							data-figma-image-hash="12c4c3b3e824e6f191ac8a273fdfadb64912383b"
							data-figma-composite-node="21378:7849"
							<?php if ( $classroom_composite_b64 ) : ?>style="background-image:url(data:image/jpeg;base64,<?php echo esc_attr( $classroom_composite_b64 ); ?>)"<?php endif; ?>
							aria-hidden="true"
						></div>
						<div class="ref001-student-voice__detail">
							<p class="ref001-student-voice__lead">千葉経済大学のオープンキャンパスでは、多様なコースから自分の将来が広がると分かったことが決め手です！</p>
							<div class="ref001-student-voice__points">
								<dl>
									<div><dt>印象に残った授業</dt><dd>フィールドワークの授業が本当に楽しい！</dd></div>
									<div><dt>入学の決め手</dt><dd>少人数授業で先生との距離が近いこと</dd></div>
								</dl>
							</div>
						</div>
						<div class="ref001-student-voice__message">
							<strong>受験生へのひとこと</strong>
							<p>目標が決まっている人もまだ迷っている人も、ぜひ一度オープンキャンパスに参加してみてください。実際に大学の雰囲気を感じることで、自分に合った学びがきっと見つかると思います。</p>
						</div>
					</div>
				<?php else : ?>
					<p class="ref001-student-voice__more" aria-hidden="true"><span>＋</span> もっと見る</p>
				<?php endif; ?>
			</article>
		<?php endforeach; ?>
	</div>
</section>
