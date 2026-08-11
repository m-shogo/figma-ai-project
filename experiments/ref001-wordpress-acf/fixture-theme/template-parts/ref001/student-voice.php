<?php
/**
 * REF-001 Student Voice visual First Pass.
 *
 * Figma proves one open visual state and two collapsed visual states. No
 * interaction behavior is implemented here.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$voice1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAACXBIWXMAAADFAAAAxQEdzbqoAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAeNJREFUeAFdUU1rE1EUPe9lJsnkcybUhKI10TTapJEWQfzYhCzElVDduhW31a2btivBjXEhdieiwYUg+gvErdhNi9YWtSPYBi2dN83nfL15jrGB0nOX95x7z7mX4ACMsQKoNN/vduZ2tluFeCpl5o5l31IaXtQ05ScOo9vtzphmm31d3xDX6jUxVZoU1UpFNF80hWGYYnePLY649N9k1+XvBCHqq+ZL1M+cwPK925BdG8tPn0AEFSJ0YZd1akMBDckLhNI8gkYimcBM8TTyaQUP7tzCWFKB53F4nIMId7iFMLav/xcAX1bXkNJXYDEDgobQykzg3JU6JFmCJEmw+rJGR2Th+zhbqUI+VUZczeB7L4RE7iQG/X0Mel24totYzMlLAdf0fV8VIPB8oOVnsWnoGBSvQlHGIFsWwnSAXJiDc2KGzk8ql36sf5qKjF/Axm+gDQ0iO42y5kF1DRjhcZhOHIQ7erl0fEn69nmtEQSfo6UOoskMArtIEiDrbEEZ/MKmoyEST2PHUoeh6f1Hrz9wzu+yvT9oWx4s14cT5Nlu2+B9F3HYIIQv3byYeD680ughD99s1XouaRSy6dlYREanZ2N15aNenK425q9PPB7xCI7g2XumJqLR2cCZfuOyoh/t/wW0+sebezlQaQAAAABJRU5ErkJggg==';
$classroom = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAgEAAgACAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAHAA0DAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD7Q8afGH9u74BfED9mwftIfFjxNbeHPEV14z8SaHrvhf4peLdQ+Hep+CNW8KaJpmla3dW+h3th4msrrwfBaad4u07wPefBG80mzRwLa81bxDea7aXOWV1OG8wwGMhjcNm9PERy+MctqLE0JUcLmShHEQr4iglJ/uJOnhqcaFWcFeVZzqOFM6cUs1wuOoSw+Iy2pRljm8bTlhq8K1XBe3dGpQoV17vNWi515yq0Y+5ThSjyupOJ+2n/AAT2tNe0T4cSw6f4+8VfGP4b3fhjwhqfgDxT421OfUPGWzUtc+Id9rUWoX2tQ6JqOo6I4n0iXwzqOv2v/CZNYmbS/E7SSaTYXV1EMO8MlCMlUU4xqOpKdWNSc3eM5ShBqlFe6uXkUW/e51pFvpxeKjiqiqqnToqyhClSo0fZ06cIxjTjFyh7SUkl78puTnK9RylOc2D/2Q==';
$voice2 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAACXBIWXMAAADFAAAAxQEdzbqoAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAdRJREFUeAF1kc9rE0EUx7+7yWY12cTaWAhLJGntwapgKIh4kEbEQ26C4E30P7D/gQWxh16qF6+CXoJ3D95ysD2oWKUHT5IfbWxildntbnd2NzP7nFRRlPYLM5d53+/nvTfAbzFGVdcLV5nL2+tv3lKrtcZ+MP8Z57yC/+X7dNHdi5jrclpdWaG7jQW6VJunRw+XiTkBMeYt4Z9kl3dUOr17v0FPF29TsPaClu81aLpsU6+3Q44bkOfxhXG9bhjxA03XDrDZY8dxduYMnF4Hjcs1TBct+J4HIoIQdEDRpUyu/WIRynYJ56tlBCxGsZDHzSvzmCqVIEZCGeJ6u80m0uN0EjGQMtQxEZqTSMw9bO8OMHv9FhIhlWEEShJks1pFF/1PjrfehIxDxSBYF64iSAtogmPu3JxKHiHi+4jCfUgpHV3GcSs0CtAMU3VFMPwuSpNpVG/cQbEyi1zOgmGkIGLesW27q2Ow+diaqUFTU0hlGAYZvN6y8E3kIFUrmUwahZOnxkP+Xa3rB/d3Bt/V+jj1v+7Sh1fPadj7Qv3+gDgfkRdFf4r18XXCyj5Jm7l6d3vrY7P5EsOUjfzUaUSx6CjqYt40l3CU1EdObG58rjPGq4e9/wSXl/ocbu1KngAAAABJRU5ErkJggg==';
$voice3 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAACXBIWXMAAADFAAAAxQEdzbqoAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAcZJREFUeAFdUTtrFGEUPd9kJxG02GBhOSOksDOdYLMqYmXQIoWFhb2FKa2MFoIbUFdRLEV/gM9GZQnxAQmaICgEkpDd2c0Wec/7+X3z3cw3yTZ74Fb3nHPvuRc4gm2TGQTZ0+a32fbPH/PkBald1Os4JgODCAI664ep/WTmMV06f46mbl6jVy9ekucnZbluer/P1ZSzRPKRclSbzSbu3LqB25OX0V34gu3OekEhMI2mfT+ulQJdz6YZNKPXbSNNEoTbGxgZYpi8UsPa2gpySZC5hMhRTtFyyItEBHd/H5IkhisVeE6EzV4Hi3//g6cCWSYguLhg23ZVY8QMJehYLTCRoP72HbY2d+G4e1hZ/ockjhGFEXiWFkLd0ApTR0pgq7dRjnbCDC4DThkmEncH9fpDLP1ZKEV5zh1mO8n7XOTXH927i/lfs9h1HGjHTxYrcEipAjMUppi4OmE1ns+c1kBDjXa7ha9zcwhCH1HGcWx4pCQrkApdrPD504fD0KOj+vffS4tTYcKxExWO+gm4nleeE4yBC64O+2DdWn2jBKz/kLGxM7XCtcGYNq64pGiAxUXW6HZbz/o8Nvh10zSrQGUcEJbCYP8AfE4Sc5Cyx7IAAAAASUVORK5CYII=';

$voices = array(
	array(
		'portrait' => $voice1,
		'tone' => 'blue',
		'headline' => 'まだやりたいことが決まっていなくても大丈夫だった。',
		'profile' => '経営学部ITコース3年 Mさん',
		'school' => '千葉県立生浜高等学校出身',
		'open' => true,
	),
	array(
		'portrait' => $voice2,
		'tone' => 'yellow',
		'headline' => '将来の仕事が、大学生活の中で見えてきました。',
		'profile' => '経営学部ITコース3年 Mさん',
		'school' => '千葉県立生浜高等学校出身',
		'open' => false,
	),
	array(
		'portrait' => $voice3,
		'tone' => 'blue',
		'headline' => '学芸員になる夢を、安心して目指せると思った。',
		'profile' => '経営学部学芸員コース3年 Mさん',
		'school' => '千葉県立生浜高等学校出身',
		'open' => false,
	),
);
?>
<section class="ref001-student-voice" data-figma-pc="21378:7766" data-figma-sp="21376:4650" data-interaction-status="deferred">
	<header class="ref001-student-voice__heading">
		<p class="ref001-middle-kicker"># STUDENTS_VOICE</p>
		<h2>私が千葉経済大学を<strong>選んだ理由</strong></h2>
	</header>

	<div class="ref001-student-voice__items">
		<?php foreach ( $voices as $voice ) : ?>
			<article class="ref001-voice ref001-voice--<?php echo esc_attr( $voice['tone'] ); ?><?php echo $voice['open'] ? ' is-open' : ''; ?>">
				<div class="ref001-voice__summary">
					<img class="ref001-voice__portrait" src="<?php echo esc_attr( $voice['portrait'] ); ?>" alt="">
					<div class="ref001-voice__bubble">
						<h3><?php echo esc_html( $voice['headline'] ); ?></h3>
						<p><?php echo esc_html( $voice['profile'] ); ?><br><?php echo esc_html( $voice['school'] ); ?></p>
					</div>
				</div>

				<?php if ( $voice['open'] ) : ?>
					<div class="ref001-voice__detail">
						<img class="ref001-voice__classroom" src="<?php echo esc_attr( $classroom ); ?>" alt="">
						<div class="ref001-voice__story">
							<p>千葉経済大学のオープンキャンパスでは、多様なコースから自分の将来が広がると分かったことが決め手です！</p>
							<dl class="ref001-voice__points">
								<div><dt>印象に残った授業</dt><dd>フィールドワークの授業が本当に楽しい！</dd></div>
								<div><dt>入学の決め手</dt><dd>少人数授業で先生との距離が近いこと</dd></div>
							</dl>
						</div>
						<div class="ref001-voice__message">
							<span>受験生へのひとこと</span>
							<p>目標が決まっている人もまだ迷っている人も、ぜひ一度オープンキャンパスに参加してみてください。実際に大学の雰囲気を感じることで、自分に合った学びがきっと見つかると思います。</p>
						</div>
					</div>
				<?php else : ?>
					<div class="ref001-voice__more" aria-hidden="true"><span>＋</span> もっと見る</div>
				<?php endif; ?>
			</article>
		<?php endforeach; ?>
	</div>
</section>
