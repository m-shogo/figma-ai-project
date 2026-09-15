<?php

/**
 * 投稿タイプ: budo-book（月刊「武道」）
 * ACF フィールドのサンプル出力用テンプレート
 *
 * 対象フィールドグループ:
 * - group_nbk_gekkan_budo（月刊武道）
 * - group_nbk_rensai（連載入力欄）
 * - group_nbk_sousakuin（総索引）
 */
get_header();
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
  <section>
    <div class="global_inner _content">
      <div class="gc_main _oneColumn">
        <h1>ACFフィールドの値を取得</h1>
        <h2>月刊「武道」（budo-book）</h2>

        <hr>
        <h3>the_content</h3>
        <div><?php the_content(); ?></div>

        <hr>
        <h3>the_title</h3>
        <div><?php the_title(); ?></div>

        <hr>
        <h3>the_excerpt</h3>
        <div><?php the_excerpt(); ?></div>

        <hr>
        <h3>the_permalink</h3>
        <div><?php the_permalink(); ?></div>

        <hr>
        <h3>the_post_thumbnail</h3>
        <div><?php the_post_thumbnail(); ?></div>

        <hr>
        <h3>the_time</h3>
        <div><?php the_time(); ?></div>

        <hr>
        <h2>■ 月刊武道（group_nbk_gekkan_budo）</h2>

        <hr>
        <h3>発行月（budo_month）</h3>
        <div><?php echo esc_html(get_field('budo_month')); ?></div>

        <hr>
        <h3>版型（budo_size）</h3>
        <div><?php echo esc_html(get_field('budo_size')); ?></div>

        <hr>
        <h3>ページ数（budo_page）</h3>
        <div><?php echo esc_html(get_field('budo_page')); ?></div>

        <hr>
        <h3>定価（budo_price）</h3>
        <div><?php echo esc_html(get_field('budo_price')); ?></div>

        <hr>
        <h3>定期購読料（budo_teiki）</h3>
        <div><?php echo get_field('budo_teiki'); ?></div>

        <hr>
        <h3>トップ掲載用画像（budo_topimg）</h3>
        <?php
        $budo_topimg = get_field('budo_topimg');
        if ($budo_topimg) :
        ?>
          <div>
            <p><?php echo esc_url($budo_topimg); ?></p>
            <img src="<?php echo esc_url($budo_topimg); ?>" alt="">
          </div>
        <?php else : ?>
          <div>（データなし）</div>
        <?php endif; ?>

        <hr>
        <h3>今月のピックアップ（budo_pickup）</h3>
        <?php if (have_rows('budo_pickup')) : ?>
          <?php
          while (have_rows('budo_pickup')) :
            the_row();
            $pickup_ttl = get_sub_field('budo_pickup_ttl');
            $pickup_txt = get_sub_field('budo_pickup_txt');
            $pickup_img = get_sub_field('budo_pickup_img');
          ?>
            <div>
              <p>タイトル（budo_pickup_ttl）: <?php echo esc_html($pickup_ttl); ?></p>
              <p>テキスト（budo_pickup_txt）:</p>
              <div><?php echo $pickup_txt; ?></div>
              <p>写真（budo_pickup_img）: <?php echo esc_url($pickup_img); ?></p>
              <?php if ($pickup_img) : ?>
                <img src="<?php echo esc_url($pickup_img); ?>" alt="">
              <?php endif; ?>
            </div>
            <hr>
          <?php endwhile; ?>
        <?php else : ?>
          <div>（データなし）</div>
        <?php endif; ?>

        <hr>
        <h3>今月のおすすめ（monthpickup）</h3>
        <?php if (have_rows('monthpickup')) : ?>
          <?php
          while (have_rows('monthpickup')) :
            the_row();
            $pickup_img   = get_sub_field('pickupImg');
            $pickup_title = get_sub_field('pickuptitle');
            $pickup_desc  = get_sub_field('pickupdesc');
          ?>
            <div>
              <p>写真（pickupImg）: <?php echo esc_url($pickup_img); ?></p>
              <?php if ($pickup_img) : ?>
                <img src="<?php echo esc_url($pickup_img); ?>" alt="">
              <?php endif; ?>
              <p>タイトル（pickuptitle）:</p>
              <div><?php echo $pickup_title; ?></div>
              <p>その他（pickupdesc）:</p>
              <div><?php echo $pickup_desc; ?></div>
            </div>
            <hr>
          <?php endwhile; ?>
        <?php else : ?>
          <div>（データなし）</div>
        <?php endif; ?>

        <hr>
        <h3>今月の特集・企画（budo_speacial）</h3>
        <div><?php echo get_field('budo_speacial'); ?></div>

        <hr>
        <h3>新連載（budo_new）</h3>
        <div><?php echo get_field('budo_new'); ?></div>

        <hr>
        <h3>好評連載中（budo_rensai）</h3>
        <div><?php echo get_field('budo_rensai'); ?></div>

        <hr>
        <h3>特別寄稿（budo_contribution）</h3>
        <div><?php echo get_field('budo_contribution'); ?></div>

        <hr>
        <h3>随筆（budo_zuihitsu）</h3>
        <div><?php echo get_field('budo_zuihitsu'); ?></div>

        <hr>
        <h3>武道カレンダー（budo_calender）</h3>
        <div><?php echo get_field('budo_calender'); ?></div>

        <hr>
        <h3>少年少女武道優良団体（budo_dantai）</h3>
        <div><?php echo get_field('budo_dantai'); ?></div>

        <hr>
        <h3>退任のご挨拶（budo_tainin）</h3>
        <div><?php echo get_field('budo_tainin'); ?></div>

        <hr>
        <h3>今月のニュース（budo_news）</h3>
        <div><?php echo get_field('budo_news'); ?></div>

        <hr>
        <h3>特別レポート（budo_report）</h3>
        <div><?php echo get_field('budo_report'); ?></div>

        <hr>
        <h3>総目次（budo_mokuji）</h3>
        <div><?php echo get_field('budo_mokuji'); ?></div>

        <hr>
        <h3>バックナンバー用リスト（budo_backcontent）</h3>
        <div><?php echo get_field('budo_backcontent'); ?></div>

        <hr>
        <h3>TOP用掲載内容（budo_topcontent）</h3>
        <div><?php echo get_field('budo_topcontent'); ?></div>

        <hr>
        <h2>■ 連載入力欄（group_nbk_rensai）</h2>

        <hr>
        <h3>タイトル（rensai_title）</h3>
        <div><?php echo esc_html(get_field('rensai_title')); ?></div>

        <hr>
        <h3>紹介文（rensai_desc）</h3>
        <div><?php echo esc_html(get_field('rensai_desc')); ?></div>

        <hr>
        <h3>PDFファイル（rensai_pdf）</h3>
        <?php
        $rensai_pdf = get_field('rensai_pdf');
        if ($rensai_pdf) :
        ?>
          <div>
            <p><?php echo esc_url($rensai_pdf); ?></p>
            <p><a href="<?php echo esc_url($rensai_pdf); ?>" target="_blank" rel="noopener noreferrer">PDFを開く</a></p>
          </div>
        <?php else : ?>
          <div>（データなし）</div>
        <?php endif; ?>

        <hr>
        <h2>■ 総索引（group_nbk_sousakuin）</h2>

        <hr>
        <h3>総索引ファイル（sousakuin）</h3>
        <?php
        $sousakuin = get_field('sousakuin');
        if ($sousakuin) :
        ?>
          <div>
            <p><?php echo esc_url($sousakuin); ?></p>
            <p><a href="<?php echo esc_url($sousakuin); ?>" target="_blank" rel="noopener noreferrer">総索引を開く</a></p>
          </div>
        <?php else : ?>
          <div>（データなし）</div>
        <?php endif; ?>

      </div>
    </div>
  </section>
</main>
<?php get_footer(); ?>