<?php
/**
 * CPT event 詳細。
 * Figma PC 1632:10382。下端の区切り・一覧へ戻る・余白は News single（PC 1235:6361 / SP 1451:5197）と同じ。
 */
global $post;
?>
<?php get_header(); ?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <?php if (!post_password_required($post->ID)) : ?>
            <article>
                <div class="module_titleSingle">
                    <div class="head">
                        <?php
                        $event_date_short = nipponbudokan_event_date_short();
                        $event_date_ts = nipponbudokan_event_datetime();
                        ?>
                        <?php if ($event_date_short !== '') : ?>
                        <p class="date">
                            <time datetime="<?php echo esc_attr(wp_date('Y-m-d', $event_date_ts)); ?>"><?php echo esc_html($event_date_short); ?></time>
                        </p>
                        <?php endif; ?>
                        <?php
                        get_template_part('template-parts/_label-category', null, [
                            'taxonomy' => '_cat',
                        ]);
                        ?>
                    </div>
                    <div class="body">
                        <h1 class="module_title-01"><?php the_title(); ?></h1>
                    </div>
                </div>

                <div class="global_inner _content">
                    <div class="gc_main _oneColumn">
                        <div class="block-editor_wrap">
                            <?php the_content(); ?>
                        </div>
                        <hr class="wp-block-separator has-alpha-channel-opacity">

                        <ul class="module_pager-02">
                            <?php
                            $back_link = get_post_type_archive_link('event');
                            if (!$back_link) {
                                $back_link = home_url('/');
                            }
                            ?>
                            <li class="back">
                                <a href="<?php echo esc_url($back_link); ?>"><span>一覧へ戻る</span></a>
                            </li>
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
