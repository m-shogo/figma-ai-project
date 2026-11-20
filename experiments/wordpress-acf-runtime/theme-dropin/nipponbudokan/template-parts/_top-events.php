<?php
$theme_uri = get_template_directory_uri();

$featured_rows = function_exists('get_field') ? get_field('top_featured-01', get_queried_object_id()) : array();
if (!is_array($featured_rows)) {
    $featured_rows = array();
}
$featured_rows = array_slice($featured_rows, 0, 4);
$featured_status_labels = array(
    'recruiting' => '募集中',
    'visitor' => '観覧案内',
    'ongoing' => '開催中',
    'closed' => '受付終了',
);
if (function_exists('acf_get_field')) {
    $status_field = acf_get_field('field_top_featured_status');
    if (is_array($status_field) && isset($status_field['choices']) && is_array($status_field['choices'])) {
        foreach ($status_field['choices'] as $choice_value => $choice_label) {
            $choice_value = trim((string) $choice_value);
            $choice_label = trim(wp_strip_all_tags((string) $choice_label));
            if ($choice_value === '' || $choice_value === 'none' || $choice_label === '' || $choice_label === 'なし') {
                continue;
            }
            $featured_status_labels[$choice_value] = $choice_label;
        }
    }
}
$featured_status_hidden = static function ($text) {
    return $text === '' || $text === 'none' || $text === 'なし';
};
$featured_status_from = static function ($status) use ($featured_status_labels, $featured_status_hidden) {
    $value = '';
    $label = '';
    if (is_array($status)) {
        $value = isset($status['value']) ? trim((string) $status['value']) : '';
        $label = isset($status['label']) ? trim(wp_strip_all_tags((string) $status['label'])) : '';
    } else {
        $value = trim(wp_strip_all_tags((string) $status));
    }
    if (!$featured_status_hidden($value) && isset($featured_status_labels[$value])) {
        return array(sanitize_html_class($value), $featured_status_labels[$value]);
    }
    $from_label = !$featured_status_hidden($label) ? $label : $value;
    if ($featured_status_hidden($from_label)) {
        return array('', '');
    }
    $matched = array_search($from_label, $featured_status_labels, true);
    if ($matched !== false) {
        return array(sanitize_html_class((string) $matched), $from_label);
    }
    $class = sanitize_html_class(!$featured_status_hidden($value) ? $value : $from_label);
    return array($class !== '' ? $class : 'custom', $from_label);
};

$event_terms = get_terms(nipponbudokan_event_cat_query(array(
    'hide_empty' => true,
)));
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
    'meta_query' => function_exists('nipponbudokan_event_upcoming_meta_query')
        ? nipponbudokan_event_upcoming_meta_query()
        : array(
            array(
                'key' => 'event_date',
                'value' => wp_date('Ymd'),
                'compare' => '>=',
                'type' => 'CHAR',
            ),
        ),
);

$event_archive = get_post_type_archive_link('event') ?: '';
$event_panels = array(
    array(
        'id' => 'all',
        'label' => 'すべて',
        'url' => $event_archive,
        'query' => new WP_Query($upcoming_args),
    ),
);
foreach ($event_terms as $term) {
    $term_url = get_term_link($term);
    if (is_wp_error($term_url)) {
        continue;
    }
    $term_args = $upcoming_args;
    $term_args['tax_query'] = array(
        array(
            'taxonomy' => 'event_cat',
            'field' => 'term_id',
            'terms' => (int) $term->term_id,
        ),
    );
    $event_panels[] = array(
        'id' => (string) $term->term_id,
        'label' => $term->name,
        'url' => $term_url,
        'query' => new WP_Query($term_args),
    );
}

