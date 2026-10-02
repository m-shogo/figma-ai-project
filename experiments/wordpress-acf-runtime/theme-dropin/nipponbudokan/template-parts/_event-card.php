<?php
$link_attrs = get_post_link_attributes();
$href = !empty($link_attrs['url']) ? $link_attrs['url'] : '';
$date_html = nipponbudokan_event_date_label_html();
$open_time = function_exists('get_field') ? get_field('event_open_time') : '';
$start_time = function_exists('get_field') ? get_field('event_start_time') : '';
$contact = function_exists('get_field') ? get_field('event_contact') : '';
$has_meta = nipponbudokan_event_value_present($open_time)
    || nipponbudokan_event_value_present($start_time)
    || nipponbudokan_event_value_present($contact);
$card_tag = $href !== '' ? 'a' : 'div';
?>
<article class="ea_card">
    <<?php echo $card_tag; ?> class="ea_card_link"<?php echo $href !== '' ? ' href="' . esc_url($href) . '"' . (!empty($link_attrs['targetAttr']) ? ' ' . $link_attrs['targetAttr'] : '') : ''; ?>>
        <div class="ea_labels">
            <?php
            get_template_part('template-parts/_label-category', null, [
                'taxonomy' => '_cat',
            ]);
            ?>
        </div>
        <div class="ea_copy">
        <?php if ($date_html !== '') : ?>
            <p class="ea_date"><?php echo $date_html; ?></p>
        <?php endif; ?>
        <h2 class="ea_title"><?php the_title(); ?></h2>
        </div>
        <?php if ($has_meta) : ?>
            <div class="ea_meta">
                <?php if (nipponbudokan_event_value_present($open_time) || nipponbudokan_event_value_present($start_time)) : ?>
                    <p class="ea_meta_row">
                        <?php if (nipponbudokan_event_value_present($open_time)) : ?>
                            <span>開場：<?php echo esc_html($open_time); ?></span>
                        <?php endif; ?>
                        <?php if (nipponbudokan_event_value_present($open_time) && nipponbudokan_event_value_present($start_time)) : ?>
                            <span aria-hidden="true"> / </span>
                        <?php endif; ?>
                        <?php if (nipponbudokan_event_value_present($start_time)) : ?>
                            <span>開会：<?php echo esc_html($start_time); ?></span>
                        <?php endif; ?>
                    </p>
                <?php endif; ?>
                <?php if (nipponbudokan_event_value_present($contact)) : ?>
                    <p class="ea_meta_row ea_contact"><?php echo wp_kses_post(nl2br(esc_html($contact))); ?></p>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </<?php echo $card_tag; ?>>
</article>
