<?php
/**
 * Shared page visual.
 *
 * Figma has two presentation families that share the same WordPress/ACF image
 * authority: the gold bar (default) and the image-title derivative (`_fixedPage`).
 * `_fixedPage` opts in only when the page has `page_img`. Pages without a photo,
 * including Parts, keep the gold bar. Keep one renderer.
 *
 * Single-post Figma places the breadcrumb after the article body, immediately
 * before the subpage footer. `single.php` therefore owns that one placement;
 * all other surfaces keep the shared breadcrumb directly after this visual.
 */
global $post;
$page_img = (is_page() && !is_front_page() && !is_404() && !is_search())
    ? get_field('page_img', get_the_ID())
    : null;
$is_fixed_page_visual = !empty($page_img);
?>
<div class="global_mainVisual<?php echo $is_fixed_page_visual ? ' _fixedPage' : ''; ?>">
    <div class="global_inner gm_inner">
        <?php if (get_current_post_type() && !is_page() && !is_404() && !is_search() || is_post_type_archive() || is_tax()): //投稿 
        ?>
            <?php
            $postType_name = get_current_post_type();
            $field_name = 'page_img-' . $postType_name; //ビジュアル設定（投稿タイプ）名前に合わせる
            $img = get_field($field_name, 'option');
            if ($img) {
                $thumb = wp_get_attachment_image_src($img, 'head_img');
                $img_url = $thumb[0];
            } else {
                $img_url = esc_url(get_template_directory_uri()) . '/images/common/noimage_visual-01.webp';
            }

            // 通常投稿は一覧・カテゴリ・詳細で同じ「お知らせ」マスター見出しを使う。
            // get_archive_title() は posts index で "Archives"、category でカテゴリ名になるため Figma と一致しない。
            if ($postType_name === 'post') {
                $posts_page_id = (int) get_option('page_for_posts');
                $archive_heading = $posts_page_id ? get_the_title($posts_page_id) : '';
                $archive_heading = $archive_heading ?: 'お知らせ';
            } else {
                $archive_heading = get_archive_title();
                $archive_heading = $archive_heading ?: get_the_title(get_option('page_for_posts'));
            }
            ?>
            <div class="gm_background" style="background-image: url(<?php echo esc_url($img_url); ?>)"></div>
            <?php if (!is_single()): ?>
                <h1 class="gm_title"><span><?php echo esc_html($archive_heading); ?></span></h1>
            <?php else: ?>
                <p class="gm_title"><span><?php echo esc_html($archive_heading); ?></span></p>
            <?php endif; ?>
        <?php elseif (is_404()): //404 
        ?>
            <?php
            $img = get_field('page_img-other', 'option');
            if ($img) {
                $thumb = wp_get_attachment_image_src($img, 'head_img');
                $img_url = $thumb[0];
            } else {
                $img_url = esc_url(get_template_directory_uri()) . '/images/common/noimage_visual-01.webp';
            }
            ?>
            <div class="gm_background" style="background-image: url(<?php echo esc_url($img_url); ?>)"></div>
            <h1 class="gm_title"><span>お探しのページは<br>見つかりませんでした</span></h1>
        <?php elseif (is_search()): //検索結果 
        ?>
            <?php
            $img = get_field('page_img-other', 'option');
            if ($img) {
                $thumb = wp_get_attachment_image_src($img, 'head_img');
                $img_url = $thumb[0];
            } else {
                $img_url = esc_url(get_template_directory_uri()) . '/images/common/noimage_visual-01.webp';
            }
            ?>
            <div class="gm_background" style="background-image: url(<?php echo esc_url($img_url); ?>)"></div>
            <h1 class="gm_title"><span><?php if (empty(get_search_query())) : ?>検索キーワードが未入力です<?php else: ?><?php the_search_query(); ?>の検索結果<?php endif; ?></span></h1>
        <?php else: ?>
            <?php
            $img = $page_img;
            if ($img) {
                $thumb = wp_get_attachment_image_src($img, 'head_img');
                $img_url = $thumb[0];
            } else {
                $img_url = esc_url(get_template_directory_uri()) . '/images/common/noimage_visual-01.webp';
            }
            ?>
            <div class="gm_background" style="background-image: url(<?php echo esc_url($img_url); ?>)"></div>
            <h1 class="gm_title"><span><?php the_title(); ?></span></h1>
        <?php endif; ?>
    </div>
</div>
<?php if (!is_single()): ?>
    <?php get_template_part('template-parts/_breadCrumb'); ?>
<?php endif; ?>