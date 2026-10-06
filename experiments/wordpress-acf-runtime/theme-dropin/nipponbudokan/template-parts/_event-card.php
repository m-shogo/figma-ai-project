<?php
$link_attrs = get_post_link_attributes();
$href = !empty($link_attrs['url']) ? $link_attrs['url'] : '';

$timestamp = nipponbudokan_event_datetime();
$month_day = $timestamp ? wp_date('n/j', $timestamp) : '';
$weekday_index = $timestamp ? (int) wp_date('w', $timestamp) : -1;
$weekday_labels = array('日', '月', '火', '水', '木', '金', '土');
$weekday = $weekday_index >= 0 ? $weekday_labels[$weekday_index] : '';
$weekday_class = $weekday_index === 0 ? ' is-sun' : ($weekday_index === 6 ? ' is-sat' : '');

$open_time = function_exists('get_field') ? get_field('event_open_time') : '';
$start_time = function_exists('get_field') ? get_field('event_start_time') : '';
$contact = function_exists('get_field') ? get_field('event_contact') : '';
$has_schedule = nipponbudokan_event_value_present($open_time) || nipponbudokan_event_value_present($start_time);
$has_meta = $has_schedule || nipponbudokan_event_value_present($contact);
$has_category = has_term('', 'event_cat', get_the_ID());
$contact_html = nipponbudokan_event_contact_html($contact);
?>
<article class="ea_card">
    <div class="ea_card_link">
        <?php if ($timestamp || $has_category) : ?>
            <div class="ea_day">
                <?php if ($timestamp) : ?>
                    <p class="ea_date<?php echo esc_attr($weekday_class); ?>">
                        <time datetime="<?php echo esc_attr(wp_date('Y-m-d', $timestamp)); ?>">
                            <span class="ea_date-md"><?php echo esc_html($month_day); ?></span>
                            <span class="ea_wday<?php echo esc_attr($weekday_class); ?>">(<?php echo esc_html($weekday); ?>)</span>
                        </time>
                    </p>
                <?php endif; ?>

                <?php if ($has_category) : ?>
                    <div class="ea_labels ea_labels-sp">
                        <?php get_template_part('template-parts/_label-category', null, array('taxonomy' => '_cat')); ?>
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <div class="ea_body">
            <div class="ea_titleRow">
                <?php if ($has_category) : ?>
                    <div class="ea_labels ea_labels-pc">
                        <?php get_template_part('template-parts/_label-category', null, array('taxonomy' => '_cat')); ?>
                    </div>
                <?php endif; ?>

                <h2 class="ea_title"><?php if ($href !== '') : ?><a href="<?php echo esc_url($href); ?>"<?php echo !empty($link_attrs['targetAttr']) ? $link_attrs['targetAttr'] : ''; ?>><?php the_title(); ?></a><?php else : ?><?php the_title(); ?><?php endif; ?></h2>
            </div>

            <?php if ($has_meta) : ?>
                <div class="ea_meta">
                    <?php if ($has_schedule) : ?>
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

                    <?php if ($contact_html !== '') : ?>
                        <div class="ea_meta_row ea_contact"><?php echo $contact_html; ?></div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</article>
