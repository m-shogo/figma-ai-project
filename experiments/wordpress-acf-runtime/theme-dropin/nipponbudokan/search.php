<?php
global $post, $wp_query;
?>
<?php get_header(); ?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <div class="global_inner _content">
            <div class="gc_main _oneColumn">
                <?php if (empty(get_search_query())) : //検索キーワードが入っているか 
                ?>
                    <div class="block-editor_wrap">
                        <h2 class="wp-block-heading"><span>お探しのページは見つかりませんでした</span></h2>
                        <p>
                            いつも当サイトをご覧頂きありがとうございます。<br>
                            申し訳ございませんが、あなたがアクセスしようとしたページは削除されたかURLが変更されています。<br>
                            お手数をおかけしますが、下記の検索ボックスからもう一度目的のページをお探し下さい。
                        </p>
                        <div class="module_search-01">
                            <form class="ms_from" role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>">
                                <input class="ms_input" type="search" name="s" placeholder="サイト内検索">
                                <button class="ms_button" type="submit"><span></span></button>
                            </form>
                        </div>
                        <div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
                        <div class="wp-block-buttons is-content-justification-center is-layout-flex wp-block-buttons-is-layout-flex">
                            <div class="wp-block-button">
                                <a href="<?php echo esc_url(home_url('/')); ?>" class="wp-block-button__link has-text-align-left wp-element-button">TOPへ戻る</a>
                            </div>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="block-editor_wrap">
                        <h2 class="wp-block-heading"><span><?php the_search_query(); ?>の検索結果 : <?php echo $wp_query->found_posts; ?>件</span></h2>
                    </div>
                    <?php if (have_posts()) : ?>
                        <ul class="module_searchList-01">
                            <?php while (have_posts()) : the_post(); ?>
                                <?php
                                // post_typeによるリンクや属性を取得
                                $link_attrs = get_post_link_attributes();
                                ?>
                                <li>
                                    <a href="<?php echo esc_url($link_attrs['url']); ?>" <?php echo $link_attrs['targetAttr']; ?>>
                                        <div class="inner">
                                            <p class="title"><?php the_title(); ?></p>
                                        </div>
                                    </a>
                                </li>
                            <?php endwhile; ?>
                        </ul>
                        <?php get_template_part('template-parts/_pagination'); ?>
                    <?php else: ?>
                        <div class="block-editor_wrap">
                            <h4 class="wp-block-heading"><span>お探しのページは見つかりませんでした</span></h4>
                            <p>
                                いつも当サイトをご覧頂きありがとうございます。<br>
                                申し訳ございませんが、あなたがアクセスしようとしたページは削除されたかURLが変更されています。<br>
                                お手数をおかけしますが、下記の検索ボックスからもう一度目的のページをお探し下さい。
                            </p>
                            <div class="module_search-01">
                                <form class="ms_from" role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>">
                                    <input class="ms_input" type="search" name="s" placeholder="サイト内検索">
                                    <button class="ms_button" type="submit"><span></span></button>
                                </form>
                            </div>
                            <div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
                            <div class="wp-block-buttons is-content-justification-center is-layout-flex wp-block-buttons-is-layout-flex">
                                <div class="wp-block-button">
                                    <a href="<?php echo esc_url(home_url('/')); ?>" class="wp-block-button__link has-text-align-left wp-element-button">TOPへ戻る</a>
                                </div>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        </div>
        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>