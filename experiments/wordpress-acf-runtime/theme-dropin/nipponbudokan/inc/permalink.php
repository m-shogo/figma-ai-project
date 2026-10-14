<?php

/**
 * --------------------------------------------------------------------------------
 * 
 * パーマリンクの設定
 * 
 * --------------------------------------------------------------------------------
 */

// ==========================================================================
// 404 の URL 自動補完リダイレクトを止める
// 存在しない URL の末尾スラッグが別ページと一致しても、近いページへ飛ばさない。
// 末尾スラッシュなどの正規化（redirect_canonical）は残す。
// ==========================================================================
add_filter('do_redirect_guess_404_permalink', '__return_false');

// 2026-10-28 09:00 JST まで。ブラウザが保持している 301 は、問題の URL だけではサーバーに届かない。
// 同じサイトのどれか1ページを開いた応答で HTTP キャッシュだけ捨てさせる。Cookie は消さない。
add_action('send_headers', 'nipponbudokan_clear_cached_redirects');

function nipponbudokan_clear_cached_redirects()
{
  if (is_admin() || wp_doing_ajax() || wp_doing_cron()) {
    return;
  }
  $until = strtotime('2026-10-28T00:00:00+09:00');
  if ($until === false || time() >= $until) {
    return;
  }
  header('Clear-Site-Data: "cache"');
}

// これから出す 301 をブラウザと中間キャッシュに保存させない。
add_filter('wp_redirect', 'nipponbudokan_redirect_do_not_store', 10, 2);

function nipponbudokan_redirect_do_not_store($location, $status)
{
  if ((int) $status === 301) {
    header('Cache-Control: no-store');
  }
  return $location;
}

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
