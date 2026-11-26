<?php
// Preserve the existing ACF repeater, but render only named, usable fragments.
$items = array();
if (have_rows('inPageLink_items')) {
  while (have_rows('inPageLink_items')) {
    the_row();
    $title = trim((string) get_sub_field('inPageLink_title'));
    $id = trim((string) get_sub_field('inPageLink_id'));
    // ACF already shows a # prefix; tolerate a pasted leading # as well.
    if (substr($id, 0, 1) === '#') {
      $id = substr($id, 1);
    }
    if ($title === '' || $id === '' || preg_match('/[\\s#]/u', $id)) {
      continue;
    }
    $items[] = array('title' => $title, 'id' => $id);
  }
}
$count = count($items);
$column_num = $count > 1 ? (string) min($count, 4) : '';
?>
<?php if ($count > 0) : ?>
  <ul class="module_inPageLink-01" data-column="<?php echo esc_attr($column_num); ?>">
    <?php foreach ($items as $item) : ?>
      <li class="inPageLink">
        <a href="#<?php echo esc_attr(rawurlencode($item['id'])); ?>">
          <div class="title"><?php echo nl2br(esc_html($item['title'])); ?></div>
        </a>
      </li>
    <?php endforeach; ?>
  </ul>
<?php endif; ?>
