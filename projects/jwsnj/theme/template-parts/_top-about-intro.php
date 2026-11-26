<section class="jwsnj_topAbout" aria-labelledby="jwsnj_topAbout_heading">
  <div class="global_inner jwsnj_topAbout_inner">
    <div class="jwsnj_topAbout_copy">
      <h2 id="jwsnj_topAbout_heading" class="jwsnj_topAbout_title">
        <span class="jwsnj_topAbout_en" lang="en">About us</span>
        <span class="jwsnj_topAbout_ja"><img src="<?php echo esc_url(get_theme_file_uri('images/common/ico_blossom.svg')); ?>" width="12" height="12" alt="">ニュージャージー補習授業校とは</span>
      </h2>
      <p class="jwsnj_topAbout_lead"><span class="jwsnj_topAbout_first">すべての生徒が、</span><span class="jwsnj_topAbout_accent">自分らしく</span>輝けるように</p>
      <p class="jwsnj_topAbout_description">ニュージャージー補習授業校は、子どもたちが週末に日本の教育を学ぶ補習授業校です。<br>幼児部から高等部、国際学級まで、日本のことばや文化に触れ、<br>友だちとの交流や学校行事を通して成長できる、もうひとつの学びの場を提供しています。</p>
    </div>
    <div class="jwsnj_topAbout_map" aria-hidden="true">
      <img class="jwsnj_topAbout_shape" src="<?php echo esc_url(get_theme_file_uri('images/top/img_map.svg')); ?>" width="280" height="534" alt="">
      <img class="jwsnj_topAbout_pin01" src="<?php echo esc_url(get_theme_file_uri('images/top/img_map-pin-01.svg')); ?>" width="78" height="95" alt="">
      <img class="jwsnj_topAbout_pin02" src="<?php echo esc_url(get_theme_file_uri('images/top/img_map-pin-02.svg')); ?>" width="77" height="102" alt="">
    </div>
    <?php get_template_part('template-parts/_top-about-cards', null, ['items' => $args['items'] ?? []]); ?>
  </div>
</section>
