<?php

/**
 * 投稿タイプ: tankoubon（単行本）
 * ACF フィールドのサンプル出力用テンプレート
 *
 * 対象フィールドグループ: group_nbk_tankoubon
 */
get_header();
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
  <section>
    <div class="global_inner _content">
      <div class="gc_main _oneColumn">
        <h1>ACFフィールドの値を取得</h1>
        <h2>単行本（tankoubon）</h2>

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
        <h3>ボタンテキスト（readingttl）</h3>
        <div><?php echo esc_html(get_field('readingttl')); ?></div>

        <hr>
        <h3>単行本データ（readingtest）</h3>
        <?php
        $reading_test = get_field('readingtest');
        if ($reading_test) :
        ?>
          <div>
            <p><?php echo esc_url($reading_test); ?></p>
            <p><a href="<?php echo esc_url($reading_test); ?>" target="_blank" rel="noopener noreferrer">ファイルを開く</a></p>
          </div>
        <?php else : ?>
          <div>（データなし）</div>
        <?php endif; ?>

        <hr>
        <h3>著者（book_author）</h3>
        <div><?php echo esc_html(get_field('book_author')); ?></div>

        <hr>
        <h3>本の説明（book_desc）</h3>
        <div><?php echo get_field('book_desc'); ?></div>

        <hr>
        <h3>版型 ページ数等（book_info）</h3>
        <div><?php echo esc_html(get_field('book_info')); ?></div>

        <hr>
        <h3>価格（book_price）</h3>
        <?php
        // 空の場合はテーマ側で「非売品」表示（ACF instructions より）
        $book_price = get_field('book_price');
        ?>
        <div><?php echo $book_price !== '' && $book_price !== null ? esc_html($book_price) : '非売品（値なし）'; ?></div>

        <hr>
        <h3>内容（book_content）</h3>
        <div><?php echo get_field('book_content'); ?></div>

        <hr>
        <h3>Amazonリンク（amazon）</h3>
        <?php
        $amazon_url = get_field('amazon');
        if ($amazon_url) :
        ?>
          <div>
            <p><?php echo esc_url($amazon_url); ?></p>
            <p><a href="<?php echo esc_url($amazon_url); ?>" target="_blank" rel="noopener noreferrer">Amazonへ</a></p>
          </div>
        <?php else : ?>
          <div>（データなし）</div>
        <?php endif; ?>

        <hr>
        <h3>下部ボタン（book_select）</h3>
        <?php
        // ACF は value 文字列（order / read）を返す
        $book_select = get_field('book_select');
        ?>
        <div><?php echo esc_html($book_select ? $book_select : '（未選択）'); ?></div>

        <hr>
        <h3>個別css（css）</h3>
        <pre><?php echo esc_html(get_field('css')); ?></pre>

        <hr>
        <h3>汎用ボタン（book_addbtn）</h3>
        <?php if (have_rows('book_addbtn')) : ?>
          <?php
          while (have_rows('book_addbtn')) :
            the_row();
            $btn_title = get_sub_field('book_btntitle');
            $btn_url   = get_sub_field('book_addurl');
          ?>
            <div>
              <p>ボタンテキスト（book_btntitle）: <?php echo esc_html($btn_title); ?></p>
              <p>URL（book_addurl）: <?php echo esc_url($btn_url); ?></p>
            </div>
            <hr>
          <?php endwhile; ?>
        <?php else : ?>
          <div>（データなし）</div>
        <?php endif; ?>

      </div>
    </div>
  </section>
</main>
<?php get_footer(); ?>