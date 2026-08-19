<?php
/**
 * MESSAGES（スライダー）の ACF 差し替え版。
 *
 * lp-originalPage.php の <section class="p-messages"> ... </section> を
 * まるごとこのファイルの include に置き換えると、管理画面の
 * 繰り返しフィールド「ref001_swiper_slides」でスライドを編集できます。
 *
 * ACF が未設定・0件のときは、下の $fallback がそのまま表示されます。
 * スライドの枚数を増減すると、右下のカウンター（1 ── 4）も自動で追従します。
 *
 * 矢印やカウンターはテンプレート側の持ち物なので ACF では編集しません。
 * 対応する CSS は lp/css/ref001.css の .p-messages ブロックです。
 */

require_once __DIR__ . '/_helpers.php';

/* 管理画面で何も入れていないときに表示される内容 */
$fallback = array(
	array(
		'photo' => null, 'photo_pc' => 'messages-photo-21378-7760.webp', 'photo_sp' => 'messages-photo-21376-4643.webp',
		'quote'   => "大学で培った企画力を武器に、\n今はIT企業のマーケターとして挑戦の毎日です！",
		'profile' => '経営学科ビジネス経営コース3年 Tさん',
		'school'  => '千葉県立生浜高等学校出身',
	),
	array(
		'photo' => null, 'photo_pc' => 'reason-1-21378-8002.webp', 'photo_sp' => 'reason-1-21376-4855.webp',
		'quote'   => "ゼミで身につけた行動力を活かして、\n地域と企業をつなぐ仕事に挑戦しています！",
		'profile' => '経済学科地域経済コース4年 Aさん',
		'school'  => '千葉県立千葉商業高等学校出身',
	),
	array(
		'photo' => null, 'photo_pc' => 'reason-2-21378-8010.webp', 'photo_sp' => 'reason-2-21376-4864.webp',
		'quote'   => "数字と向き合う力が自信になり、\n会計の知識を活かせる進路が見えてきました！",
		'profile' => '経営学科会計コース4年 Kさん',
		'school'  => '千葉県立幕張総合高等学校出身',
	),
	array(
		'photo' => null, 'photo_pc' => 'reason-3-21378-8018.webp', 'photo_sp' => 'reason-3-21376-4872.webp',
		'quote'   => "先生や仲間と考え抜いた経験を糧に、\n自分らしい働き方を目指しています！",
		'profile' => '経営学科ビジネス経営コース4年 Sさん',
		'school'  => '千葉県立検見川高等学校出身',
	),
);

$slides = lp_rows(
	'ref001_swiper_slides',
	array( 'photo', 'quote', 'profile', 'school' ),
	$fallback
);
$total = count( $slides );
?>
<section class="p-messages">
	<div class="l-container">

		<header class="p-messages__head">
			<span class="c-kicker"># MESSAGES</span>
			<h2 class="p-messages__heading">力をつけ活躍する<strong>先輩たち</strong></h2>
		</header>

		<div class="p-messages__slider swiper" data-ref-messages-swiper>
			<div class="swiper-wrapper">
				<?php foreach ( $slides as $s ) : ?>
					<div class="swiper-slide p-messages__slide">
						<?php
						lp_picture(
							$lp_base,
							$s['photo'] ?? null,
							(string) ( $s['photo_pc'] ?? 'messages-photo-21378-7760.webp' ),
							(string) ( $s['photo_sp'] ?? 'messages-photo-21376-4643.webp' ),
							'p-messages__photo'
						);
						?>
						<div class="p-messages__body">
							<p class="p-messages__quote">
								<?php foreach ( lp_lines( $s['quote'] ?? '' ) as $line ) : ?>
									<span><?php lp_e( $line ); ?></span>
								<?php endforeach; ?>
							</p>
							<p class="p-messages__meta"><?php lp_e( $s['profile'] ?? '' ); ?><br><?php lp_e( $s['school'] ?? '' ); ?></p>
						</div>
					</div>
				<?php endforeach; ?>
			</div>

			<div class="p-messages__nav">
				<button class="p-messages__arrow p-messages__arrow--prev" type="button" aria-label="前のメッセージ">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/arrow-left.svg' ); ?>" alt="" aria-hidden="true">
				</button>
				<p class="p-messages__counter">
					<span data-ref-message-current>1</span>
					<span class="p-messages__counter-bar" aria-hidden="true"></span>
					<span><?php echo (int) $total; ?></span>
				</p>
				<button class="p-messages__arrow p-messages__arrow--next" type="button" aria-label="次のメッセージ">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true">
				</button>
			</div>
		</div>

	</div>
</section>
