<?php

declare(strict_types=1);

get_header();
?>
<main id="primary">
    <?php while (have_posts()) : the_post(); ?>
        <article <?php post_class(); ?>>
            <?php the_content(); ?>
        </article>
    <?php endwhile; ?>
</main>
<?php
get_footer();
