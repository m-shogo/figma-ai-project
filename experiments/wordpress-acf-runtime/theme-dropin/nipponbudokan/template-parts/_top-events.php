<?php
$theme_uri = get_template_directory_uri();

$event_query = new WP_Query(array(
    'post_type' => 'event',
    'posts_per_page' => 4,
    'has_password' => false,
    'orderby' => 'date',
    'order' => 'DESC',
    'post_status' => 'publish',
));
$has_events = $event_query->have_posts();

$selected_event_cat = isset($_GET['top_event_cat'])
    ? sanitize_title(wp_unslash($_GET['top_event_cat']))
    : '';

$event_terms = get_terms(array(
    'taxonomy' => 'event_cat',
    'hide_empty' => true,
));
if (is_wp_error($event_terms)) {
    $event_terms = array();
}

$upcoming_args = array(
    'post_type' => 'event',
    'posts_per_page' => 5,
    'has_password' => false,
    'post_status' => 'publish',
    'meta_key' => 'event_date',
    'meta_type' => 'CHAR',
    'orderby' => 'meta_value',
    'order' => 'ASC',
    'meta_query' => array(
        array(
            'key' => 'event_date',
            'value' => wp_date('Ymd'),
            'compare' => '>=',
            'type' => 'CHAR',
        ),
    ),
);

if ($selected_event_cat !== '') {
    $upcoming_args['tax_query'] = array(
        array(
            'taxonomy' => 'event_cat',
            'field' => 'slug',
            'terms' => $selected_event_cat,
        ),
    );
}

