<div class="global_inner">
    <?php if (get_current_post_type() === 'post' || is_category()): ?>
        <nav class="archive_navigation" id="archive_navigation">
            <ul class="ln_links module_dropdown">
                <li class="lnl_item-02 mdd_item-02 _hasChild">
                    <div class="lnl_title-02 mdd_title-02">
                        <div class="lnl_link-02 mdd_link-02">
                            <span>カテゴリー</span>
                        </div>
                        <button class="lnl_button-02 mdd_button-02" type="button"><span>開閉</span></button>
                    </div>
                    <div class="lnl_wrapper-02 mdd_wrapper-02">
                        <div class="lnl_inner-02 mdd_inner-02">
                            <ul class="lnl_list-02 mdd_list-02">
                                <li class="lnl_item-03 mdd_item-03 _noChild">
                                    <div class="lnl_title-03 mdd_title-03">
                                        <a class="lnl_link-03 mdd_link-03" href="<?php echo get_permalink(get_option('page_for_posts')); ?>">
                                            <span>すべて</span>
                                        </a>
                                    </div>
                                </li>
                                <?php
                                $args = array(
                                    'post_type' => 'post', // 投稿タイプの指定
                                    'orderby' => 'id',
                                    'hide_empty' => false, // 投稿がないカテゴリを出すかどうか
                                    'parent' => 0,
                                );
                                $categories = get_categories($args);
                                ?>
                                <?php foreach ($categories as $category) : ?>
                                    <?php
                                    //カテゴリのリンクURLを取得
                                    $cat_link = get_category_link($category->cat_ID);
                                    //子カテゴリのIDを配列で取得。配列の長さを変数に格納
                                    $child_cat_num = count(get_term_children($category->cat_ID, 'category'));
                                    //子カテゴリが存在する場合
                                    ?>
                                    <?php if ($child_cat_num > 0) : ?>
                                        <li class="lnl_item-03 mdd_item-03 _hasChild">
                                            <div class="lnl_title-03 mdd_title-03">
                                                <a class="lnl_link-03 mdd_link-03" href="<?php echo esc_url($cat_link); ?>">
                                                    <span><?php echo esc_html($category->name); ?></span>
                                                </a>
                                                <button class="lnl_button-03 mdd_button-03" type="button"><span>開閉</span></button>
                                            </div>
                                            <div class="lnl_wrapper-03 mdd_wrapper-03">
                                                <div class="lnl_inner-03 mdd_inner-03">
                                                    <ul class="lnl_list-03 mdd_list-03">
                                                        <?php
                                                        //子カテゴリの一覧取得条件
                                                        $category_children_args = array(
                                                            'orderby' => 'id',
                                                            'hide_empty' => 0,
                                                            'parent' => $category->cat_ID,
                                                        );
                                                        //子カテゴリの一覧取得
                                                        $category_children = get_categories($category_children_args);
                                                        //子カテゴリの数だけリスト出力
                                                        ?>
                                                        <?php foreach ($category_children as $child_val) : ?>
                                                            <?php
                                                            $cat_link = get_category_link($child_val->cat_ID);
                                                            ?>
                                                            <li class="lnl_item-04 mdd_item-04 _noChild">
                                                                <div class="lnl_title-04 mdd_title-04">
                                                                    <a class="lnl_link-04 mdd_link-04" href="<?php echo esc_url($cat_link); ?>">
                                                                        <span><?php echo esc_html($child_val->name); ?></span>
                                                                    </a>
                                                                </div>
                                                            </li>
                                                        <?php endforeach; ?>
                                                    </ul>
                                                </div>
                                            </div>
                                        </li>
                                    <?php else: ?>
                                        <li class="lnl_item-03 mdd_item-03 _noChild">
                                            <div class="lnl_title-03 mdd_title-03">
                                                <a class="lnl_link-03 mdd_link-03" href="<?php echo esc_url($cat_link); ?>">
                                                    <span><?php echo esc_html($category->name); ?></span>
                                                </a>
                                            </div>
                                        </li>
                                    <?php endif; ?>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    </div>
                </li>
            </ul>
            <ul class="ln_links module_dropdown">
                <li class="lnl_item-02 mdd_item-02 _hasChild">
                    <div class="lnl_title-02 mdd_title-02">
                        <div class="lnl_link-02 mdd_link-02">
                            <span>アーカイブ</span>
                        </div>
                        <button class="lnl_button-02 mdd_button-02" type="button"><span>開閉</span></button>
                    </div>
                    <div class="lnl_wrapper-02 mdd_wrapper-02">
                        <div class="lnl_inner-02 mdd_inner-02">
                            <ul class="lnl_list-02 mdd_list-02">
                                <?php if (in_array('post', get_fiscal_year_post_types(), true)): ?>
                                    <?php
                                    $archives = get_archives_by_fiscal_year();
                                    ?>
                                    <?php foreach ($archives as $archive): ?>
                                        <li class="lnl_item-03 mdd_item-03 _noChild">
                                            <div class="lnl_title-03 mdd_title-03">
                                                <a class="lnl_link-03 mdd_link-03" href="<?php echo esc_url(get_year_link($archive->year)); ?>">
                                                    <span><?php echo esc_html($archive->year) ?>年度</span>
                                                </a>
                                            </div>
                                        </li>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <?php
                                    $year_query = new WP_Query(array(
                                        'post_type' => 'post',
                                        'orderby' => 'date',
                                        'order' => 'DESC',
                                        'posts_per_page' => -1,
                                        'ignore_sticky_posts' => true,
                                    ));
                                    $displayed_year = null;
                                    ?>
                                    <?php while ($year_query->have_posts()) : $year_query->the_post(); ?>
                                        <?php
                                        $current_year = get_the_date('Y');
                                        ?>
                                        <?php if ($displayed_year !== $current_year): ?>
                                            <?php
                                            $displayed_year = $current_year;
                                            ?>
                                            <li class="lnl_item-03 mdd_item-03 _noChild">
                                                <div class="lnl_title-03 mdd_title-03">
                                                    <a class="lnl_link-03 mdd_link-03" href="<?php echo esc_url(get_year_link($current_year)); ?>">
                                                        <span><?php echo esc_html($current_year) ?>年</span>
                                                    </a>
                                                </div>
                                            </li>
                                        <?php endif; ?>
                                    <?php endwhile; ?>
                                    <?php wp_reset_postdata(); ?>
                                <?php endif; ?>
                            </ul>
                        </div>
                    </div>
                </li>
            </ul>
        </nav>
    <?php else: ?>
        <?php
        // その他カスタム投稿
        ?>
        <nav class="archive_navigation" id="archive_navigation">
            <ul class="an_links module_dropdown">
                <li class="anl_item-02 mdd_item-02 _hasChild">
                    <div class="anl_title-02 mdd_title-02">
                        <div class="anl_link-02 mdd_link-02">
                            <span>カテゴリー</span>
                        </div>
                        <button class="anl_button-02 mdd_button-02" type="button"><span>開閉</span></button>
                    </div>
                    <div class="anl_wrapper-02 mdd_wrapper-02">
                        <div class="anl_inner-02 mdd_inner-02">
                            <ul class="anl_list-02 mdd_list-02">
                                <li class="anl_item-03 mdd_item-03 _noChild">
                                    <div class="anl_title-03 mdd_title-03">
                                        <a class="anl_link-03 mdd_link-03" href="<?php echo esc_url(get_post_type_archive_link(get_current_post_type())); ?>">
                                            <span>すべて</span>
                                        </a>
                                    </div>
                                </li>
                                <?php
                                // カスタムタクソノミーが存在するか確認
                                if (is_tax()) {
                                    $taxonomy = get_query_var('taxonomy');
                                    $taxonomyObject = get_taxonomy($taxonomy);

                                    if ($taxonomyObject && isset($taxonomyObject->object_type[0])) {
                                        $postType = $taxonomyObject->object_type[0];
                                        $postType_cat = $postType . '_cat';
                                    } else {
                                        // デフォルト値を設定
                                        $postType = '';
                                        $postType_cat = '';
                                    }
                                } elseif (is_post_type_archive() || is_single()) {
                                    $postTypeObject = get_post_type_object(get_post_type());

                                    if ($postTypeObject) {
                                        $postType = esc_html($postTypeObject->name);
                                        $postType_cat = $postType . '_cat';
                                    } else {
                                        // デフォルト値を設定
                                        $postType = '';
                                        $postType_cat = '';
                                    }
                                }
                                ?>
                                <?php if (isset($postType_cat)) : ?>
                                    <?php
                                    $taxonomies = $postType_cat;
                                    $args = array(
                                        'orderby' => 'id',
                                        'hide_empty' => false, // 投稿がないカテゴリを出すかどうか
                                        'parent' => 0,
                                    );
                                    $terms = get_terms($taxonomies, $args);
                                    ?>
                                    <?php if (!empty($terms) && !is_wp_error($terms)) : ?>
                                        <?php foreach ($terms as $term) : ?>
                                            <?php
                                            //カテゴリのリンクURLを取得
                                            $term_link = get_term_link($term->term_id);
                                            //子カテゴリのIDを配列で取得。配列の長さを変数に格納
                                            $child_term_num = count(get_term_children($term->term_id, $taxonomies));
                                            //子カテゴリが存在する場合
                                            ?>
                                            <?php if ($child_term_num > 0) : ?>
                                                <li class="anl_item-03 mdd_item-03 _hasChild">
                                                    <div class="anl_title-03 mdd_title-03">
                                                        <a class="anl_link-03 mdd_link-03" href="<?php echo esc_url($term_link); ?>">
                                                            <span><?php echo esc_html($term->name); ?></span>
                                                        </a>
                                                        <button class="anl_button-03 mdd_button-03" type="button"><span>開閉</span></button>
                                                    </div>
                                                    <?php if ($child_term_num > 0) : ?>
                                                        <div class="anl_wrapper-03 mdd_wrapper-03">
                                                            <div class="anl_inner-03 mdd_inner-03">
                                                                <ul class="anl_list-03 mdd_list-03">
                                                                    <?php
                                                                    //子カテゴリの一覧取得条件
                                                                    $term_children_args = array(
                                                                        'orderby' => 'id',
                                                                        'hide_empty' => 0,
                                                                        'parent' => $term->term_id,
                                                                    );
                                                                    //子カテゴリの一覧取得
                                                                    $term_children = get_terms($taxonomies, $term_children_args);
                                                                    //子カテゴリの数だけリスト出力 
                                                                    ?>
                                                                    <?php foreach ($term_children as $child_val) : ?>
                                                                        <?php
                                                                        $term_link = get_term_link($child_val->term_id);
                                                                        ?>
                                                                        <li class="anl_item-04 mdd_item-04 _noChild">
                                                                            <div class="anl_title-04 mdd_title-04">
                                                                                <a class="anl_link-04 mdd_link-04" href="<?php echo esc_url($term_link); ?>">
                                                                                    <span><?php echo esc_html($child_val->name); ?></span>
                                                                                </a>
                                                                            </div>
                                                                        </li>
                                                                    <?php endforeach; ?>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    <?php endif; ?>
                                                </li>
                                            <?php else : ?>
                                                <li class="anl_item-03 mdd_item-03 _noChild">
                                                    <div class="anl_title-03 mdd_title-03">
                                                        <a class="anl_link-03 mdd_link-03" href="<?php echo esc_url($term_link); ?>">
                                                            <span><?php echo esc_html($term->name); ?></span>
                                                        </a>
                                                    </div>
                                                </li>
                                            <?php endif; ?>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                <?php endif; ?>
                            </ul>
                        </div>
                    </div>
                </li>
            </ul>
            <ul class="an_links module_dropdown">
                <li class="anl_item-02 mdd_item-02 _hasChild">
                    <div class="anl_title-02 mdd_title-02">
                        <div class="anl_link-02 mdd_link-02">
                            <span>アーカイブ</span>
                        </div>
                        <button class="anl_button-02 mdd_button-02" type="button"><span>開閉</span></button>
                    </div>
                    <div class="anl_wrapper-02 mdd_wrapper-02">
                        <div class="anl_inner-02 mdd_inner-02">
                            <ul class="anl_list-02 mdd_list-02">
                                <?php
                                $is_fiscal = in_array($postType, get_fiscal_year_post_types(), true);
                                ?>
                                <?php if ($is_fiscal): ?>
                                    <?php
                                    $args = array('post_type' => $postType);
                                    $archives = get_archives_by_fiscal_year($args);
                                    ?>
                                    <?php foreach ($archives as $archive): ?>
                                        <li class="anl_item-03 mdd_item-03 _noChild">
                                            <div class="anl_title-03 mdd_title-03">
                                                <a class="anl_link-03 mdd_link-03" href="<?php echo esc_url(get_custom_post_type_year_link($postType, $archive->year)); ?>">
                                                    <span><?php echo esc_html($archive->year) ?>年度</span>
                                                </a>
                                            </div>
                                        </li>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <?php
                                    $year_query = new WP_Query(array(
                                        'post_type' => $postType,
                                        'orderby' => 'date',
                                        'order' => 'DESC',
                                        'posts_per_page' => -1,
                                        'ignore_sticky_posts' => true,
                                    ));
                                    $displayed_year = null;
                                    ?>
                                    <?php while ($year_query->have_posts()) : $year_query->the_post(); ?>
                                        <?php
                                        $current_year = get_the_date('Y');
                                        ?>
                                        <?php if ($displayed_year !== $current_year): ?>
                                            <?php
                                            $displayed_year = $current_year;
                                            ?>
                                            <li class="anl_item-03 mdd_item-03 _noChild">
                                                <div class="anl_title-03 mdd_title-03">
                                                    <a class="anl_link-03 mdd_link-03" href="<?php echo esc_url(get_custom_post_type_year_link($postType, $current_year)); ?>">
                                                        <span><?php echo esc_html($current_year) ?>年</span>
                                                    </a>
                                                </div>
                                            </li>
                                        <?php endif; ?>
                                    <?php endwhile; ?>
                                    <?php wp_reset_postdata(); ?>
                                <?php endif; ?>
                            </ul>
                        </div>
                    </div>
                </li>
            </ul>
        </nav>
    <?php endif; ?>
</div>