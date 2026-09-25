<?php
/**
 * Template Name: 日本武道館発行の単行本
 *
 * /publications/budo/books/ fixed-page owner.
 * - newest published tankoubon is the featured recommendation
 * - category navigation links to taxonomy sections on this page
 * - every published tankoubon is rendered for each assigned `book` term
 * - no pagination
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();

$latest_posts = get_posts(array(
    'post_type'           => 'tankoubon',
    'post_status'         => 'publish',
    'posts_per_page'      => 1,
    'orderby'             => 'date',
    'order'               => 'DESC',
    'ignore_sticky_posts' => true,
    'no_found_rows'       => true,
));
$latest_id = !empty($latest_posts) ? (int) $latest_posts[0]->ID : 0;

$book_terms = get_terms(array(
    'taxonomy'   => 'book',
    'hide_empty' => true,
));
if (is_wp_error($book_terms)) {
    $book_terms = array();
}

$term_sections = array();
foreach ($book_terms as $term) {
    $term_query = new WP_Query(array(
        'post_type'           => 'tankoubon',
        'post_status'         => 'publish',
        'posts_per_page'      => -1,
        'orderby'             => 'date',
        'order'               => 'DESC',
        'ignore_sticky_posts' => true,
        'no_found_rows'       => true,
        'tax_query'           => array(array(
            'taxonomy' => 'book',
            'field'    => 'term_id',
            'terms'    => array((int) $term->term_id),
        )),
    ));
    if ($term_query->have_posts()) {
        $term_sections[] = array(
            'term'  => $term,
            'posts' => $term_query->posts,
        );
    }
    wp_reset_postdata();
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

                <?php if ($latest_id) : ?>
                    <section class="publication_book-listSection publication_book-latest" aria-labelledby="publication-book-latest-heading">
                        <h2 id="publication-book-latest-heading" class="publication_book-listHeading">今月のおすすめ</h2>
                        <?php get_template_part('template-parts/publications/_book-list-card', null, array('post_id' => $latest_id, 'featured' => true)); ?>
                    </section>
                <?php endif; ?>

                <?php if (!empty($term_sections)) : ?>
                    <nav class="block-editor_wrap publication_book-categoryNav" aria-label="カテゴリ">
                        <ul class="module_inPageLink-01" data-column="4">
                            <?php foreach ($term_sections as $section) : ?>
                                <?php $term = $section['term']; ?>
                                <li class="inPageLink"><a href="#book-category-<?php echo esc_attr($term->term_id); ?>"><span class="title"><?php echo esc_html($term->name); ?></span></a></li>
                            <?php endforeach; ?>
                        </ul>
                    </nav>

                    <div class="publication_book-categorySections">
                        <?php foreach ($term_sections as $section) : ?>
                            <?php $term = $section['term']; ?>
                            <section id="book-category-<?php echo esc_attr($term->term_id); ?>" class="publication_book-listSection publication_book-categorySection">
                                <h2 class="publication_book-listHeading"><?php echo esc_html($term->name); ?></h2>
                                <div class="publication_book-cardList">
                                    <?php foreach ($section['posts'] as $book_post) : ?>
                                        <?php get_template_part('template-parts/publications/_book-list-card', null, array('post_id' => (int) $book_post->ID)); ?>
                                    <?php endforeach; ?>
                                </div>
                            </section>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
