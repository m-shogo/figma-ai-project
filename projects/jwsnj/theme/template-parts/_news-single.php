<?php
// Normal posts: reuse the news hero and existing WordPress content ownership.
$posts_id = get_option('show_on_front') === 'posts' ? 0 : (int) get_option('page_for_posts');
$posts_url = '';
if ($posts_id && $posts_id !== (int) get_option('page_on_front')
  && get_post_type($posts_id) === 'page' && get_post_status($posts_id) === 'publish') {
  $posts_url = esc_url(get_permalink($posts_id));
}
if (!$posts_url) {
  $posts_id = 0;
}
// Latest-posts front is only a valid return link when the actual front template
// is configured to render the posts index; do not link to the old sample TOP.
$context = ['news_archive' => true, 'news_single' => true, 'posts_page_id' => $posts_id, 'posts_page_url' => $posts_url];
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
  <section class="jwsnj_newsSingle">
    <?php get_template_part('template-parts/_news-archive-visual', null, $context); ?>
    <div class="global_inner jwsnj_newsSingle_inner">
      <?php if (post_password_required()) : ?>
        <h1 class="jwsnj_newsSingle_title"><?php the_title(); ?></h1>
        <div class="module_password"><?php echo get_the_password_form(); ?></div>
      <?php else : ?>
        <article itemscope itemtype="https://schema.org/NewsArticle">
          <meta itemprop="datePublished" content="<?php echo esc_attr(get_the_time('c')); ?>">
          <meta itemprop="dateModified" content="<?php echo esc_attr(get_the_modified_date('c')); ?>">
          <header class="jwsnj_newsSingle_head">
            <p class="jwsnj_newsSingle_date"><span class="jwsnj_newsSingle_calendar" aria-hidden="true"></span><time datetime="<?php echo esc_attr(get_the_time('Y-m-d')); ?>"><?php the_time('m/d/Y'); ?></time></p>
            <h1 class="jwsnj_newsSingle_title" itemprop="headline"><?php the_title(); ?></h1>
          </header>
          <div class="block-editor_wrap" itemprop="articleBody"><?php the_content(); ?></div>
        </article>
        <?php get_template_part('template-parts/_news-single-pager', null, ['posts_url' => $posts_url]); ?>
      <?php endif; ?>
    </div>
    <?php get_template_part('template-parts/_breadCrumb', null, $context); ?>
  </section>
</main>
