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
            $url = esc_url((string) get_sub_field('url'));
            $target = get_sub_field('target');
            $has_text = trim((string) $title) !== '' || trim((string) $text) !== '';
            if (!$image_thumb && !$has_text) {
                continue;
            }
            $has_link = $url !== '' && $has_text;
            ?>
            <li class="navigation">
                <a<?php if ($has_link) : ?> href="<?php echo $url; ?>"<?php if ($target) : ?> target="_blank" rel="noopener"<?php endif; ?><?php else : ?> class="is-disabled"<?php endif; ?>>
                    <?php if ($image_thumb) : ?>
                        <div class="image">
                            <img src="<?php echo esc_url($image_thumb); ?>" alt="" width="120" height="120">
                        </div>
                    <?php endif; ?>
                    <?php if ($has_text) : ?>
                    <div class="content">
                        <?php if ($title) : ?>
                            <h2 class="title"><?php echo nl2br(esc_html($title)); ?></h2>
                        <?php endif; ?>
                        <?php if ($text) : ?>
                            <div class="text"><?php echo nl2br(esc_html($text)); ?></div>
                        <?php endif; ?>
                    </div>
                    <?php endif; ?>
                </a>
            </li>
        <?php endwhile; ?>
    </ul>
<?php endif; ?>