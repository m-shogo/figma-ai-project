<footer id="global_footer" class="global_footer" itemscope itemtype="https://schema.org/WPFooter">
  <!-- Figma footer 221:335 / 506:1632. Decorative SVGs are the verified exports. Contact, SNS and sitemap stay on the WordPress menu. -->
  <div class="gf_brandStatement">
    <img class="gf_brandStatement-left is-sp" src="<?php echo esc_url(get_template_directory_uri() . '/images/common/footer/img_footer-left-sp.svg'); ?>" alt="" width="155" height="82" decoding="async">
    <img class="gf_brandStatement-left is-pc" src="<?php echo esc_url(get_template_directory_uri() . '/images/common/footer/img_footer-left.svg'); ?>" alt="" width="408" height="100" decoding="async">
    <div class="gf_brandStatement-copy">
      <p class="gf_brandStatement-en">LEARN IN JAPANESE.<br>CONNECT WITH JAPAN.</p>
      <p class="gf_brandStatement-ja">土曜日、日本とつながる学びの時間</p>
    </div>
    <span class="gf_brandStatement-right is-sp" aria-hidden="true">
      <img class="gf_brandStatement-line" src="<?php echo esc_url(get_template_directory_uri() . '/images/common/footer/img_footer-line-sp.svg'); ?>" alt="" width="117" height="1" decoding="async">
      <img class="gf_brandStatement-student" src="<?php echo esc_url(get_template_directory_uri() . '/images/common/footer/img_student-01-sp.svg'); ?>" alt="" width="38" height="60" decoding="async">
      <img class="gf_brandStatement-puzzle" src="<?php echo esc_url(get_template_directory_uri() . '/images/common/footer/img_puzzle-02-sp.svg'); ?>" alt="" width="80" height="60" decoding="async">
    </span>
    <span class="gf_brandStatement-right is-pc" aria-hidden="true">
      <img class="gf_brandStatement-line" src="<?php echo esc_url(get_template_directory_uri() . '/images/common/footer/img_footer-line.svg'); ?>" alt="" width="309" height="1" decoding="async">
      <img class="gf_brandStatement-student" src="<?php echo esc_url(get_template_directory_uri() . '/images/common/footer/img_student-01.svg'); ?>" alt="" width="49" height="76" decoding="async">
      <img class="gf_brandStatement-puzzle" src="<?php echo esc_url(get_template_directory_uri() . '/images/common/footer/img_puzzle-02.svg'); ?>" alt="" width="100" height="76" decoding="async">
    </span>
  </div>
  <div class="gf_details global_inner">
    <div class="gf_information">
      <p class="gf_logo">
        <a href="<?php echo esc_url(home_url('/')); ?>">
          <img src="<?php echo esc_url(get_template_directory_uri() . '/images/common/img_njws-logo.svg'); ?>" alt="" width="51" height="48" decoding="async">
          <span><?php echo esc_html(get_bloginfo('name')); ?></span>
        </a>
      </p>
    </div>
    <?php
    // An unassigned or empty menu must not reserve a blank layout row or landmark.
    $footer_menu = wp_nav_menu(array(
      'menu_class' => 'menu gf_links-01',
      'menu_id' => 'gf_links-01',
      'container' => 'div',
      'container_class' => 'gf_container-01',
      'container_id' => 'gf_container-01',
      'fallback_cb' => false,
      'theme_location' => 'footer-nav',
      'walker' => new Custom_Footer_Walker_Nav_Menu(),
      'echo' => false,
    ));
    if (is_string($footer_menu) && trim($footer_menu) !== '') :
    ?>
      <div class="gf_links-wrap">
        <nav class="gf_menu" aria-label="フッターナビゲーション">
          <?php echo $footer_menu; // WordPress generates and filters this menu markup. ?>
        </nav>
      </div>
    <?php endif; ?>
  </div>
  <div class="gf_bottom">
    <p class="gf_copyright"><span>&copy; <?php echo esc_html(wp_date('Y')); ?> <?php echo esc_html(get_bloginfo('name')); ?></span></p>
    <p id="js_gf_pageTop" class="gf_pageTop">
      <a href="#" aria-label="ページトップへ戻る"><span>ページトップへ戻る</span></a>
    </p>
  </div>
</footer>