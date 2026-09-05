<?php if (have_rows('navigation-small')) : ?>
    <ul class="module_navigation --small">
        <?php while (have_rows('navigation-small')) : the_row(); ?>
            <?php
            $image = get_sub_field('image');
            $image_thumb = '';
            if ($image) {
                $image_thumb = wp_get_attachment_image_url($image, 'large');
            }
            $title = get_sub_field('title');
            $text = get_sub_field('text');
            $url = get_sub_field('url');
            $target = get_sub_field('target');
            $link_attribute = $url ? ' href="' . esc_url($url) . '"' : ' aria-disabled="true"';
            $target_attribute = ($url && $target) ? ' target="_blank"' : '';
            ?>
            <li class="navigation">
                <a<?php echo $link_attribute; ?><?php echo $target_attribute; ?> class="<?php echo $url ? '' : 'is-disabled'; ?>">
                    <?php if ($image_thumb) : ?>
                        <div class="image">
                            <img src="<?php echo esc_url($image_thumb); ?>" alt="<?php echo $title ? esc_attr($title) : ''; ?>" width="120" height="120">
                        </div>
                    <?php else : ?>
                        <div class="image">
                            <img src="<?php echo get_template_directory_uri(); ?>/images/common/noimage.webp" alt="<?php echo $title ? esc_attr($title) : ''; ?>" width="120" height="120">
                        </div>
                    <?php endif; ?>
                    <div class="content">
                        <?php if ($title) : ?>
                            <h2 class="title"><?php echo nl2br(esc_html($title)); ?></h2>
                        <?php endif; ?>
                        <?php if ($text) : ?>
                            <div class="text"><?php echo nl2br(esc_html($text)); ?></div>
                        <?php endif; ?>
                    </div>
                </a>
            </li>
        <?php endwhile; ?>
    </ul>
<?php endif; ?>