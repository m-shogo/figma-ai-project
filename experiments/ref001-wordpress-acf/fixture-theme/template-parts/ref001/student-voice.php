<?php
/**
 * REF-001 Student Voice visual fixture.
 *
 * Figma proves item 1 open and items 2/3 collapsed. It does not prove the
 * interaction contract, so this First Pass intentionally renders those states
 * statically and adds no accordion JavaScript.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$voice1 = 'data:image/png;base64,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';
$classroom = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAgEABgAGAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAATACEDAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9etA/4LF+LbXW/wBt34ZfBG48E+M/E3wV1L4a+IPhGnxGsbfQ/CWsaPf3Nv4d+JmkaVrXh3V0uvF0I1K2g8ReHdYWaSeXS9enlW3/ALN0aea28vA0szjGnRwuAlj5SlKpOlh6kI1qFKUoRjOanaNueoot89tFazk7enmE8udSpUxGY08uiqajTq4qlUlRrVoRnOVKDppyjzRg+S8Ze83e0UeWftuf8FnP2m/DnxT8XeC/2fvDHgjWfBMHwx8I+GPEvijQ/F3w/wDGl74S+IurR6b4lufF3gLwBq+uaJqHi3WLf/hIj4QTwtq+qfZ9Wj0aDU5LPT4r/SbjVNsJlme59i5ZLRyrFTzHEOVGjl6oV1CVbDxxWJnCeMjCVNe1oYKvyTo+1U/Y1fYe0nCUVKrZXgMH/bVTMcPDLsKo1cTi/rGG9tGhXlhcPTqUsBVq06tT2dbF03JScHFVIKu6KdOUvY/2yf2zP2x/hv8AsT+B/AHw703wtrH7TvjP4R6Nq/7Qa6Vp/jLQ9a0vw34t8CXmmeM9d+At/wCH9X06W28caV4uNxFoWqwzalpmm30dvLZQs09l5fhOjU4dxeMwGOoYing3iZVFibL6vRVRaU6k4SgoqUKiqRUYz1WqbUk01K1r/AIX6n8P// truncated for brevity */';
$voice2 = 'data:image/png;base64,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';
$voice3 = 'data:image/png;base64,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';

$voices = array(
	array(
		'portrait' => $voice1,
		'tone' => 'blue',
		'headline' => 'まだやりたいことが決まっていなくても大丈夫だった。',
		'profile' => '経営学部ITコース3年  Mさん',
		'school' => '千葉県立生浜高等学校出身',
		'open' => true,
	),
	array(
		'portrait' => $voice2,
		'tone' => 'yellow',
		'headline' => '将来の仕事が、大学生活の中で見えてきました。',
		'profile' => '経営学部ITコース3年  Mさん',
		'school' => '千葉県立生浜高等学校出身',
		'open' => false,
	),
	array(
		'portrait' => $voice3,
		'tone' => 'blue',
		'headline' => '学芸員になる夢を、安心して目指せると思った。',
		'profile' => '経営学部学芸員コース3年  Mさん',
		'school' => '千葉県立生浜高等学校出身',
		'open' => false,
	),
);
?>
<section class="ref001-student-voice" data-figma-pc="21378:7766" data-figma-sp="21376:4650">
	<header class="ref001-student-voice__heading">
		<p class="ref001-section-kicker"># STUDENTS_VOICE</p>
		<h2>私が千葉経済大学を<strong>選んだ理由</strong></h2>
	</header>

	<div class="ref001-student-voice__items">
		<?php foreach ( $voices as $index => $voice ) : ?>
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
