<?php if (have_rows('navigation-card')) : ?>
    <ul class="purposeCards">
        <?php while (have_rows('navigation-card')) : the_row(); ?>
            <?php
            $image = get_sub_field('image');
            $image_id = is_array($image) ? (int) ($image['ID'] ?? 0) : (int) $image;
            $name = trim((string) get_sub_field('name'));
            $text = trim((string) get_sub_field('text'));
            $url = trim((string) get_sub_field('url'));
            $external = (bool) get_sub_field('external');
            if ($image_id === 0 && $name === '' && $url === '') {
                continue;
            }
            ?>
            <li class="purposeCards_item">
                <?php if ($url !== '') : ?>
                    <a class="purposeCard" href="<?php echo esc_url($url); ?>"<?php echo $external ? ' target="_blank" rel="noopener noreferrer"' : ''; ?>>
                <?php else : ?>
                    <div class="purposeCard">
                <?php endif; ?>
                    <span class="purposeCard_media">
                        <?php if ($image_id) : ?>
                            <?php echo wp_get_attachment_image($image_id, 'large', false, array(
                                'alt' => '',
                                'loading' => 'lazy',
                            )); ?>
                        <?php endif; ?>
                    </span>
                    <span class="purposeCard_shade" aria-hidden="true"></span>
                    <?php if ($name !== '') : ?>
                        <span class="purposeCard_title"><?php echo nbk_title_html($name); ?></span>
                    <?php endif; ?>
                    <span class="purposeCard_hover">
                        <?php if ($text !== '') : ?>
                            <span class="purposeCard_lead"><?php echo nbk_title_html($text); ?></span>
                        <?php endif; ?>
                        <?php if ($url !== '') : ?>
                            <span class="purposeCard_more">詳細はこちら</span>
                        <?php endif; ?>
                    </span>
                    <?php if ($url !== '' && $external) : ?>
                        <span class="purposeCard_blank">（別ウィンドウで開きます）</span>
                    <?php endif; ?>
                <?php if ($url !== '') : ?>
                    </a>
                <?php else : ?>
                    </div>
                <?php endif; ?>
            </li>
        <?php endwhile; ?>
    </ul>
<?php endif; ?>