$upcoming_query = new WP_Query($upcoming_args);
$has_upcoming = $upcoming_query->have_posts();
?>
<section id="top_events-01" class="top_events-01">
    <div class="global_inner">
        <h2 class="te_heading">
            <span class="te_heading_ja">大会・イベント情報</span>
            <span class="te_heading_en"><span class="te_heading_en_initial">E</span>vent</span>
        </h2>

        <div class="te_layout">
            <div class="te_featured">
                <div class="te_section_head te_featured_head">
                    <span class="te_section_icon te_featured_icon" aria-hidden="true"></span>
                    <h3 class="te_section_title">注目の主催事業</h3>
                </div>

                <div class="te_cards">
                    <?php if ($has_events): ?>
                        <?php while ($event_query->have_posts()): $event_query->the_post(); ?>
                            <?php
                            $link_attrs = get_post_link_attributes();
                            $href = !empty($link_attrs['url']) ? $link_attrs['url'] : get_permalink();
                            $terms = get_the_terms(get_the_ID(), 'event_cat');
                            $cat_name = ($terms && !is_wp_error($terms)) ? $terms[0]->name : '';
                            $thumb_id = get_post_thumbnail_id();
                            $thumb = $thumb_id ? wp_get_attachment_image_src($thumb_id, 'medium') : null;
                            $img = !empty($thumb[0]) ? $thumb[0] : $theme_uri . '/images/common/noimage.webp';
                            $status = function_exists('nipponbudokan_event_status')
                                ? nipponbudokan_event_status()
                                : array();
                            $date_html = function_exists('nipponbudokan_event_date_label_html')
                                ? nipponbudokan_event_date_label_html()
                                : '';
                            ?>
                            <article class="te_card">
                                <a class="te_card_link" href="<?php echo esc_url($href); ?>"<?php echo !empty($link_attrs['targetAttr']) ? ' ' . $link_attrs['targetAttr'] : ''; ?>>
                                    <p class="te_card_image">
                                        <img src="<?php echo esc_url($img); ?>" alt="" width="220" height="165" loading="lazy">
                                    </p>
                                    <div class="te_card_body">
                                        <?php if ($status || $cat_name): ?>
                                            <p class="te_card_labels">
                                                <?php if ($status): ?>
                                                    <span class="te_label te_status te_status-<?php echo esc_attr($status['slug']); ?>"><?php echo esc_html($status['label']); ?></span>
                                                <?php endif; ?>
                                                <?php if ($cat_name): ?>
                                                    <span class="te_label te_label_cat"><?php echo esc_html($cat_name); ?></span>
                                                <?php endif; ?>
                                            </p>
                                        <?php endif; ?>
                                        <h3 class="te_card_title"><?php the_title(); ?></h3>
                                        <?php if ($date_html !== ''): ?>
                                            <p class="te_card_date"><span class="te_card_date_label">開催日</span><?php echo $date_html; ?></p>
                                        <?php endif; ?>
                                    </div>
                                </a>
                            </article>
                        <?php endwhile; ?>
                        <?php wp_reset_postdata(); ?>
                    <?php endif; ?>
                </div>
            </div>

            <div class="te_upcoming">
                <div class="te_section_head te_upcoming_head">
                    <div class="te_upcoming_heading">
                        <span class="te_section_icon te_upcoming_icon" aria-hidden="true"></span>
                        <h3 class="te_section_title">近日開催の行事予定</h3>
                    </div>

                    <form class="te_filter" method="get" action="<?php echo esc_url(home_url('/')); ?>">
                        <label class="screen-reader-text" for="te_event_cat">イベントカテゴリー</label>
                        <select id="te_event_cat" name="top_event_cat" onchange="this.form.submit()">
                            <option value="">カテゴリーを選択</option>
                            <?php foreach ($event_terms as $term): ?>
                                <option value="<?php echo esc_attr($term->slug); ?>"<?php selected($selected_event_cat, $term->slug); ?>><?php echo esc_html($term->name); ?></option>
                            <?php endforeach; ?>
                        </select>
                        <button class="screen-reader-text" type="submit">絞り込む</button>
                    </form>
                </div>

                <div class="te_upcoming_list">
                    <?php if ($has_upcoming): ?>
                        <?php while ($upcoming_query->have_posts()): $upcoming_query->the_post(); ?>
                            <?php
                            $timestamp = function_exists('nipponbudokan_event_datetime')
                                ? nipponbudokan_event_datetime()
                                : 0;
                            $time = function_exists('get_field') ? get_field('event_time') : '';
                            $host = function_exists('get_field') ? get_field('event_host') : '';
                            $link_attrs = get_post_link_attributes();
                            $href = !empty($link_attrs['url']) ? $link_attrs['url'] : '';
                            $link_type = function_exists('get_field') ? get_field('post_type') : '';
                            $external_url = ($link_type === 'url' && $href !== '') ? $href : '';
                            ?>
                            <article class="te_upcoming_item">
                                <div class="te_upcoming_when">
                                    <?php if ($timestamp): ?>
                                        <?php
                                        $weekday_index = (int) wp_date('w', $timestamp);
                                        $weekday_labels = array('日', '月', '火', '水', '木', '金', '土');
                                        $weekday_class = $weekday_index === 0 ? ' is-sun' : ($weekday_index === 6 ? ' is-sat' : '');
                                        ?>
                                        <p class="te_upcoming_day<?php echo esc_attr($weekday_class); ?>">
                                            <time datetime="<?php echo esc_attr(wp_date('Y-m-d', $timestamp)); ?>"><?php echo esc_html(wp_date('n/j', $timestamp)); ?> <span>(<?php echo esc_html($weekday_labels[$weekday_index]); ?>)</span></time>
                                        </p>
                                    <?php endif; ?>
                                    <?php if (function_exists('nipponbudokan_event_value_present') && nipponbudokan_event_value_present($time)): ?>
                                        <p class="te_upcoming_time"><?php echo esc_html($time); ?></p>
                                    <?php endif; ?>
                                </div>

                                <div class="te_upcoming_body">
                                    <h4 class="te_upcoming_title">
                                        <?php if ($href !== ''): ?>
                                            <a href="<?php echo esc_url($href); ?>"<?php echo !empty($link_attrs['targetAttr']) ? ' ' . $link_attrs['targetAttr'] : ''; ?>><?php the_title(); ?></a>
                                        <?php else: ?>
                                            <?php the_title(); ?>
                                        <?php endif; ?>
                                    </h4>
                                    <?php if (function_exists('nipponbudokan_event_value_present') && nipponbudokan_event_value_present($host)): ?>
                                        <p class="te_upcoming_host"><?php echo esc_html($host); ?></p>
                                    <?php endif; ?>
                                    <?php if ($external_url !== ''): ?>
                                        <p class="te_upcoming_url">
                                            <a href="<?php echo esc_url($external_url); ?>"<?php echo !empty($link_attrs['targetAttr']) ? ' ' . $link_attrs['targetAttr'] : ''; ?>><?php echo esc_html($external_url); ?></a>
                                        </p>
                                    <?php endif; ?>
                                </div>
                            </article>
                        <?php endwhile; ?>
                        <?php wp_reset_postdata(); ?>
                    <?php endif; ?>
                </div>

                <p class="te_more">
                    <a href="<?php echo esc_url(get_post_type_archive_link('event')); ?>">
                        <span class="te_more_icon" aria-hidden="true"></span>
                        <span>一覧を表示</span>
                    </a>
                </p>
            </div>
        </div>
    </div>
</section>
