<?php
/**
 * 「学生の声」ACF差し替え版。
 *
 * lp-originalPage.php の直書き<section class="ref-voice" ...>...</section>を
 * このファイルの include に置き換えると、ACF PROの繰り返しフィールド
 * `ref001_student_voices`（lp/acf-json/group_ref001_student_voice.json）を
 * 編集画面から更新できるようになる。
 *
 * ACF未設定・0件の場合は元の直書き版と同じ文言・画像がそのまま表示される
 * ので、差し替えても見た目は壊れない。
 */

require_once __DIR__ . '/_helpers.php';

$ref001_lp_voice_fixture_rows = [
    [
        'avatar' => null, 'avatar_slot' => 'voice-1-avatar',
        'detail_photo' => null, 'detail_photo_slot' => 'voice-1-detail',
        'title' => 'まだやりたいことが決まっていなくても大丈夫だった。',
        'profile' => '経営学部ITコース3年 Mさん', 'school' => '千葉県立生浜高等学校出身',
        'body' => '千葉経済大学のオープンキャンパスでは、多様なコースから自分の将来が広がると分かったことが決め手です！',
        'lesson' => 'フィールドワークの授業が本当に楽しい！',
        'reason' => '少人数授業で先生との距離が近いこと',
        'advice' => "目標が決まっている人もまだ迷っている人も、ぜひ一度オープンキャンパスに参加してみてください。\n実際に大学の雰囲気を感じることで、自分に合った学びがきっと見つかると思います。",
    ],
    [
        'avatar' => null, 'avatar_slot' => 'voice-2-avatar',
        'detail_photo' => null, 'detail_photo_slot' => 'voice-1-detail',
        'title' => '将来の仕事が、大学生活の中で見えてきました。',
        'profile' => '経営学部ITコース3年 Mさん', 'school' => '千葉県立生浜高等学校出身',
        'body' => '少人数の授業で先生に相談しやすく、授業やゼミを通して自分の得意なことが少しずつ見えてきました。',
        'lesson' => 'グループワークで企画を形にしていく授業',
        'reason' => '先生や先輩に相談しやすい学びの環境',
        'advice' => '進路に迷っていても、実際に授業や学生の雰囲気を見るとイメージが変わります。気軽にオープンキャンパスで確かめてみてください。',
    ],
    [
        'avatar' => null, 'avatar_slot' => 'voice-3-avatar',
        'detail_photo' => null, 'detail_photo_slot' => 'voice-1-detail',
        'title' => '学芸員になる夢を、安心して目指せると思った。',
        'profile' => '経営学部学芸員コース3年 Mさん', 'school' => '千葉県立生浜高等学校出身',
        'body' => '学芸員資格をめざせることに加えて、経済や経営も一緒に学べるので、将来の選択肢を広げられると感じました。',
        'lesson' => '博物館や地域文化を調べる実践的な授業',
        'reason' => '資格取得と専門分野の学びを両立できること',
        'advice' => 'やりたいことが決まっている人も、まだ探している人も大丈夫です。気になる分野を実際に見て、自分らしい進路を見つけてください。',
    ],
];

$ref001_lp_voices = ref001_lp_repeater_or_fixture(
    'ref001_student_voices',
    ['avatar', 'detail_photo', 'title', 'profile', 'school', 'body', 'lesson', 'reason', 'advice'],
    $ref001_lp_voice_fixture_rows
);
?>
<section class="ref-voice" data-section="student-voice">
  <header class="ref-voice__head"><span class="ref-kicker"># STUDENTS_VOICE</span><h2 class="ref-bracket-title">私が千葉経済大学を<strong>選んだ理由</strong></h2></header>
  <?php foreach ($ref001_lp_voices as $ref001_lp_index => $ref001_lp_voice): $ref001_lp_open = $ref001_lp_index === 0; $ref001_lp_number = $ref001_lp_index + 1; $ref001_lp_detail_id = "ref-voice-detail-{$ref001_lp_number}"; ?>
    <article class="ref-voice-item <?= $ref001_lp_open ? 'ref-voice-item--open' : 'ref-voice-item--collapsed'; ?>" data-voice-item="<?= $ref001_lp_number; ?>">
      <div class="ref-content">
        <div class="ref-voice-item__top">
          <?php if (!empty($ref001_lp_voice['avatar'])): ?>
            <?php ref001_lp_picture_from_acf_image($ref001_lp_voice['avatar'], 'ref-avatar'); ?>
          <?php else: ?>
            <?php ref001_lp_picture_from_slot($lp_base, (string) ($ref001_lp_voice['avatar_slot'] ?? ''), 'ref-avatar'); ?>
          <?php endif; ?>
          <div class="ref-speech"><h3><?php ref001_lp_e($ref001_lp_voice['title'] ?? ''); ?></h3><p><?php ref001_lp_e($ref001_lp_voice['profile'] ?? ''); ?><br><?php ref001_lp_e($ref001_lp_voice['school'] ?? ''); ?></p></div>
        </div>
        <?php if (!$ref001_lp_open): ?>
          <button type="button" class="ref-voice-more ref-voice-toggle" aria-expanded="false" aria-controls="<?php ref001_lp_e($ref001_lp_detail_id); ?>"><span class="ref-voice-toggle__mark" aria-hidden="true">＋</span><span>もっと見る</span></button>
        <?php endif; ?>
        <div id="<?php ref001_lp_e($ref001_lp_detail_id); ?>" class="ref-voice-disclosure"<?= $ref001_lp_open ? '' : ' aria-hidden="true"'; ?>>
          <div class="ref-voice-disclosure__inner">
            <div class="ref-voice-open__detail">
              <?php if (!empty($ref001_lp_voice['detail_photo'])): ?>
                <?php ref001_lp_picture_from_acf_image($ref001_lp_voice['detail_photo'], 'ref-voice-open__photo'); ?>
              <?php else: ?>
                <?php ref001_lp_picture_from_slot($lp_base, (string) ($ref001_lp_voice['detail_photo_slot'] ?? ''), 'ref-voice-open__photo'); ?>
              <?php endif; ?>
              <div class="ref-voice-open__copy">
                <p><?php ref001_lp_e($ref001_lp_voice['body'] ?? ''); ?></p>
                <div class="ref-pointbox"><p><strong>印象に残った授業</strong><?php ref001_lp_e($ref001_lp_voice['lesson'] ?? ''); ?></p><p><strong>入学の決め手</strong><?php ref001_lp_e($ref001_lp_voice['reason'] ?? ''); ?></p></div>
              </div>
            </div>
            <div class="ref-voice-open__advice"><strong>受験生へのひとこと</strong><span><?php ref001_lp_e($ref001_lp_voice['advice'] ?? ''); ?></span></div>
          </div>
        </div>
      </div>
    </article>
  <?php endforeach; ?>
</section>
