<?php
/**
 * Template Name: 日本武道館発行の単行本
 *
 * /publications/budo/books/ fixed-page owner.
 * - featured recommendation is the page relationship field `tankoubon_recommend`
 * - category navigation links to taxonomy sections on this page
 * - every published tankoubon is rendered for each assigned `book` term
 * - no pagination
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();

$recommend_ids = function_exists('get_field') ? get_field('tankoubon_recommend', get_queried_object_id()) : array();
if (!is_array($recommend_ids)) {
    $recommend_ids = $recommend_ids ? array($recommend_ids) : array();
}
$featured_id = 0;
foreach ($recommend_ids as $recommend_id) {
    $recommend_id = is_object($recommend_id) ? (int) $recommend_id->ID : (int) $recommend_id;
    if ($recommend_id && get_post_type($recommend_id) === 'tankoubon' && get_post_status($recommend_id) === 'publish') {
        $featured_id = $recommend_id;
        break;
    }
}

$book_terms = get_terms(nipponbudokan_term_query(array(
    'taxonomy'   => 'book',
    'hide_empty' => true,
)));
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

                <?php if ($featured_id) : ?>
                    <section class="publication_book-listSection publication_book-latest" aria-labelledby="publication-book-latest-heading">
                        <h2 id="publication-book-latest-heading" class="publication_book-listHeading">最新刊</h2>
                        <?php get_template_part('template-parts/publications/_book-list-card', null, array('post_id' => $featured_id, 'featured' => true)); ?>
                    </section>
                <?php endif; ?>

                <?php if (!empty($term_sections)) : ?>
                    <nav class="block-editor_wrap publication_book-categoryNav" aria-label="カテゴリ">
                        <ul class="module_inPageLink-01" data-column="4">
                            <?php foreach ($term_sections as $section) : ?>
                                <?php $term = $section['term']; ?>
                                <li class="inPageLink"><a href="#book-<?php echo esc_attr($term->slug); ?>"><span class="title"><?php echo esc_html($term->name); ?></span></a></li>
                            <?php endforeach; ?>
                        </ul>
                    </nav>

                    <div class="publication_book-categorySections">
                        <?php foreach ($term_sections as $section) : ?>
                            <?php $term = $section['term']; ?>
                            <section id="book-<?php echo esc_attr($term->slug); ?>" class="publication_book-listSection publication_book-categorySection">
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

        <?php get_template_part('template-parts/_local-navigation'); ?>
        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
