<?php

declare(strict_types=1);

add_action('after_setup_theme', static function (): void {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'gallery', 'caption', 'style', 'script']);
});

add_action('wp_enqueue_scripts', static function (): void {
    wp_enqueue_style(
        'ref001-benchmark-shell',
        get_stylesheet_uri(),
        [],
        wp_get_theme()->get('Version') ?: null
    );
});

/**
 * Register the fresh benchmark-specific ACF PRO schema with stable field keys.
 * A matching importable JSON bundle is delivered in output/acf-export.json.
 */
add_action('acf/init', static function (): void {
    if (!function_exists('acf_add_local_field_group')) {
        return;
    }

    $definitions = [
        ['hero_lead', 'Hero lead', 'textarea'],
        ['hero_left_image', 'Hero left image', 'image'],
        ['hero_right_image', 'Hero right image', 'image'],
        ['reason_intro', 'Reason intro', 'textarea'],
        ['reason_1_title', 'Reason 1 title', 'text'],
        ['reason_1_body', 'Reason 1 body', 'textarea'],
        ['reason_2_title', 'Reason 2 title', 'text'],
        ['reason_2_body', 'Reason 2 body', 'textarea'],
        ['reason_3_title', 'Reason 3 title', 'text'],
        ['reason_3_body', 'Reason 3 body', 'textarea'],
        ['reason_1_image', 'Reason 1 image', 'image'],
        ['reason_2_image', 'Reason 2 image', 'image'],
        ['reason_3_image', 'Reason 3 image', 'image'],
        ['education_lead_title', 'Education lead title', 'text'],
        ['education_lead_body', 'Education lead body', 'textarea'],
        ['education_1_image', 'Education 1 image', 'image'],
        ['education_2_image', 'Education 2 image', 'image'],
        ['education_3_image', 'Education 3 image', 'image'],
        ['education_4_image', 'Education 4 image', 'image'],
        ['cta_background_image', 'CTA background image', 'image'],
        ['voice_1_quote', 'Voice 1 quote', 'textarea'],
        ['voice_1_byline', 'Voice 1 byline', 'textarea'],
        ['voice_1_portrait', 'Voice 1 portrait', 'image'],
        ['voice_2_quote', 'Voice 2 quote', 'textarea'],
        ['voice_2_byline', 'Voice 2 byline', 'textarea'],
        ['voice_2_portrait', 'Voice 2 portrait', 'image'],
        ['voice_3_quote', 'Voice 3 quote', 'textarea'],
        ['voice_3_byline', 'Voice 3 byline', 'textarea'],
        ['voice_3_portrait', 'Voice 3 portrait', 'image'],
        ['voice_1_detail_image', 'Voice 1 detail image', 'image'],
        ['voice_1_detail', 'Voice 1 detail text', 'textarea'],
        ['voice_1_class', 'Voice 1 memorable class', 'text'],
        ['voice_1_reason', 'Voice 1 enrollment reason', 'text'],
        ['voice_1_message', 'Voice 1 applicant message', 'textarea'],
        ['messages_quote', 'Messages quote', 'textarea'],
        ['messages_byline', 'Messages byline', 'textarea'],
        ['messages_image', 'Messages image', 'image'],
        ['value_left_image', 'Value CTA left image', 'image'],
        ['value_right_image', 'Value CTA right image', 'image'],
        ['footer_address', 'Footer address and phone', 'textarea'],
    ];
    $fields = [];
    foreach ($definitions as $index => [$name, $label, $type]) {
        $field = [
            'key' => sprintf('field_ref001_clean_%03d', $index + 1),
            'label' => $label,
            'name' => $name,
            'type' => $type,
        ];
        if ($type === 'image') {
            $field += ['return_format' => 'id', 'library' => 'all'];
        } elseif ($type === 'textarea') {
            $field += ['rows' => 4, 'new_lines' => ''];
        }
        $fields[] = $field;
    }

    acf_add_local_field_group([
        'key' => 'group_ref001_benchmark_clean_replay_20260821',
        'title' => 'REF-001 Benchmark Clean Replay',
        'fields' => $fields,
        'location' => [[[
            'param' => 'page_template',
            'operator' => '==',
            'value' => 'page-templates/template-ref001-benchmark.php',
        ]]],
        'active' => true,
        'show_in_rest' => 0,
    ]);
});

/**
 * Read a page-owned ACF value while keeping a deterministic Figma-derived
 * fallback for the benchmark fixture before editors populate the page.
 *
 * @param mixed $fallback
 * @return mixed
 */
function ref001_benchmark_field(string $name, $fallback = '')
{
    if (function_exists('get_field')) {
        $value = get_field($name);
        if ($value !== null && $value !== false && $value !== '') {
            return $value;
        }
    }

    return $fallback;
}

/**
 * Render an ACF image field through the WordPress attachment pipeline.
 * No Figma short-lived URL is committed as source code.
 */
function ref001_benchmark_image(string $field_name, string $class_name, string $alt = ''): string
{
    $attachment_id = ref001_benchmark_field($field_name, 0);
    $attachment_id = is_numeric($attachment_id) ? (int) $attachment_id : 0;
    $classes = preg_split('/\s+/', trim($class_name)) ?: [];
    $base_class = $classes[0] ?? 'c-ref001-media';

    if ($attachment_id > 0) {
        $markup = wp_get_attachment_image(
            $attachment_id,
            'full',
            false,
            [
                'class' => $base_class . '__img',
                'alt' => $alt,
                'loading' => 'lazy',
                'decoding' => 'async',
            ]
        );
        if (is_string($markup) && $markup !== '') {
            return '<div class="' . esc_attr($class_name) . '">' . $markup . '</div>';
        }
    }

    return '<div class="' . esc_attr($class_name) . ' ' . esc_attr($base_class . '--fallback') . '" aria-hidden="true"></div>';
}

/** @return list<string> */
function ref001_benchmark_lines(string $field_name, array $fallback): array
{
    $value = ref001_benchmark_field($field_name, implode("\n", $fallback));
    if (!is_string($value)) {
        return $fallback;
    }

    $lines = preg_split('/\R/u', $value) ?: [];
    $lines = array_values(array_filter(array_map('trim', $lines), static fn (string $line): bool => $line !== ''));

    return $lines ?: $fallback;
}
