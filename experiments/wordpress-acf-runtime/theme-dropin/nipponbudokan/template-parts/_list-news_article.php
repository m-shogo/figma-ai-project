<article class="mnl-01_article">
    <?php
    // post_typeによるリンクや属性を取得
    $link_attrs = get_post_link_attributes();
    $html_tag = $link_attrs['url'] ? 'a' : 'span';
    $html_classes = $link_attrs['url'] ? ' class="link"' : ' class="no-link"';
    $html_attrs = $link_attrs['url'] ? 'href="' . esc_url($link_attrs['url']) . '" ' . $link_attrs['targetAttr'] : '';
    ?>
    <<?php echo $html_tag; ?> <?php echo $html_classes; ?> <?php echo $html_attrs; ?>>
        <div class="head">
            <p class="date">
                <time datetime="<?php the_time('Y-m-d'); ?>"><?php the_time('Y/m/d'); ?></time>
            </p>
            <?php
            get_template_part('template-parts/_label-category', null, [
                'taxonomy' => '_cat',
            ]);
            ?>
        </div>
        <div class="body">
            <?php if (is_front_page() || is_page()) : ?>
                <h3 class="title"><?php the_title(); ?></h3>
            <?php else : ?>
                <h2 class="title"><?php the_title(); ?></h2>
            <?php endif; ?>
        </div>
    </<?php echo $html_tag; ?>>
</article>