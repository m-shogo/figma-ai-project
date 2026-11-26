<?php
// Test/QA only. Never include from the production theme or seed WordPress.
// Exact PC Figma sample copy and already stored official photographs.
$examples = [
    ['preschool', '幼児部', '行事や活動を通して、日本語や日本の文化に親しみます。'],
    ['elementary', '初等部', '日本の学習指導要領に基づき、日本の文化や伝統行事も体験します。'],
    ['junior', '中等部', '日本の学習指導要領に基づき学習し、日本文化への理解を深めます。'],
    ['high', '高等部', '日本の教科書を活用し、国際社会で生かせる学びを広げます。'],
    ['international', '国際学級', '日本語を学びながら、日本の文化や生活習慣への知識を深めます。'],
];
return array_map(static function ($example) {
    return [
        'title' => $example[1],
        'text' => $example[2],
        'image_html' => '<img src="' . esc_url(get_theme_file_uri('images/top/img_course-' . $example[0] . '.webp')) . '" alt="">',
    ];
}, $examples);
