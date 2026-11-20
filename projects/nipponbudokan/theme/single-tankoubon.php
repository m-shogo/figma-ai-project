<?php
/**
 * 投稿タイプ: tankoubon（単行本）詳細。
 * 値は ACF とアイキャッチ。記事本文は出さない。
 */
get_template_part('template-parts/publications/_acf-has-value');

if (!function_exists('nbk_book_content_list_classes')) {
    /**
     * 単行本の内容だけ。クラスの無い ul に wp-block-list を足す。中身は変えない。
     */
    function nbk_book_content_list_classes($html)
    {
        $html = (string) $html;
        if ($html === '') {
            return '';
        }
        $html = preg_replace_callback(
            '/<ul\b([^>]*)>/i',
            static function ($matches) {
                $attrs = $matches[1];
                if (preg_match('/\bclass\s*=\s*(["\'])(.*?)\1/i', $attrs, $class)) {
                    $names = preg_split('/\s+/', trim($class[2])) ?: array();
                    if (!in_array('wp-block-list', $names, true)) {
                        $names[] = 'wp-block-list';
                    }
                    $replacement = 'class=' . $class[1] . trim(implode(' ', array_filter($names))) . $class[1];
                    $attrs = preg_replace('/\bclass\s*=\s*(["\']).*?\1/i', $replacement, $attrs, 1);
                    return '<ul' . $attrs . '>';
                }
                return '<ul class="wp-block-list"' . $attrs . '>';
            },
            $html
        );
        return wp_kses_post($html);
    }
}

get_header();
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>

        <div class="global_inner _content publication_budo-shell publication_budo-shell--detail">
            <div class="gc_main _oneColumn">
                <?php while (have_posts()) : the_post(); ?>
                    <?php get_template_part('template-parts/publications/_book-detail', null, array('post_id' => get_the_ID())); ?>

                    <?php $book_content = get_field('book_content'); ?>
                    <?php if (nbk_acf_value_present($book_content)) : ?>
                        <div class="block-editor_wrap publication_book-content">
                            <h3 class="wp-block-heading">内容</h3>
                            <?php echo nbk_book_content_list_classes($book_content); ?>
                        </div>
                    <?php endif; ?>
                <?php endwhile; ?>
            </div>
        </div>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
