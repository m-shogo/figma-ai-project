<?php
$previous = get_adjacent_article_post('previous');
$next = get_adjacent_article_post('next');
$previous_url = $previous ? esc_url(get_permalink($previous->ID)) : '';
$next_url = $next ? esc_url(get_permalink($next->ID)) : '';
$back_url = $args['posts_url'] ?? '';
if (!$previous_url && !$next_url && !$back_url) return;
?>
<nav class="jwsnj_newsSingle_pager" aria-label="記事ナビゲーション">
  <?php if ($previous_url) : ?>
    <a class="prev" href="<?php echo $previous_url; ?>" rel="prev"><span class="jwsnj_newsSingle_arrow" aria-hidden="true"></span>前の記事</a>
  <?php endif; ?>
  <?php if ($next_url) : ?>
    <a class="next" href="<?php echo $next_url; ?>" rel="next">次の記事<span class="jwsnj_newsSingle_arrow" aria-hidden="true"></span></a>
  <?php endif; ?>
  <?php if ($back_url) : ?>
    <a class="back" href="<?php echo $back_url; ?>"><span class="jwsnj_newsSingle_return" aria-hidden="true"></span><span>一覧に戻る</span><span class="jwsnj_newsSingle_arrow" aria-hidden="true"></span></a>
  <?php endif; ?>
</nav>
