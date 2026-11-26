<?php
// Presentation-only: approved card data must be supplied by the caller.
$cards = [];
foreach (is_array($args['items'] ?? null) ? $args['items'] : [] as $row) {
  if (!is_array($row) || !is_string($row['title'] ?? null) || trim($row['title']) === '') {
    continue;
  }
  $cards[] = [
    'title' => trim($row['title']),
    'image' => is_string($row['image_html'] ?? null) ? wp_kses_post($row['image_html']) : '',
  ];
}
if (!$cards) {
  return;
}
?>
<ul class="jwsnj_topAbout_cards<?php echo count($cards) === 4 ? ' is-four' : ''; ?>" role="list" data-about-cards>
  <?php foreach ($cards as $card) : ?>
    <li class="jwsnj_topAbout_card" data-about-card>
      <button type="button" class="jwsnj_topAbout_cardButton" data-about-select aria-pressed="false" disabled>
        <?php if ($card['image'] !== '') : ?>
          <span class="jwsnj_topAbout_cardPhoto"><?php echo $card['image']; ?></span>
        <?php endif; ?>
        <span class="jwsnj_topAbout_cardLabel">
          <span><?php echo esc_html($card['title']); ?></span>
          <span class="jwsnj_topAbout_cardArrow" aria-hidden="true"></span>
        </span>
      </button>
    </li>
  <?php endforeach; ?>
</ul>
