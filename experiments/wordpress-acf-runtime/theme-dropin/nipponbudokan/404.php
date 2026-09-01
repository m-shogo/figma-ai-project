<?php get_header(); ?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <div class="global_inner _content">
            <div class="gc_main _oneColumn">
                <p>
                    いつも当サイトをご覧頂きありがとうございます。<br>
                    申し訳ございませんが、あなたがアクセスしようとしたページは削除されたかURLが変更されています。<br>
                    お手数をおかけしますが、下記の検索ボックスからもう一度目的のページをお探しください。
                </p>
                <div class="module_search-01">
                    <form class="ms_from" role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>">
                        <input class="ms_input c-moduleInput" type="search" name="s" placeholder="サイト内検索">
                        <button class="ms_button" type="submit"><span></span></button>
                    </form>
                </div>
                <div class="block-editor_wrap">
                    <div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
                    <div class="wp-block-buttons is-content-justification-center is-layout-flex wp-block-buttons-is-layout-flex">
                        <div class="wp-block-button">
                            <a href="<?php echo esc_url(home_url('/')); ?>" class="wp-block-button__link has-text-align-left wp-element-button">TOPへ戻る</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>