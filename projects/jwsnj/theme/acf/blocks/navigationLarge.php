<?php if (have_rows('navigation-large')) : ?>
  <ul class="module_navigation --large">
    <?php while (have_rows('navigation-large')) : the_row(); ?>
      <?php
      $image = get_sub_field('image');
      $title = (string) get_sub_field('title');
      $text = (string) get_sub_field('text');
      $url = (string) get_sub_field('url');
      $target = get_sub_field('target');
      $image_alt = $image ? trim((string) get_post_meta($image, '_wp_attachment_image_alt', true)) : '';
      $image_html = $image ? wp_get_attachment_image($image, 'full', false, ['alt' => $image_alt]) : '';
      if (!$image_html && trim($title) === '' && trim($text) === '') {
        continue;
      }
      ?>
      <li class="navigation">
        <?php get_template_part('template-parts/_navigation-large-card', null, [
          'heading' => 'h2',
          'item' => [
            'title' => $title,
            'text' => $text,
            'image_html' => $image_html,
            'image_alt' => $image_alt,
            'url' => $url,
            'new_tab' => (bool) $target,
          ],
        ]); ?>
      </li>
    <?php endwhile; ?>
  </ul>
<?php endif; ?>
