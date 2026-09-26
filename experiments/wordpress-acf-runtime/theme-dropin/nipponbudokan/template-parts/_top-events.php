<?php
$theme_uri = get_template_directory_uri();
$event_archive_url = get_post_type_archive_link('event') ?: home_url('/event/');

$featured_query = new WP_Query(array(
    'post_type' => 'event',
    'posts_per_page' => 4,
    'has_password' => false,
    'orderby' => 'date',
    'order' => 'DESC',
    'post_status' => 'publish',
));

$today_ymd = wp_date('Ymd');
$upcoming_query = new WP_Query(array(
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
            'value' => $today_ymd,
            'compare' => '>=',
            'type' => 'CHAR',
        ),
    ),
));

$event_terms = get_terms(array(
    'taxonomy' => 'event_cat',
    'parent' => 0,
    'hide_empty' => true,
    'orderby' => 'name',
    'order' => 'ASC',
));
if (is_wp_error($event_terms)) {
    $event_terms = array();
}

$event_weekdays = array('日', '月', '火', '水', '木', '金', '土');
$event_date_parts = static function ($post_id) use ($event_weekdays) {
    $timestamp = nipponbudokan_event_datetime($post_id);
    if (!$timestamp) {
        return array();
    }

    $weekday_index = (int) wp_date('w', $timestamp);
    return array(
        'timestamp' => $timestamp,
        'iso' => wp_date('Y-m-d', $timestamp),
        'full' => wp_date('Y年n月j日', $timestamp),
        'short' => wp_date('n/j', $timestamp),
        'weekday' => $event_weekdays[$weekday_index],
        'modifier' => $weekday_index === 0 ? ' is-sun' : ($weekday_index === 6 ? ' is-sat' : ''),
    );
};
?>
<section id="top_events-01" class="top_events-01">
    <div class="global_inner">
        <h2 class="te_heading">
            <span class="te_heading_ja">大会・イベント情報</span>
            <span class="te_heading_en"><span class="te_heading_en_initial">E</span>vent</span>
        </h2>

        <div class="te_layout">
            <section class="te_featured" aria-labelledby="top-events-featured-heading">
                <h3 id="top-events-featured-heading" class="te_subheading te_featured_heading">
                    <img src="<?php echo esc_url($theme_uri . '/images/top/ico-facilities.svg'); ?>" alt="" width="32" height="24" aria-hidden="true">
                    <span>注目の主催事業</span>
                </h3>

                <?php if ($featured_query->have_posts()): ?>
                    <div class="te_cards">
                        <?php while ($featured_query->have_posts()): $featured_query->the_post(); ?>
                            <?php
                            $post_id = get_the_ID();
                            $link_attrs = get_post_link_attributes($post_id);
                            $href = !empty($link_attrs['url']) ? $link_attrs['url'] : get_permalink($post_id);
                            $status = nipponbudokan_event_status($post_id);
                            $terms = get_the_terms($post_id, 'event_cat');
                            $cat_name = ($terms && !is_wp_error($terms)) ? $terms[0]->name : '';
                            $thumb_id = get_post_thumbnail_id($post_id);
                            $thumb = $thumb_id ? wp_get_attachment_image_src($thumb_id, 'medium') : null;
                            $img = !empty($thumb[0]) ? $thumb[0] : $theme_uri . '/images/common/noimage.webp';
                            $date = $event_date_parts($post_id);
                            ?>
                            <article class="te_card">
                                <a class="te_card_link" href="<?php echo esc_url($href); ?>"<?php echo !empty($link_attrs['targetAttr']) ? $link_attrs['targetAttr'] : ''; ?>>
                                    <p class="te_card_image"><img src="<?php echo esc_url($img); ?>" alt="" width="220" height="165" loading="lazy"></p>
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
                                        <h4 class="te_card_title"><?php the_title(); ?></h4>
                                        <?php if ($date): ?>
                                            <p class="te_card_date">
                                                <span class="te_card_date_label">開催日</span>
                                                <time datetime="<?php echo esc_attr($date['iso']); ?>"><?php echo esc_html($date['full']); ?>(<span class="te_weekday<?php echo esc_attr($date['modifier']); ?>"><?php echo esc_html($date['weekday']); ?></span>)</time>
                                            </p>
                                        <?php endif; ?>
                                    </div>
                                </a>
                            </article>
                        <?php endwhile; ?>
                        <?php wp_reset_postdata(); ?>
                    </div>
                <?php endif; ?>
            </section>

            <section class="te_upcoming" aria-labelledby="top-events-upcoming-heading">
                <div class="te_upcoming_header">
                    <h3 id="top-events-upcoming-heading" class="te_subheading te_upcoming_heading">
                        <span class="te_upcoming_heading_icon" aria-hidden="true"></span>
                        <span>近日開催の行事予定</span>
                    </h3>

                    <?php if ($event_terms): ?>
                        <label class="screen-reader-text" for="top-event-category">イベントカテゴリーを選択</label>
                        <span class="te_category_select">
                            <select id="top-event-category" aria-label="イベントカテゴリー" onchange="if (this.value) { window.location.href = this.value; }">
                                <option value="<?php echo esc_url($event_archive_url); ?>">カテゴリーを選択</option>
                                <?php foreach ($event_terms as $term): ?>
                                    <?php $term_url = get_term_link($term); ?>
                                    <?php if (!is_wp_error($term_url)): ?>
                                        <option value="<?php echo esc_url($term_url); ?>"><?php echo esc_html($term->name); ?></option>
                                    <?php endif; ?>
                                <?php endforeach; ?>
                            </select>
                        </span>
                    <?php endif; ?>
                </div>

                <?php if ($upcoming_query->have_posts()): ?>
                    <div class="te_upcoming_list">
                        <?php while ($upcoming_query->have_posts()): $upcoming_query->the_post(); ?>
                            <?php
                            $post_id = get_the_ID();
                            $date = $event_date_parts($post_id);
                            $time = function_exists('get_field') ? get_field('event_time', $post_id) : '';
                            $host = function_exists('get_field') ? get_field('event_host', $post_id) : '';
                            $link_type = function_exists('get_field') ? get_field('post_type', $post_id) : '';
                            $link_attrs = get_post_link_attributes($post_id);
                            $href = !empty($link_attrs['url']) ? $link_attrs['url'] : get_permalink($post_id);
                            $external_url = ($link_type === 'url' && !empty($link_attrs['url'])) ? $link_attrs['url'] : '';
                            ?>
                            <article class="te_upcoming_item">
                                <div class="te_upcoming_meta">
                                    <?php if ($date): ?>
                                        <p class="te_upcoming_date">
                                            <time datetime="<?php echo esc_attr($date['iso']); ?>">
                                                <span class="te_upcoming_day<?php echo esc_attr($date['modifier']); ?>"><?php echo esc_html($date['short']); ?></span>
                                                <span class="te_upcoming_weekday<?php echo esc_attr($date['modifier']); ?>">(<?php echo esc_html($date['weekday']); ?>)</span>
                                            </time>
                                        </p>
                                    <?php endif; ?>
                                    <?php if (nipponbudokan_event_value_present($time)): ?>
                                        <p class="te_upcoming_time"><?php echo nl2br(esc_html((string) $time)); ?></p>
                                    <?php endif; ?>
                                </div>
                                <div class="te_upcoming_body">
                                    <h4 class="te_upcoming_title">
                                        <a href="<?php echo esc_url($href); ?>"<?php echo !empty($link_attrs['targetAttr']) ? $link_attrs['targetAttr'] : ''; ?>><?php the_title(); ?></a>
                                    </h4>
                                    <?php if (nipponbudokan_event_value_present($host)): ?>
                                        <p class="te_upcoming_host"><?php echo nl2br(esc_html((string) $host)); ?></p>
                                    <?php endif; ?>
                                    <?php if ($external_url): ?>
                                        <p class="te_upcoming_url">
                                            <a href="<?php echo esc_url($external_url); ?>"<?php echo !empty($link_attrs['targetAttr']) ? $link_attrs['targetAttr'] : ' target="_blank" rel="noreferrer external"'; ?>><?php echo esc_html($external_url); ?></a>
                                            <span class="te_external_icon" aria-hidden="true"></span>
                                        </p>
                                    <?php endif; ?>
                                </div>
                            </article>
                        <?php endwhile; ?>
                        <?php wp_reset_postdata(); ?>
                    </div>
                <?php endif; ?>

                <p class="te_more">
                    <a href="<?php echo esc_url($event_archive_url); ?>">
                        <span class="te_more_icon" aria-hidden="true"></span>
                        <span>一覧を表示</span>
                    </a>
                </p>
            </section>
        </div>
    </div>
</section>
