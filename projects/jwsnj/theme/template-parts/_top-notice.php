<?php
// Existing ACF owner: display flag, repeater, raw date, text and hide flag.
if (!function_exists('get_field') || !function_exists('have_rows') || !get_field('top_notice_select')) {
  return;
}
$notices = [];
while (have_rows('top_notice-01')) {
  the_row();
  if (get_sub_field('none')) {
    continue;
  }
  $body = wp_kses_post((string) get_sub_field('textarea'));
  if (trim(wp_strip_all_tags($body)) === '') {
    continue;
  }
  $raw_date = get_sub_field('date', false);
  $date = is_string($raw_date) && preg_match('/^\d{8}$/D', $raw_date)
    ? DateTimeImmutable::createFromFormat('!Ymd', $raw_date) : false;
  if ($date && $date->format('Ymd') !== $raw_date) {
    $date = false;
  }
  $notices[] = ['body' => $body, 'date' => $date];
}
if (!$notices) {
  return;
}
?>
<section id="top_notice-01" class="top_notice-01" aria-labelledby="top-notice-heading">
  <div class="global_inner jwsnj_topNotice_inner">
    <div class="jwsnj_topNotice_box">
      <h2 id="top-notice-heading" class="jwsnj_topNotice_title"><span class="jwsnj_topNotice_bell" aria-hidden="true"></span><span class="jwsnj_topNotice_label">重要なお知らせ</span></h2>
      <ul class="jwsnj_topNotice_list">
        <?php foreach ($notices as $notice) : ?>
          <li>
            <?php if ($notice['date']) : ?>
              <time datetime="<?php echo esc_attr($notice['date']->format('Y-m-d')); ?>"><?php echo esc_html($notice['date']->format('Y.m.d')); ?></time>
            <?php endif; ?>
            <div class="jwsnj_topNotice_text"><?php echo $notice['body']; ?></div>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>
  </div>
</section>
