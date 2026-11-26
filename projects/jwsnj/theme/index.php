<?php get_header(); ?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
  <?php if (is_home() || is_category()) : ?>
    <?php get_template_part('template-parts/_news-archive'); ?>
  <?php else : ?>
    <section>
      <?php get_template_part('template-parts/_visual'); ?>
      <div class="global_inner _column">
        <div class="gc_main">
          <?php get_template_part('template-parts/_list-news'); ?>
        </div>
        <aside class="gc_sub">
          <?php get_sidebar('archive'); ?>
        </aside>
      </div>
    </section>
  <?php endif; ?>
</main>
<?php get_footer(); ?>
