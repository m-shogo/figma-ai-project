<?php
/**
 * STUDENTS VOICE の ACF 差し替え版。
 *
 * lp-originalPage.php の <section class="p-voice"> ... </section> を
 * まるごとこのファイルの include に置き換えると、管理画面の
 * 繰り返しフィールド「ref001_student_voices」で内容を編集できます。
 *
 * ACF が未設定・0件のときは、下の $fallback がそのまま表示されるので、
 * 差し替えても見た目は変わりません。
 *
 * 対応する CSS は lp/css/ref001.css の .p-voice ブロックです。
 */

require_once __DIR__ . '/_helpers.php';

/* 管理画面で何も入れていないときに表示される内容 */
$fallback = array(
	array(
		'avatar'       => null, 'avatar_pc' => 'voice-1-avatar-21378-7857.webp', 'avatar_sp' => 'student-voice-01-21376-4709.webp',
		'detail_photo' => null, 'photo_pc'  => 'voice-1-detail-21378-7849.webp', 'photo_sp'  => 'voice-1-detail-21376-4701.webp',
		'title'   => 'まだやりたいことが決まっていなくても大丈夫だった。',
		'profile' => '経営学部ITコース3年 Mさん',
		'school'  => '千葉県立生浜高等学校出身',
		'body'    => '千葉経済大学のオープンキャンパスでは、多様なコースから自分の将来が広がると分かったことが決め手です！',
		'lesson'  => 'フィールドワークの授業が本当に楽しい！',
		'reason'  => '少人数授業で先生との距離が近いこと',
		'advice'  => '目標が決まっている人もまだ迷っている人も、ぜひ一度オープンキャンパスに参加してみてください。実際に大学の雰囲気を感じることで、自分に合った学びがきっと見つかると思います。',
	),
	array(
		'avatar'       => null, 'avatar_pc' => 'voice-2-avatar-21378-7826.webp', 'avatar_sp' => 'student-voice-02-21376-4678.webp',
		'detail_photo' => null, 'photo_pc'  => 'voice-1-detail-21378-7849.webp', 'photo_sp'  => 'voice-1-detail-21376-4701.webp',
		'title'   => '将来の仕事が、大学生活の中で見えてきました。',
		'profile' => '経営学部ITコース3年 Mさん',
		'school'  => '千葉県立生浜高等学校出身',
		'body'    => '少人数の授業で先生に相談しやすく、授業やゼミを通して自分の得意なことが少しずつ見えてきました。',
		'lesson'  => 'グループワークで企画を形にしていく授業',
		'reason'  => '先生や先輩に相談しやすい学びの環境',
		'advice'  => '進路に迷っていても、実際に授業や学生の雰囲気を見るとイメージが変わります。気軽にオープンキャンパスで確かめてみてください。',
	),
	array(
		'avatar'       => null, 'avatar_pc' => 'voice-3-avatar-21378-7795.webp', 'avatar_sp' => 'student-voice-04-21376-4663.webp',
		'detail_photo' => null, 'photo_pc'  => 'voice-1-detail-21378-7849.webp', 'photo_sp'  => 'voice-1-detail-21376-4701.webp',
		'title'   => '学芸員になる夢を、安心して目指せると思った。',
		'profile' => '経営学部学芸員コース3年 Mさん',
		'school'  => '千葉県立生浜高等学校出身',
		'body'    => '学芸員資格をめざせることに加えて、経済や経営も一緒に学べるので、将来の選択肢を広げられると感じました。',
		'lesson'  => '博物館や地域文化を調べる実践的な授業',
		'reason'  => '資格取得と専門分野の学びを両立できること',
		'advice'  => 'やりたいことが決まっている人も、まだ探している人も大丈夫です。気になる分野を実際に見て、自分らしい進路を見つけてください。',
	),
);

$voices = lp_rows(
	'ref001_student_voices',
	array( 'avatar', 'detail_photo', 'title', 'profile', 'school', 'body', 'lesson', 'reason', 'advice' ),
	$fallback
);
?>
<section class="p-voice">

	<header class="p-voice__head l-container">
		<span class="c-kicker"># STUDENTS_VOICE</span>
		<h2 class="c-heading"><span class="c-heading__text">私が千葉経済大学を<strong>選んだ理由</strong></span></h2>
	</header>

	<?php foreach ( $voices as $i => $v ) : ?>
		<?php
		$is_first  = ( $i === 0 );          // 1件目だけ最初から開いておく
		$detail_id = 'voice-detail-' . ( $i + 1 );
		?>
		<article class="p-voice__item<?php echo $is_first ? ' is-open' : ''; ?>">
			<div class="p-voice__inner l-container">

				<div class="p-voice__profile">
					<?php
					lp_picture(
						$lp_base,
						$v['avatar'] ?? null,
						(string) ( $v['avatar_pc'] ?? 'voice-1-avatar-21378-7857.webp' ),
						(string) ( $v['avatar_sp'] ?? 'student-voice-01-21376-4709.webp' ),
						'p-voice__avatar'
					);
					?>
					<div class="p-voice__balloon">
						<h3 class="p-voice__title"><?php lp_e( $v['title'] ?? '' ); ?></h3>
						<p class="p-voice__meta"><?php lp_e( $v['profile'] ?? '' ); ?><br><?php lp_e( $v['school'] ?? '' ); ?></p>
					</div>
				</div>

				<?php if ( ! $is_first ) : ?>
					<button class="p-voice__toggle" type="button" aria-expanded="false" aria-controls="<?php lp_e( $detail_id ); ?>">
						<span class="p-voice__toggle-mark" aria-hidden="true"></span>もっと見る
					</button>
				<?php endif; ?>

				<div class="p-voice__detail" id="<?php lp_e( $detail_id ); ?>"<?php echo $is_first ? '' : ' hidden'; ?>>
					<div class="p-voice__detail-main">
						<?php
						lp_picture(
							$lp_base,
							$v['detail_photo'] ?? null,
							(string) ( $v['photo_pc'] ?? 'voice-1-detail-21378-7849.webp' ),
							(string) ( $v['photo_sp'] ?? 'voice-1-detail-21376-4701.webp' ),
							'p-voice__photo'
						);
						?>
						<div class="p-voice__detail-body">
							<p class="p-voice__detail-text"><?php lp_e( $v['body'] ?? '' ); ?></p>
							<dl class="p-voice__points">
								<dt>印象に残った授業</dt>
								<dd><?php lp_e( $v['lesson'] ?? '' ); ?></dd>
								<dt>入学の決め手</dt>
								<dd><?php lp_e( $v['reason'] ?? '' ); ?></dd>
							</dl>
						</div>
					</div>
					<div class="p-voice__advice">
						<p class="p-voice__advice-label">受験生へのひとこと</p>
						<p class="p-voice__advice-text"><?php lp_e( $v['advice'] ?? '' ); ?></p>
					</div>
				</div>

			</div>
		</article>
	<?php endforeach; ?>

</section>