$render_upcoming_items = static function ($query) {
    if (!$query->have_posts()) {
        return;
    }
    while ($query->have_posts()) {
        $query->the_post();
        $timestamp = function_exists('nipponbudokan_event_datetime')
            ? nipponbudokan_event_datetime()
            : 0;
        $open_time = function_exists('get_field') ? get_field('event_open_time') : '';
        $start_time = function_exists('get_field') ? get_field('event_start_time') : '';
        $contact = function_exists('get_field') ? get_field('event_contact') : '';
        $link_attrs = get_post_link_attributes();
        $href = !empty($link_attrs['url']) ? $link_attrs['url'] : '';
        $weekday_index = $timestamp ? (int) wp_date('w', $timestamp) : 0;
        $weekday_labels = array('日', '月', '火', '水', '木', '金', '土');
        $weekday_class = $weekday_index === 0 ? ' is-sun' : ($weekday_index === 6 ? ' is-sat' : '');
        $has_category = has_term('', 'event_cat', get_the_ID());
        $time_inner = '';
        if (function_exists('nipponbudokan_event_value_present') && (nipponbudokan_event_value_present($open_time) || nipponbudokan_event_value_present($start_time))) {
            if (nipponbudokan_event_value_present($open_time)) {
                $time_inner .= '<span>開場：' . esc_html($open_time) . '</span>';
            }
            if (nipponbudokan_event_value_present($open_time) && nipponbudokan_event_value_present($start_time)) {
                $time_inner .= '<span class="te_upcoming_time_sep" aria-hidden="true"> / </span>';
            }
            if (nipponbudokan_event_value_present($start_time)) {
                $time_inner .= '<span>開会・開演：' . esc_html($start_time) . '</span>';
            }
        }
        $contact_html = '';
        if (function_exists('nipponbudokan_top_event_contact_html')) {
            $contact_html = nipponbudokan_top_event_contact_html($contact);
        } elseif (function_exists('nipponbudokan_event_contact_html')) {
            $contact_html = nipponbudokan_event_contact_html($contact);
        }
        ?>
        <article class="te_upcoming_item">
            <div class="te_upcoming_when">
                <?php if ($timestamp || $has_category): ?>
                    <div class="te_upcoming_day<?php echo esc_attr($weekday_class); ?>">
                        <?php if ($timestamp): ?>
                            <time datetime="<?php echo esc_attr(wp_date('Y-m-d', $timestamp)); ?>"><?php echo esc_html(wp_date('n/j', $timestamp)); ?> <span>(<?php echo esc_html($weekday_labels[$weekday_index]); ?>)</span></time>
                        <?php endif; ?>
                        <?php if ($has_category): ?>
                            <div class="te_upcoming_labels">
                                <?php get_template_part('template-parts/_label-category', null, array('taxonomy' => '_cat')); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
                <?php if ($time_inner !== ''): ?>
                    <p class="te_upcoming_time te_upcoming_time-sp"><?php echo $time_inner; ?></p>
                <?php endif; ?>
            </div>
            <div class="te_upcoming_body">
                <h4 class="te_upcoming_title"><?php if ($href !== '') : ?><a href="<?php echo esc_url($href); ?>"<?php echo !empty($link_attrs['targetAttr']) ? $link_attrs['targetAttr'] : ''; ?>><?php the_title(); ?></a><?php else : ?><?php the_title(); ?><?php endif; ?></h4>
                <?php if ($time_inner !== ''): ?>
                    <p class="te_upcoming_time te_upcoming_time-pc"><?php echo $time_inner; ?></p>
                <?php endif; ?>
                <?php if ($contact_html !== '') : ?>
                    <div class="te_upcoming_host"><?php echo $contact_html; ?></div>
                <?php endif; ?>
            </div>
        </article>
        <?php
    }
    wp_reset_postdata();
};
?>
<section id="top_events-01" class="top_events-01">
    <div class="global_inner">
        <h2 class="te_heading">
            <span class="te_heading_ja">大会・イベント情報</span>
            <span class="te_heading_en"><span class="te_heading_en_initial">E</span>vent</span>
        </h2>

        <?php
        $featured_visible = array();
        foreach ($featured_rows as $featured_row) {
            if (!is_array($featured_row)) {
                continue;
            }
            $featured_title = isset($featured_row['title']) ? trim((string) $featured_row['title']) : '';
            $featured_category = isset($featured_row['category']) ? trim((string) $featured_row['category']) : '';
            $featured_url = isset($featured_row['url']) ? trim((string) $featured_row['url']) : '';
            $featured_status = $featured_status_from($featured_row['status'] ?? '')[1];
            $featured_thumb = !empty($featured_row['thumb']);
            $featured_date = isset($featured_row['date']) ? trim((string) $featured_row['date']) : '';
            if ($featured_title === '' && $featured_category === '' && $featured_url === '' && $featured_date === '' && !$featured_thumb && $featured_status === '') {
                continue;
            }
            $featured_visible[] = $featured_row;
        }
        ?>
        <div class="te_layout">
            <?php if ($featured_visible !== array()): ?>
            <div class="te_featured">
                <div class="te_section_head te_featured_head">
                    <span class="te_section_icon te_featured_icon" aria-hidden="true"></span>
                    <h3 class="te_section_title">注目の主催事業</h3>
                </div>

                <div class="te_cards">
                    <?php foreach ($featured_visible as $row): ?>
                        <?php
                        if (!is_array($row)) {
                            continue;
                        }
                        $title = isset($row['title']) ? trim((string) $row['title']) : '';
                        $category = isset($row['category']) ? trim((string) $row['category']) : '';
                        $url = isset($row['url']) ? trim(str_replace(array("\r", "\n"), '', (string) $row['url'])) : '';
                        $external = !empty($row['external']);
                        list($status_value, $status_label) = $featured_status_from($row['status'] ?? '');
                        $thumb_id = isset($row['thumb']) ? (int) $row['thumb'] : 0;
                        $thumb = $thumb_id ? wp_get_attachment_image_src($thumb_id, 'medium') : null;
                        $img = !empty($thumb[0]) ? $thumb[0] : $theme_uri . '/images/common/noimage.webp';
                        $date_text = isset($row['date']) ? trim((string) $row['date']) : '';
                        if ($title === '' && $category === '' && $url === '' && $date_text === '' && !$thumb_id && $status_label === '') {
                            continue;
                        }
                        ?>
                        <article class="te_card">
                            <?php if ($url !== ''): ?>
                                <a class="te_card_link" href="<?php echo esc_url($url); ?>"<?php echo $external ? ' target="_blank" rel="noopener noreferrer"' : ''; ?>>
                            <?php else: ?>
                                <div class="te_card_link">
                            <?php endif; ?>
                                <p class="te_card_image">
                                    <img src="<?php echo esc_url($img); ?>" alt="" width="220" height="165" loading="lazy">
                                </p>
                                <div class="te_card_body">
                                    <?php if ($status_label !== '' || $category !== ''): ?>
                                        <p class="te_card_labels">
                                            <?php if ($status_label !== ''): ?>
                                                <span class="te_label te_status te_status-<?php echo esc_attr($status_value); ?>"><?php echo esc_html($status_label); ?></span>
                                            <?php endif; ?>
                                            <?php if ($category !== ''): ?>
                                                <span class="te_label te_label_cat"><?php echo esc_html($category); ?></span>
                                            <?php endif; ?>
                                        </p>
                                    <?php endif; ?>
                                    <?php if ($title !== ''): ?>
                                        <h3 class="te_card_title"><span class="te_card_title_line"><?php echo nbk_title_html($title); ?></span></h3>
                                    <?php endif; ?>
                                    <?php if ($date_text !== ''): ?>
                                        <p class="te_card_date"><span class="te_card_date_label">開催日</span><?php echo esc_html($date_text); ?></p>
                                    <?php endif; ?>
                                </div>
                            <?php if ($url !== ''): ?>
                                </a>
                            <?php else: ?>
                                </div>
                            <?php endif; ?>
                        </article>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

            <div class="te_upcoming">
                <div class="te_section_head te_upcoming_head">
                    <div class="te_upcoming_heading">
                        <span class="te_section_icon te_upcoming_icon" aria-hidden="true"></span>
                        <h3 class="te_section_title">近日開催の行事予定</h3>
                    </div>

                    <div class="te_filter">
                        <label class="screen-reader-text" for="te_event_cat">イベントカテゴリー</label>
                        <select id="te_event_cat">
                            <?php foreach ($event_panels as $index => $panel): ?>
                                <option value="<?php echo esc_attr($panel['id']); ?>" data-event-archive="<?php echo esc_url($panel['url']); ?>"<?php echo $index === 0 ? ' selected' : ''; ?>><?php echo esc_html($panel['label']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div class="te_upcoming_lists">
                    <?php foreach ($event_panels as $index => $panel): ?>
                        <div class="te_upcoming_list" data-event-panel="<?php echo esc_attr($panel['id']); ?>"<?php echo $index === 0 ? '' : ' hidden'; ?>>
                            <?php $render_upcoming_items($panel['query']); ?>
                        </div>
                    <?php endforeach; ?>
                </div>

                <p class="te_more">
                    <a class="module_listMore" data-event-more href="<?php echo esc_url($event_archive); ?>">
                        <span class="module_listMore_icon" aria-hidden="true"></span>
                        <span>一覧を表示</span>
                    </a>
                </p>
            </div>
        </div>
    </div>
</section>
