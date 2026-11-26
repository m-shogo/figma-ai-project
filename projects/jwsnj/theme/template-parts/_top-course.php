<?php
// SPEC.md authorizes exactly image/title/text/link/external-link for each course.
$rows = function_exists('get_field') ? get_field('top_course-01') : [];
$items = [];
foreach (is_array($rows) ? $rows : [] as $row) {
    if (!is_array($row)) {
        continue;
    }
    $title = is_string($row['title'] ?? null) ? trim($row['title']) : '';
    if ($title === '') {
        continue;
    }
    $raw_id = $row['img'] ?? 0;
    $id = (is_int($raw_id) || is_string($raw_id)) ? filter_var($raw_id, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) : false;
    $image = $id && wp_attachment_is_image($id) ? wp_get_attachment_image($id, 'large', false, [
        'alt' => '', 'loading' => 'lazy', 'decoding' => 'async', 'sizes' => '(min-width: 67.5rem) 293px, 251px',
    ]) : '';
    $items[] = [
        'title' => $title,
        'text' => is_string($row['text'] ?? null) ? trim($row['text']) : '',
        'url' => is_string($row['url'] ?? null) ? esc_url(trim($row['url'])) : '',
        'new_tab' => in_array('はい', (array) ($row['target'] ?? []), true),
        'image' => $image,
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
    <ul class="jwsnj_topCourse_list" id="jwsnj_topCourse_list" aria-label="各部紹介" role="list" data-course-list<?php echo count($items) > 1 ? ' tabindex="0"' : ''; ?>>
        <?php foreach ($items as $item) : ?>
            <li class="jwsnj_topCourse_card" data-course-card>
                <?php if ($item['url'] !== '') : ?>
                    <a class="jwsnj_topCourse_item" href="<?php echo $item['url']; ?>"<?php echo $item['new_tab'] ? ' target="_blank" rel="noopener noreferrer"' : ''; ?>>
                <?php else : ?>
                    <div class="jwsnj_topCourse_item">
                <?php endif; ?>
                <?php if ($item['image'] !== '') : ?>
                    <div class="jwsnj_topCourse_photo">
                        <div class="jwsnj_topCourse_crop"><?php echo $item['image']; // WordPress-generated image HTML. ?></div>
                        <?php if ($item['url'] !== '') : ?><span class="jwsnj_topCourse_arrow" aria-hidden="true"></span><?php endif; ?>
                    </div>
                <?php endif; ?>
                <h3><?php echo esc_html($item['title']); ?><?php if ($item['url'] !== '' && $item['image'] === '') : ?><span class="jwsnj_topCourse_textArrow" aria-hidden="true"></span><?php endif; ?></h3>
                <?php if ($item['text'] !== '') : ?><p><?php echo esc_html($item['text']); ?></p><?php endif; ?>
                <?php echo $item['url'] !== '' ? '</a>' : '</div>'; ?>
            </li>
        <?php endforeach; ?>
    </ul>
    <div class="jwsnj_topCourse_art" aria-hidden="true">
        <img class="jwsnj_topCourse_person" src="<?php echo esc_url(get_theme_file_uri('images/top/img_course-layer.svg')); ?>" alt="" loading="lazy" decoding="async">
        <img class="jwsnj_topCourse_mark" src="<?php echo esc_url(get_theme_file_uri('images/top/img_course-mark.svg')); ?>" alt="" loading="lazy" decoding="async">
        <img class="jwsnj_topCourse_math" src="<?php echo esc_url(get_theme_file_uri('images/top/img_course-math.svg')); ?>" alt="" loading="lazy" decoding="async">
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
