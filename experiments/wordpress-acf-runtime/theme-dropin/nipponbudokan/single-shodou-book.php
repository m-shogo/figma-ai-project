<?php

/**
 * 投稿タイプ: shodou-book（月刊書写書道）
 * ACF フィールドのサンプル出力用テンプレート
 *
 * 対象フィールドグループ: group_nbk_gekkan_shodou
 *
 * 空のフィールドは出力しない。代替文言は出さない。ACF JSON は編集しない。
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
  <section>
    <div class="global_inner _content">
      <div class="gc_main _oneColumn">
        <h1>ACFフィールドの値を取得</h1>
        <h2>月刊書写書道（shodou-book）</h2>

        <?php if (nbk_acf_value_present(get_post()->post_content)) : ?>
        <hr>
        <h3>the_content</h3>
        <div><?php the_content(); ?></div>
        <?php endif; ?>

        <hr>
        <h3>the_title</h3>
        <div><?php the_title(); ?></div>

        <?php if (has_excerpt()) : ?>
        <hr>
        <h3>the_excerpt</h3>
        <div><?php the_excerpt(); ?></div>
        <?php endif; ?>

        <hr>
        <h3>the_permalink</h3>
        <div><?php the_permalink(); ?></div>

        <?php if (has_post_thumbnail()) : ?>
        <hr>
        <h3>the_post_thumbnail</h3>
        <div><?php the_post_thumbnail(); ?></div>
        <?php endif; ?>

        <hr>
        <h3>the_time</h3>
        <div><?php the_time(); ?></div>

        <?php $v = get_field('shodou_month'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>発行月（shodou_month）</h3>
        <div><?php echo esc_html($v); ?></div>
        <?php endif; ?>

        <?php $v = get_field('size'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>版型・ページ数（size）</h3>
        <div><?php echo esc_html($v); ?></div>
        <?php endif; ?>

        <?php $v = get_field('price'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>定価（price）</h3>
        <div><?php echo esc_html($v); ?></div>
        <?php endif; ?>

        <?php $v = get_field('teiki'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>定期購読料（teiki）</h3>
        <div><?php echo $v; ?></div>
        <?php endif; ?>

        <?php if (have_rows('rensailist')) : ?>
        <hr>
        <h3>連載リスト（rensailist）</h3>
          <?php
          while (have_rows('rensailist')) :
            the_row();
            $rensai_pdf  = get_sub_field('rensaipdf');
            $rensai_name = get_sub_field('rensainame');
            if (!nbk_acf_value_present($rensai_pdf) && !nbk_acf_value_present($rensai_name)) {
              continue;
            }
          ?>
            <div>
              <?php if (nbk_acf_value_present($rensai_pdf)) : ?>
              <p>連載PDF（rensaipdf）: <?php echo esc_url($rensai_pdf); ?></p>
              <?php endif; ?>
              <?php if (nbk_acf_value_present($rensai_name)) : ?>
              <p>連載名（rensainame）:</p>
              <div><?php echo $rensai_name; ?></div>
              <?php endif; ?>
            </div>
            <hr>
          <?php endwhile; ?>
        <?php endif; ?>

        <?php
        $top_image = get_field('topimage');
        if (nbk_acf_value_present($top_image)) :
        ?>
        <hr>
        <h3>TOP画像（topimage）</h3>
          <div>
            <p><?php echo esc_url($top_image); ?></p>
            <img src="<?php echo esc_url($top_image); ?>" alt="">
          </div>
        <?php endif; ?>

        <?php $v = get_field('toprensailist'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>TOP用連載リスト（toprensailist）</h3>
        <div><?php echo $v; ?></div>
        <?php endif; ?>

      </div>
    </div>
  </section>
</main>
<?php get_footer(); ?>
