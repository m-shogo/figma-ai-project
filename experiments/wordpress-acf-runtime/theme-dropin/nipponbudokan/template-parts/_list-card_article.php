<article class="mnc-01_article">
    <?php
    // post_typeによるリンクや属性を取得
    $link_attrs = get_post_link_attributes();
    $html_tag = $link_attrs['url'] ? 'a' : 'span';
    $html_classes = $link_attrs['url'] ? ' class="link"' : ' class="no-link"';
    $html_attrs = $link_attrs['url'] ? 'href="' . esc_url($link_attrs['url']) . '" ' . $link_attrs['targetAttr'] : '';
    ?>
    <<?php echo $html_tag; ?> <?php echo $html_classes; ?> <?php echo $html_attrs; ?>>
        <div class="head">
            <?php
            $img = get_post_thumbnail_id($post->ID);
            $thumb = wp_get_attachment_image_src($img, '');
            ?>
            <?php if ($img) : ?>
                <div class="image">
                    <img src="<?php echo $thumb[0]; ?>" alt="<?php the_title_attribute(); ?>" width="360" height="240" loading="lazy">
                </div>
            <?php else : ?>
                <div class="image _noImage">
                    <img src="<?php echo get_template_directory_uri(); ?>/images/common/noimage.webp" alt="画像が見つかりませんでした" width="360" height="240" loading="lazy">
                </div>
            <?php endif; ?>
        </div>
        <div class="body">
            <?php
            get_template_part('template-parts/_label-category', null, [
                'taxonomy' => '_cat',
            ]);
            ?>
            <p class="date">
                <time datetime="<?php the_time('Y-m-d'); ?>"><?php the_time('Y/n/j'); ?></time>
            </p>
        </div>
        <div class="foot">
            <?php if (is_front_page() || is_page()) : ?>
                <h3 class="title"><?php the_title(); ?></h3>
            <?php else : ?>
                <h2 class="title"><?php the_title(); ?></h2>
            <?php endif; ?>
        </div>
    </<?php echo $html_tag; ?>>
</article>