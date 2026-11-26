<?php
// Presentation only. Cursor supplies normalized rows through get_template_part's $args.
// image_html is WordPress-generated markup; fixture data is never loaded here.
$items = [];
foreach (is_array($args['items'] ?? null) ? $args['items'] : [] as $row) {
  if (!is_array($row) || !is_string($row['title'] ?? null) || trim($row['title']) === '') {
    continue;
  }
  $items[] = [
    'title' => trim($row['title']),
    'text' => is_string($row['text'] ?? null) ? trim($row['text']) : '',
    'url' => is_string($row['url'] ?? null) ? esc_url(trim($row['url'])) : '',
    'new_tab' => ($row['new_tab'] ?? false) === true,
    'image' => is_string($row['image_html'] ?? null) ? wp_kses_post($row['image_html']) : '',
  ];
}
if (!$items) {
  return;
}
?>
<section class="jwsnj_topCourse<?php echo count($items) % 3 === 2 ? ' has-art-slot' : ''; ?>" aria-labelledby="jwsnj_topCourse_heading" data-course>
  <div class="jwsnj_topCourse_head">
    <h2 id="jwsnj_topCourse_heading" class="jwsnj_topCourse_title">
      <span lang="en" class="jwsnj_topCourse_en">Course</span>
      <span class="jwsnj_topCourse_ja"><img src="<?php echo esc_url(get_theme_file_uri('images/common/ico_blossom.svg')); ?>" width="12" height="12" alt="">各部紹介</span>
    </h2>
    <p>幼児部から高等部、国際学級まで、それぞれの学びや特色をご紹介します</p>
  </div>
  <div class="jwsnj_topCourse_viewport" data-course-viewport>
    <ul class="jwsnj_topCourse_list" id="jwsnj_topCourse_list" role="list" data-course-list>
      <?php foreach ($items as $item) : ?>
        <li class="jwsnj_topCourse_card" data-course-card>
          <?php if ($item['url'] !== '') : ?>
            <a class="jwsnj_topCourse_item" href="<?php echo $item['url']; ?>"<?php echo $item['new_tab'] ? ' target="_blank" rel="noopener noreferrer"' : ''; ?>>
          <?php else : ?>
            <div class="jwsnj_topCourse_item">
          <?php endif; ?>
          <?php if ($item['image'] !== '') : ?>
            <div class="jwsnj_topCourse_photo">
              <div class="jwsnj_topCourse_crop"><?php echo $item['image']; ?></div>
              <?php if ($item['url'] !== '') : ?><span class="jwsnj_topCourse_arrow" aria-hidden="true"></span><?php endif; ?>
            </div>
          <?php endif; ?>
          <div class="jwsnj_topCourse_copy">
            <h3><?php echo esc_html($item['title']); ?></h3>
            <?php if ($item['text'] !== '') : ?><p><?php echo esc_html($item['text']); ?></p><?php endif; ?>
          </div>
          <?php echo $item['url'] !== '' ? '</a>' : '</div>'; ?>
        </li>
      <?php endforeach; ?>
    </ul>
  </div>
  <div class="jwsnj_topCourse_art" aria-hidden="true">
    <img class="jwsnj_topCourse_person" src="<?php echo esc_url(get_theme_file_uri('images/top/img_course-layer.svg')); ?>" width="145" height="175" alt="">
    <img class="jwsnj_topCourse_mark" src="<?php echo esc_url(get_theme_file_uri('images/top/img_course-mark.svg')); ?>" width="35" height="41" alt="">
    <img class="jwsnj_topCourse_math" src="<?php echo esc_url(get_theme_file_uri('images/top/img_course-math.svg')); ?>" width="94" height="128" alt="">
  </div>
  <?php if (count($items) > 1) : ?>
    <div class="jwsnj_topCourse_controls" data-course-controls hidden>
      <button type="button" class="jwsnj_topCourse_prev" aria-label="前のコース" aria-controls="jwsnj_topCourse_list" data-course-prev></button>
      <div class="jwsnj_topCourse_dots">
        <?php foreach ($items as $i => $item) : ?>
          <button type="button" aria-label="<?php echo esc_attr($item['title']); ?>" aria-controls="jwsnj_topCourse_list" data-course-dot="<?php echo esc_attr((string) $i); ?>"></button>
        <?php endforeach; ?>
      </div>
      <button type="button" class="jwsnj_topCourse_next" aria-label="次のコース" aria-controls="jwsnj_topCourse_list" data-course-next></button>
    </div>
  <?php endif; ?>
</section>
