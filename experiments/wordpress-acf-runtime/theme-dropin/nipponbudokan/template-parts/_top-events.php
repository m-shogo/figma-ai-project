<?php
$theme_uri = get_template_directory_uri();

$featured_rows = function_exists('get_field') ? get_field('top_featured-01', get_queried_object_id()) : array();
if (!is_array($featured_rows)) {
    $featured_rows = array();
}
$featured_rows = array_slice($featured_rows, 0, 4);
$featured_status_labels = array(
    'recruiting' => '募集中',
    'ongoing' => '開催中',
    'closed' => '受付終了',
);

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
        $link_type = function_exists('get_field') ? get_field('post_type') : '';
        $external_url = ($link_type === 'url' && $href !== '') ? $href : '';
        $weekday_index = $timestamp ? (int) wp_date('w', $timestamp) : 0;
        $weekday_labels = array('日', '月', '火', '水', '木', '金', '土');
        $weekday_class = $weekday_index === 0 ? ' is-sun' : ($weekday_index === 6 ? ' is-sat' : '');
        ?>
        <article class="te_upcoming_item">
            <div class="te_upcoming_when">
                <?php if ($timestamp): ?>
                    <p class="te_upcoming_day<?php echo esc_attr($weekday_class); ?>">
                        <time datetime="<?php echo esc_attr(wp_date('Y-m-d', $timestamp)); ?>"><?php echo esc_html(wp_date('n/j', $timestamp)); ?> <span>(<?php echo esc_html($weekday_labels[$weekday_index]); ?>)</span></time>
                    </p>
                <?php endif; ?>
                <?php if (function_exists('nipponbudokan_event_value_present') && (nipponbudokan_event_value_present($open_time) || nipponbudokan_event_value_present($start_time))): ?>
                    <p class="te_upcoming_time">
                        <?php if (nipponbudokan_event_value_present($open_time)): ?><span>開場：<?php echo esc_html($open_time); ?></span><?php endif; ?>
                        <?php if (nipponbudokan_event_value_present($open_time) && nipponbudokan_event_value_present($start_time)): ?><span aria-hidden="true"> / </span><?php endif; ?>
                        <?php if (nipponbudokan_event_value_present($start_time)): ?><span>開会：<?php echo esc_html($start_time); ?></span><?php endif; ?>
                    </p>
                <?php endif; ?>
            </div>
            <div class="te_upcoming_body">
                <h4 class="te_upcoming_title"><?php if ($href !== '') : ?><a href="<?php echo esc_url($href); ?>"<?php echo !empty($link_attrs['targetAttr']) ? $link_attrs['targetAttr'] : ''; ?>><?php the_title(); ?></a><?php else : ?><?php the_title(); ?><?php endif; ?></h4>
                <?php if (function_exists('nipponbudokan_event_contact_html')) : ?>
                    <?php $contact_html = nipponbudokan_event_contact_html($contact); ?>
                    <?php if ($contact_html !== '') : ?>
                        <div class="te_upcoming_host"><?php echo $contact_html; ?></div>
                    <?php endif; ?>
                <?php endif; ?>
                <?php if ($external_url !== ''): ?>
                    <p class="te_upcoming_url"><span><?php echo esc_html($external_url); ?></span></p>
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

        <div class="te_layout">
            <div class="te_featured">
                <div class="te_section_head te_featured_head">
                    <span class="te_section_icon te_featured_icon" aria-hidden="true"></span>
                    <h3 class="te_section_title">注目の主催事業</h3>
                </div>

                <div class="te_cards">
                    <?php foreach ($featured_rows as $row): ?>
                        <?php
                        if (!is_array($row)) {
                            continue;
                        }
                        $title = isset($row['title']) ? trim((string) $row['title']) : '';
                        $category = isset($row['category']) ? trim((string) $row['category']) : '';
                        $url = isset($row['url']) ? trim(str_replace(array("\r", "\n"), '', (string) $row['url'])) : '';
                        $external = !empty($row['external']);
                        $status_value = isset($row['status']) ? (string) $row['status'] : '';
                        $status_label = $featured_status_labels[$status_value] ?? '';
                        $thumb_id = isset($row['thumb']) ? (int) $row['thumb'] : 0;
                        $thumb = $thumb_id ? wp_get_attachment_image_src($thumb_id, 'medium') : null;
                        $img = !empty($thumb[0]) ? $thumb[0] : $theme_uri . '/images/common/noimage.webp';
                        $date_html = '';
                        $date_raw = isset($row['date']) ? (string) $row['date'] : '';
                        if (preg_match('/^\d{8}$/', $date_raw)) {
                            $date_raw = substr($date_raw, 0, 4) . '-' . substr($date_raw, 4, 2) . '-' . substr($date_raw, 6, 2);
                        }
                        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_raw)) {
                            $parsed = date_create_from_format('!Y-m-d', $date_raw, wp_timezone());
                            if ($parsed instanceof DateTimeInterface) {
                                $timestamp = $parsed->getTimestamp();
                                $weekday_index = (int) wp_date('w', $timestamp);
                                $weekday_labels = array('日', '月', '火', '水', '木', '金', '土');
                                $weekday_class = $weekday_index === 0 ? ' is-sun' : ($weekday_index === 6 ? ' is-sat' : '');
                                $date_html = '<time datetime="' . esc_attr(wp_date('Y-m-d', $timestamp)) . '">' . esc_html(wp_date('Y年n月j日', $timestamp)) . '(<span class="ea_wday' . esc_attr($weekday_class) . '">' . esc_html($weekday_labels[$weekday_index]) . '</span>)</time>';
                            }
                        }
                        if ($title === '' && $category === '' && $url === '' && $date_html === '' && !$thumb_id && $status_label === '') {
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
                                        <h3 class="te_card_title"><?php echo esc_html($title); ?></h3>
                                    <?php endif; ?>
                                    <?php if ($date_html !== ''): ?>
                                        <p class="te_card_date"><span class="te_card_date_label">開催日</span><?php echo $date_html; ?></p>
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
