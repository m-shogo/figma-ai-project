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

$voice1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAEUAAABFAH7OeD/AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAwpJREFUeAFdU8trE0EY/83sJtm0Jc1W66PYGBTfSqNFiIiKBxE8VVAQT/UieKsHH3ip4j/QgidFVETFm968WQVBvBiLaEXQtPaddpM0u9nN7uyM36ZWqgM7DMP8Ht/v+5bhv1Wr1Y5JiT4pZZ8CskpJMLCCUqzAefymaSbHV79nK4dyuZzmPDaooAaEEHj65DHevH6LUIbYuWM7Ll66hPb2NCHYEIe8ZZpm5S9BBKbjCGO8hwhwZ3gIL54/wZpUG2bsAJLutmS6cff+QyQMgxCqwKCORyQ8IoiUGdd6iB3TU1N49ugRrp49ibs3BpDrMmHNz2F0dBRTk1OEVZFuToIPNrGknlVMDayU4osA8RhHqx6H7li4fOYUTvVsR6NeR92xEVImlA9oGyiVy8d0rlHdTdblldm0Gft37UBvbx6aW4WZMnCt/zwW7Xvo6FwHEQgwzsAZB1fqNKtU7Y/kK7dCEJEVCx/QWhwFj+kozZXA9Ri+hAaOnz7XTI1zHbqmgWtakbhWgf8QdO89iEZHJzg57UinMVGrI7OnB27dhuc68Bt1+EEDMgyzulqlvPyxpsoSS2De9vBj0sJsah8OpzIIhE/WGZWvKG8GoZETghSpT9mofXTdDNn1FSrtvbAmHSxk8+jamkPUdLcRUrgNJKSHNrKXNlRBO5Jbm/3++V1+YfoXUht24+eCpE8h0FrhpLZh46YMumJLMIMKvLiJkJxZDQNVW2K9iVdabtcarzxb6q9ai/A2nIArdCiukSmOlngMGlfYinF02l9hyTYsqVbo1AFfcSSZ6ONXbz9744twyHNtCM9pRqlTfTQKNMYSLdKBUR0jQh9G6SOmLReeUNQBffjA7q7x5iQK6d8KAr9QtW3YVKfjhwhCIiAVV3BY1IXAqaMjaWBtSidv4lMt0XYzwmrRNvJ+zDuaP/hcdB4wbF/P1zyFeFynpBXp6vje6EZhbAbzic2o8+QwDUb/hUPJyj9/48q6/uBr1ki2DGbXp3JJI5ZjNLqUfvHTt4kXfm3p5Z0rR0ZWv/8Neeh06FDI51wAAAAASUVORK5CYII=';
$classroom = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAgEAAwADAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAKABEDAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD2r4n/APBQ/wDbz0L4f+JPh58RvH/j74B+Lp/F0VnosGratZfCVvEugax43+MWt2+hfDLxR8UtLiGr6faeE/Fnh/Q59X8FNqer61b+DfCPhTwrD4a1C013X9E0yLC8L5jUy2nmfFU8Bl9aFKtjJUsHiMypTwlSvTw6o4H+zMFiqtSvWpupUjXxT+p0XCpKrB8ipSvM62eYWWOq4Ph+njsTGrUo4OCxcMFWli1RnVVTELHYilTjRoV1CnOhh4xxeIjKEKclzutD9G7TWP2nda8QQ/tK+A/iF4/1fwprP7OUng7QvgJ43vtS0y68X6XYaBb3keseC/GIltLnS/iLYG3u/EOo+JrG9ay14ahBfQ6ho9zqbVxY3I1lOOx9OjiPrmX5fi8SsE8NJ+2xFCliKnPGl7KnWjOm6Mfa4VKnUqXlBe1lGbS9jCZrRx2VYVzwf1fMMbTw1XHVMTBctKpKlLkjJyq050+adVRxanKnTfsruhCVPnn/AEJ/8JBN/wBPX/hWw/8AyZW3NH+Wt90//kDyfe/lpf8Akv8A8kfNnjj4DfA34meD/Cnw++JHwZ+FHxA8BaRpss2k+CPG/wAO/CHivwhpc1hr2sW1jLp3hrXtHv8ARrKWyt5JILSS2somtoXeKEojMp5qeHw9FSdGhRpOyV6VKFN2upWvGKduaUpW/mlJ7tmtSrUqNe0qTneTb55yld2td3bu7JL0SXQm+CX7Mf7Nnw/1nxPfeA/2e/gf4Jvr3SpdDvLzwj8J/AXhu6u9EN7LOdHubjRtAspp9LM9xcTf2fK72nmzzSeTvlct1Xaoys2rxknq9U020+6d9TFP95FdP6X5aH23/Y2kf9ArTf8AwBtf/jVURd92AP/Z';
$voice2 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAEUAAABFAH7OeD/AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAwBJREFUeAFtU91LFFEU/907Mzu745q7sblZuVpEWpFuJn0ZmFAREfQFRVAEQfQU2Huw9tJr+TcEIYSgDz30BVaPQWxYkAq1pmGm6zi77seduXtvd9aPLDrM5c7Mvb9zfud3ziH4x/J5r1ugcl4KeR5SNHNegabRtDpKB4NaXygUmsT/zLZlxFlyHzq5kvTX+HhGnuw5IbuOHJVXr1yTr1++lbZTlI5TfGjbdmQVR1bBRGMjlKBdSomZmRnc672NwwkLX2eLeDc2DY1SPB4YRGMi4UPSUrCeaDS6SP0vangpH7zqdfjpAC4fqMed6xfx4NYp7KsPYGEhi8GBJ1D+fUtSaqaqWBW9mUjRuz4dKTg2bKhHNu9hbJbjZk8SsbCJbHZ+mbIyAfTm86Vu3TDclJB/69HddQS72QS8xSk014bhNCWwd3MU7dvjEFJB1X0/VeaJC1S9JNcir+wt25tQKRcwPZVHoVCEqEh0tWzDns5jEELVqFJR//wlz1EFSv7hLqteSCSObK6MWLwR8/MOSm4R06EEdrZ3oqLKyj0Oj3ng3Gum4GXIuQlUpj+p3MVyaTQDGztOQgR06CGCTOY7jp8+C6mics7BmQvPY+AuA3Xt2Yz8MYr85BcQVSpZTUSCbm2FW6OBcQ+tLU3YEa9TDRVQ0V24ipHHir6TNJWaPqSoYJGLNRH8TIyZD4hvDCEWC6Oh+wY2tXYioBhZNWF1gUMoBtIrp6k+OzZUyGWx5eCZanS54oCrNCZ/OZjDJtDNu6o9p1oaVq2FWEMjiG6AMtZHowfPvClEdj0ygjXV6D5FXV38yevwbCqG99/mUcjZWFrKgSuNfNU1TQchev+Ojo7Jaic2tHXdl4Sky6Ui/DJTTUNdbAuO7TRx6dA2JVYJrFRapkaqz0fN1PrWZmF5HuwIYzxlWuHe0dHPaiodhE0d+5Nt0AIhOE5OaWDBCuv9IdPsI4Qs+jh91YE/GGq7a9ul/ucvXqVqLTPp5PLJvW1tCEpkGCsPEcMYtoLhkfVd+xugcXUaRuNzXAAAAABJRU5ErkJggg==';
$voice3 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAEUAAABFAH7OeD/AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAu5JREFUeAFtUktrU1EQ/s7JvTGpvT7qq2qU7FyIGlDrswr+AfUPuHOhbrIVAokLETe2Kgiu7EJBi2BFxJW2ooJihSo+Fq1tYlNLH9imaXNzH+eMc26bouJchnM5Z+ab+b4ZgX/MdYPjStEppdQpLwjSycQKcz1A7HYsXkgmRQn/s5kZWjM/H3RU5z262dlJ7YePUPvBQ3T18hWaq7pUrXp81vn0O0xsI082km3b7yOhs29e9qHrzh2sXxlD7swJ9D/vwa3OayD+jBF0Vlp+bwMkArDtMM/Pe0xM//v3iNlxXLxwFm372nD+5FG8fvYI40PfFgE4RoAylhXkIwBGShtUk6z5tTgyhOSKJKzaNCZK37F2QwrnTh/Dz+FvnEwRgjk1qWy16h6X3Hq+wSf0Q4yPlZGI23A9he2pjUhtWocWx8GT3nfQiqCMh4vu+3TaIkEZaBFxnJocB6kQQZ19YQ6fBmYgycbkzASKwz8QBCpSYVlAKU9KkMiYZNPW1MQEYgygQg83up/CcVqwpXUzBktjKI+OwK3VuKoP3/MYLEAYhmmplzgZ4OLgIEKlWFQLrz6P4OHzF3j74TV2pFoQh4e3r3rh1V3eFQPksQewWI2iJqRVqDBaGo6EJKWxqrkJFG/Gtt37US6XcXjvHuQKBRxrP4p9bQewa+dubE5tHRCVSq1DKZH16nV03b6FZz13eYwJjDGdBW2hqakZCR7rAr+bmQspoFmz1asc3L93v4t1sHuINKamp/DgYTf8QPNi/WK1QzjNTjTSOrcrheBsEdFVKkBlroLuR/cK0nHslyxA59cvX+AGISo1l6v5/A/UueoC89V6SScWymMBZUxyN3Q9l8uV5OI4gkv9H/oHVKgx62nURQJW0uGqMVCUjOUtNBpJiI+B9grmTjRmmkln1sxbXj70g6zNnA0tMl2bxWVn6ty6Zoq165YlC8VicfYvgIa1tqbTKxOJvFkwbjsT7Y1EURD1yJAeD5WH+v6M/w1QML0pa8XEUwAAAABJRU5ErkJggg==';

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
