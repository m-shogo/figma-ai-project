<?php
// QA-only reference content. No live URLs or production fallback.
$examples = [
    ['学校概要', 'img_about-overview.webp'],
    ['教育環境', 'img_mv-05.webp'],
    ['教育内容', 'img_about-education.webp'],
    ['交通アクセス', 'img_mv-06.webp'],
];
return array_map(static function ($example) {
    return [
        'title' => $example[0],
        'image_html' => '<img src="' . esc_url(get_theme_file_uri('images/top/' . $example[1])) . '" alt="">',
    ];
}, $examples);
