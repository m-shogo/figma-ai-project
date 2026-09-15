<?php

/**
 * 投稿タイプ: shodou-book（月刊書写書道）
 * ACF フィールドのサンプル出力用テンプレート
 *
 * 対象フィールドグループ: group_nbk_gekkan_shodou
 */
get_header();
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
  <section>
    <div class="global_inner _content">
      <div class="gc_main _oneColumn">
        <h1>ACFフィールドの値を取得</h1>
        <h2>月刊書写書道（shodou-book）</h2>

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
        <h3>発行月（shodou_month）</h3>
        <div><?php echo esc_html(get_field('shodou_month')); ?></div>

        <hr>
        <h3>版型・ページ数（size）</h3>
        <div><?php echo esc_html(get_field('size')); ?></div>

        <hr>
        <h3>定価（price）</h3>
        <div><?php echo esc_html(get_field('price')); ?></div>

        <hr>
        <h3>定期購読料（teiki）</h3>
        <div><?php echo get_field('teiki'); ?></div>

        <hr>
        <h3>連載リスト（rensailist）</h3>
        <?php if (have_rows('rensailist')) : ?>
          <?php
          // リピーター行を1件ずつサンプル出力
          while (have_rows('rensailist')) :
            the_row();
            $rensai_pdf  = get_sub_field('rensaipdf');
            $rensai_name = get_sub_field('rensainame');
          ?>
            <div>
              <p>連載PDF（rensaipdf）: <?php echo esc_url($rensai_pdf); ?></p>
              <p>連載名（rensainame）:</p>
              <div><?php echo $rensai_name; ?></div>
            </div>
            <hr>
          <?php endwhile; ?>
        <?php else : ?>
          <div>（データなし）</div>
        <?php endif; ?>

        <hr>
        <h3>TOP画像（topimage）</h3>
        <?php
        $top_image = get_field('topimage');
        if ($top_image) :
        ?>
          <div>
            <p><?php echo esc_url($top_image); ?></p>
            <img src="<?php echo esc_url($top_image); ?>" alt="">
          </div>
        <?php else : ?>
          <div>（データなし）</div>
        <?php endif; ?>

        <hr>
        <h3>TOP用連載リスト（toprensailist）</h3>
        <div><?php echo get_field('toprensailist'); ?></div>

      </div>
    </div>
  </section>
</main>
<?php get_footer(); ?>