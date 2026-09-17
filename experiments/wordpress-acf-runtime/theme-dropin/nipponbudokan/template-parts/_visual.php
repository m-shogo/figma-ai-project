<?php
/**
 * Shared page visual.
 *
 * Figma has two presentation families that share the same WordPress/ACF image
 * authority: the gold bar (default) and the image-title derivative (`_fixedPage`).
 * `_fixedPage` opts in only when the page has `page_img`. Pages without a photo,
 * including Parts, keep the gold bar. Keep one renderer.
 *
 * Inner-page Figma places the breadcrumb after the main content, immediately
 * before the footer. Templates own that placement; this visual does not.
 */
if (!function_exists('nipponbudokan_visual_image_url')) {
    /**
     * Resolve a visual photo URL from an ACF image ID.
     * Cover cropping is CSS (`background-size: cover`); prefer the original file.
     */
    function nipponbudokan_visual_image_url($attachment_id)
    {
        $attachment_id = (int) $attachment_id;
        if ($attachment_id <= 0) {
            return '';
        }
        $thumb = wp_get_attachment_image_src($attachment_id, 'full');
        if (!$thumb) {
            $thumb = wp_get_attachment_image_src($attachment_id, 'page_img');
        }
        return ($thumb && !empty($thumb[0])) ? $thumb[0] : '';
    }
}

global $post;
$page_img = (is_page() && !is_front_page() && !is_404() && !is_search())
    ? get_field('page_img', get_the_ID())
    : null;
$is_fixed_page_visual = !empty($page_img);
$visual_fallback = get_template_directory_uri() . '/images/common/noimage_visual-01.webp';
?>
<div class="global_mainVisual<?php echo $is_fixed_page_visual ? ' _fixedPage' : ''; ?>">
    <div class="global_inner gm_inner">
        <?php if (get_current_post_type() && !is_page() && !is_404() && !is_search() || is_post_type_archive() || is_tax()): //投稿 
        ?>
            <?php
            $postType_name = get_current_post_type();
            $field_name = 'page_img-' . $postType_name; //ビジュアル設定（投稿タイプ）名前に合わせる
            $img = get_field($field_name, 'option');
            $img_url = nipponbudokan_visual_image_url($img);
            if ($img_url === '') {
                $img_url = $visual_fallback;
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
            $img_url = nipponbudokan_visual_image_url($img);
            if ($img_url === '') {
                $img_url = $visual_fallback;
            }
            ?>
            <div class="gm_background" style="background-image: url(<?php echo esc_url($img_url); ?>)"></div>
            <h1 class="gm_title"><span>お探しのページは<br>見つかりませんでした</span></h1>
        <?php elseif (is_search()): //検索結果 
        ?>
            <?php
            $img = get_field('page_img-other', 'option');
            $img_url = nipponbudokan_visual_image_url($img);
            if ($img_url === '') {
                $img_url = $visual_fallback;
            }
            ?>
            <div class="gm_background" style="background-image: url(<?php echo esc_url($img_url); ?>)"></div>
            <h1 class="gm_title"><span><?php if (empty(get_search_query())) : ?>検索キーワードが未入力です<?php else: ?><?php the_search_query(); ?>の検索結果<?php endif; ?></span></h1>
        <?php else: ?>
            <?php
            $img_url = nipponbudokan_visual_image_url($page_img);
            if ($img_url === '') {
                $img_url = $visual_fallback;
            }
            ?>
            <div class="gm_background" style="background-image: url(<?php echo esc_url($img_url); ?>)"></div>
            <h1 class="gm_title"><span><?php the_title(); ?></span></h1>
        <?php endif; ?>
    </div>
</div>
