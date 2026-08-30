<?php
global $post;

// リンク無しの場合のリダイレクト処理
if (get_field('post_type') === 'none') {
    wp_safe_redirect(home_url('/404/'));
    exit;
}

// URLタイプのリダイレクト処理
if (get_field('post_type') === 'url') {
    $postType_url = get_field('postType_url');

    if ($postType_url && filter_var($postType_url, FILTER_VALIDATE_URL)) {
        wp_redirect(esc_url_raw($postType_url));
        exit;
    }

    wp_safe_redirect(home_url('/404/'));
    exit;
}

// ファイルタイプのリダイレクト処理
if (get_field('post_type') === 'file') {
    $postType_file = get_field('postType_file');

    if ($postType_file) {
        $postType_url = is_array($postType_file) ? $postType_file['url'] : $postType_file;
        if ($postType_url && filter_var($postType_url, FILTER_VALIDATE_URL)) {
            wp_redirect(esc_url_raw($postType_url));
            exit;
        }
    }

    wp_safe_redirect(home_url('/404/'));
    exit;
}
?>
<?php get_header(); ?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <?php if (!post_password_required($post->ID)) : ?>
            <article itemscope itemtype="https://schema.org/NewsArticle">
                <meta itemprop="datePublished" content="<?php echo esc_attr(get_the_time('c')); ?>">
                <meta itemprop="dateModified" content="<?php echo esc_attr(get_the_modified_date('c')); ?>">
                <span itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
                    <meta itemprop="name" content="<?php echo esc_attr(get_bloginfo('name')); ?>">
                </span>
                <span itemprop="author" itemscope itemtype="https://schema.org/Organization">
                    <meta itemprop="name" content="<?php echo esc_attr(get_bloginfo('name')); ?>">
                    <meta itemprop="url" content="<?php echo esc_url(home_url('/')); ?>">
                </span>

                <div class="module_titleSingle">
                    <div class="head">
                        <p class="date">
                            <time datetime="<?php echo esc_attr(get_the_time('Y-m-d')); ?>"><?php the_time('Y.m.d'); ?></time>
                        </p>
                        <?php
                        get_template_part('template-parts/_label-category', null, [
                            'taxonomy' => '_cat',
                        ]);
                        ?>
                    </div>
                    <div class="body">
                        <h1 class="module_title-01"><span itemprop="headline"><?php the_title(); ?></span></h1>
                    </div>
                </div>

                <div class="global_inner _content">
                    <div class="gc_main _oneColumn">
                        <?php
                        $thumbnailId = get_post_thumbnail_id($post->ID);
                        $thumb = $thumbnailId ? wp_get_attachment_image_src($thumbnailId, 'full') : false;
                        $caption = $thumbnailId ? wp_get_attachment_caption($thumbnailId) : '';
                        ?>
                        <?php if ($thumbnailId && $thumb) : ?>
                            <figure class="single_featured">
                                <img itemprop="image" src="<?php echo esc_url($thumb[0]); ?>" alt="<?php echo esc_attr(get_post_meta($thumbnailId, '_wp_attachment_image_alt', true) ?: get_the_title()); ?>" width="800" height="534">
                                <?php if ($caption) : ?>
                                    <figcaption><?php echo esc_html($caption); ?></figcaption>
                                <?php endif; ?>
                            </figure>
                        <?php endif; ?>
                        <div class="block-editor_wrap" itemprop="articleBody">
                            <?php the_content(); ?>
                        </div>

                        <ul class="module_pager-02">
                            <?php
                            // ACF「投稿選択」が「記事（post）」の投稿のみを前後ナビの対象とする
                            $prev_post = get_adjacent_article_post('previous');
                            $next_post = get_adjacent_article_post('next');
                            $post_Type = esc_html(get_post_type_object(get_post_type())->name);
                            ?>
                            <?php if ($prev_post): ?>
                                <li class="prev">
                                    <a href="<?php echo esc_url(get_permalink($prev_post->ID)); ?>"><span>前へ</span></a>
                                </li>
                            <?php else: ?>
                                <li class="prev _hidden"><span>前へ</span></li>
                            <?php endif; ?>
                            <?php $back_link = get_post_type() === 'post' ? get_permalink(get_option('page_for_posts')) : home_url() . '/' . $post_Type . '/'; ?>
                            <li class="back">
                                <a href="<?php echo esc_url($back_link); ?>"><span>一覧へ戻る</span></a>
                            </li>
                            <?php if ($next_post): ?>
                                <li class="next">
                                    <a href="<?php echo esc_url(get_permalink($next_post->ID)); ?>"><span>次へ</span></a>
                                </li>
                            <?php else: ?>
                                <li class="next _hidden"><span>次へ</span></li>
                            <?php endif; ?>
                        </ul>
                    </div>
                </div>
            </article>
        <?php else: ?>
            <div class="global_inner _content">
                <div class="module_password">
                    <?php echo get_the_password_form(); ?>
                </div>
            </div>
        <?php endif; ?>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>