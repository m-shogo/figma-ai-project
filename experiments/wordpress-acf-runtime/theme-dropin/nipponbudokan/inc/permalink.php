<?php

/**
 * --------------------------------------------------------------------------------
 * 
 * パーマリンクの設定
 * 
 * --------------------------------------------------------------------------------
 */

// ==========================================================================
// リライトルールが作成された時に、数字4桁のURLが年のアーカイブページ扱いになることを無効化する
// ==========================================================================
function mycus_year_rewrite_rules_invalid($rules)
{
  $custom_post_types = get_post_types(['_builtin' => false]);
  $post_types = array_merge(['post'], $custom_post_types);

  foreach ($post_types as $post_type) {
    if (isset($rules[$post_type . '/([0-9]{4})/?$'])) {
      unset($rules[$post_type . '/([0-9]{4})/?$']);
    }
  }
  return $rules;
}
// add_filter('rewrite_rules_array', 'mycus_year_rewrite_rules_invalid');

// ==========================================================================
// URLスラッグの自動生成
// ==========================================================================
function auto_post_slug($slug, $post_ID, $post_status, $post_type)
{
  if (preg_match('/(%[0-9a-f]{2})+/', $slug)) {
    $slug = $post_ID;
  }
  return $slug;
}
// add_filter('wp_unique_post_slug', 'auto_post_slug', 10, 4);

// ==========================================================================
// 条件付きでスラッグを自動生成
// ==========================================================================
function auto_generate_slug_for_new_posts($slug, $post_ID, $post_status, $post_type)
{
  // 固定ページの場合は自動生成をスキップ
  if ($post_type === 'page') {
    return $slug;
  }

  $post = get_post($post_ID);

  // 既にスラッグが設定されている（インポート時など）は何もしない
  if (!empty($post->post_name)) {
    return $slug;
  }

  // スラッグがURLエンコードされている or 空 なら自動で設定
  if (empty($slug) || preg_match('/(%[0-9a-f]{2})+/', $slug)) {
    // 投稿タイプがpostの場合は'topics'を使用
    $prefix = ($post_type === 'post') ? 'topics' : $post_type;
    $slug = $prefix . $post_ID;
  }

  return $slug;
}
// add_filter('wp_unique_post_slug', 'auto_generate_slug_for_new_posts', 10, 4);
