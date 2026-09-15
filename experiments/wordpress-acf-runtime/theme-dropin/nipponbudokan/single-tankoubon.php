<?php

/**
 * 投稿タイプ: tankoubon（単行本）
 * ACF フィールドのサンプル出力用テンプレート
 *
 * 対象フィールドグループ: group_nbk_tankoubon
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
        <h2>単行本（tankoubon）</h2>

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

        <?php $v = get_field('readingttl'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>ボタンテキスト（readingttl）</h3>
        <div><?php echo esc_html($v); ?></div>
        <?php endif; ?>

        <?php
        $reading_test = get_field('readingtest');
        if (nbk_acf_value_present($reading_test)) :
        ?>
        <hr>
        <h3>単行本データ（readingtest）</h3>
          <div>
            <p><?php echo esc_url($reading_test); ?></p>
            <p><a href="<?php echo esc_url($reading_test); ?>" target="_blank" rel="noopener noreferrer">ファイルを開く</a></p>
          </div>
        <?php endif; ?>

        <?php $v = get_field('book_author'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>著者（book_author）</h3>
        <div><?php echo esc_html($v); ?></div>
        <?php endif; ?>

        <?php $v = get_field('book_desc'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>本の説明（book_desc）</h3>
        <div><?php echo $v; ?></div>
        <?php endif; ?>

        <?php $v = get_field('book_info'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>版型 ページ数等（book_info）</h3>
        <div><?php echo esc_html($v); ?></div>
        <?php endif; ?>

        <?php $v = get_field('book_price'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>価格（book_price）</h3>
        <div><?php echo esc_html($v); ?></div>
        <?php endif; ?>

        <?php $v = get_field('book_content'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>内容（book_content）</h3>
        <div><?php echo $v; ?></div>
        <?php endif; ?>

        <?php
        $amazon_url = get_field('amazon');
        if (nbk_acf_value_present($amazon_url)) :
        ?>
        <hr>
        <h3>Amazonリンク（amazon）</h3>
          <div>
            <p><?php echo esc_url($amazon_url); ?></p>
            <p><a href="<?php echo esc_url($amazon_url); ?>" target="_blank" rel="noopener noreferrer">Amazonへ</a></p>
          </div>
        <?php endif; ?>

        <?php $v = get_field('book_select'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>下部ボタン（book_select）</h3>
        <div><?php echo esc_html(is_array($v) ? implode(', ', $v) : $v); ?></div>
        <?php endif; ?>

        <?php $v = get_field('css'); if (nbk_acf_value_present($v)) : ?>
        <hr>
        <h3>個別css（css）</h3>
        <pre><?php echo esc_html($v); ?></pre>
        <?php endif; ?>

        <?php if (have_rows('book_addbtn')) : ?>
        <hr>
        <h3>汎用ボタン（book_addbtn）</h3>
          <?php
          while (have_rows('book_addbtn')) :
            the_row();
            $btn_title = get_sub_field('book_btntitle');
            $btn_url   = get_sub_field('book_addurl');
            if (!nbk_acf_value_present($btn_title) && !nbk_acf_value_present($btn_url)) {
              continue;
            }
          ?>
            <div>
              <?php if (nbk_acf_value_present($btn_title)) : ?>
              <p>ボタンテキスト（book_btntitle）: <?php echo esc_html($btn_title); ?></p>
              <?php endif; ?>
              <?php if (nbk_acf_value_present($btn_url)) : ?>
              <p>URL（book_addurl）: <?php echo esc_url($btn_url); ?></p>
              <?php endif; ?>
            </div>
            <hr>
          <?php endwhile; ?>
        <?php endif; ?>

      </div>
    </div>
  </section>
</main>
<?php get_footer(); ?>
