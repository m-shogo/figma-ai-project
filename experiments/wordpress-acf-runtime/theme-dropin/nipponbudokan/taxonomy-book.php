<?php
/**
 * 単行本カテゴリ /books/books_cat/{term}/
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();

$current_term = get_queried_object();
$book_terms = get_terms(nipponbudokan_term_query(array(
    'taxonomy'   => 'book',
    'hide_empty' => true,
)));
if (is_wp_error($book_terms)) {
    $book_terms = array();
}
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>

        <div class="global_inner _content publication_budo-shell publication_book-listShell">
            <div class="gc_main _oneColumn">
                <div class="block-editor_wrap">
                    <h2 class="wp-block-heading">日本武道館発行の単行本</h2>
                </div>

                <?php if (!empty($book_terms)) : ?>
                    <nav class="block-editor_wrap publication_book-categoryNav" aria-label="カテゴリ">
                        <ul class="module_inPageLink-01" data-column="4">
                            <?php foreach ($book_terms as $term) : ?>
                                <?php $term_url = get_term_link($term); ?>
                                <li class="inPageLink<?php echo ((int) $term->term_id === (int) $current_term->term_id) ? ' _current' : ''; ?>">
                                    <a href="<?php echo esc_url(!is_wp_error($term_url) ? $term_url : ''); ?>"><span class="title"><?php echo esc_html($term->name); ?></span></a>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </nav>
                <?php endif; ?>

                <section class="publication_book-listSection publication_book-categorySection">
                    <h2 class="publication_book-listHeading"><?php echo esc_html($current_term->name); ?></h2>
                    <div class="publication_book-cardList">
                        <?php if (have_posts()) : ?>
                            <?php while (have_posts()) : the_post(); ?>
                                <?php get_template_part('template-parts/publications/_book-list-card', null, array('post_id' => get_the_ID())); ?>
                            <?php endwhile; ?>
                        <?php endif; ?>
                    </div>
                </section>
            </div>
        </div>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
