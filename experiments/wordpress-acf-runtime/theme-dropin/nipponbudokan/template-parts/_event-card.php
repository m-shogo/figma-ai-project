<?php
$link_attrs = get_post_link_attributes();
$href = !empty($link_attrs['url']) ? $link_attrs['url'] : get_permalink();
$date_html = nipponbudokan_event_date_label_html();
$time = function_exists('get_field') ? get_field('event_time') : '';
$capacity = function_exists('get_field') ? get_field('event_capacity') : '';
$fee = function_exists('get_field') ? get_field('event_fee') : '';
$host = function_exists('get_field') ? get_field('event_host') : '';
$has_meta = nipponbudokan_event_value_present($time)
    || nipponbudokan_event_value_present($capacity)
    || nipponbudokan_event_value_present($fee)
    || nipponbudokan_event_value_present($host);
?>
<article class="ea_card">
    <a class="ea_card_link" href="<?php echo esc_url($href); ?>"<?php echo !empty($link_attrs['targetAttr']) ? ' ' . $link_attrs['targetAttr'] : ''; ?>>
        <?php
        get_template_part('template-parts/_label-category', null, [
            'taxonomy' => '_cat',
        ]);
        ?>
        <div class="ea_copy">
        <?php if ($date_html !== '') : ?>
            <p class="ea_date"><?php echo $date_html; ?></p>
        <?php endif; ?>
        <h2 class="ea_title"><?php the_title(); ?></h2>
        </div>
        <?php if ($has_meta) : ?>
            <dl class="ea_meta">
                <?php if (nipponbudokan_event_value_present($time)) : ?>
                    <div class="ea_meta_row">
                        <dt>時間</dt>
                        <dd><?php echo esc_html($time); ?></dd>
                    </div>
                <?php endif; ?>
                <?php if (nipponbudokan_event_value_present($capacity) || nipponbudokan_event_value_present($fee)) : ?>
                    <div class="ea_meta_row ea_meta_row-split">
                        <?php if (nipponbudokan_event_value_present($capacity)) : ?>
                            <div>
                                <dt>入場数</dt>
                                <dd><?php echo esc_html($capacity); ?></dd>
                            </div>
                        <?php endif; ?>
                        <?php if (nipponbudokan_event_value_present($fee)) : ?>
                            <div>
                                <dt>入場料</dt>
                                <dd><?php echo esc_html($fee); ?></dd>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
                <?php if (nipponbudokan_event_value_present($host)) : ?>
                    <div class="ea_meta_row">
                        <dt>主催</dt>
                        <dd><?php echo esc_html($host); ?></dd>
                    </div>
                <?php endif; ?>
            </dl>
        <?php endif; ?>
    </a>
</article>
