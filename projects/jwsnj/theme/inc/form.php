<?php

/**
 * --------------------------------------------------------------------------------
 * 
 * フォームの設定
 * 
 * --------------------------------------------------------------------------------
 */

// ==========================================================================
// Contact Form 7のサイト全体での読み込みを禁止
// ==========================================================================
// function wpcf7_file_control() {
//     add_filter( "wpcf7_load_js", "__return_false" );
//     add_filter( "wpcf7_load_css", "__return_false" );
  
//     if ( is_page_template( 'page-form.php' ) ) {
//       if ( function_exists( "wpcf7_enqueue_scripts" ) ) {
//         wpcf7_enqueue_scripts();
//       }
//       if ( function_exists( "wpcf7_enqueue_styles" ) ) {
//         wpcf7_enqueue_styles();
//       }
//     }
//   }
  
//   add_action( "template_redirect", "wpcf7_file_control" );
  
// ==========================================================================
// CF7送信後サンクスページへ遷移
// ==========================================================================
// function add_thanks_wcf7()
// {
//   $current_slug = basename(get_permalink());
//   $thanks_url1 = esc_url(home_url('/thanks'));
//   $thanks_url2 = esc_url(home_url('/requestthanks'));

//   echo <<< EOD
// <script>
// document.addEventListener( 'wpcf7mailsent', function( event ) {
//     const currentSlug = '{$current_slug}';

//     const thanksPage = {
//       'contact': '{$thanks_url1}',
//       'request': '{$thanks_url2}'
//     };

//     if (thanksPage[currentSlug]) {
//         location = thanksPage[currentSlug];
//     }
// }, false );
// </script>
// EOD;
// }
// add_action('wp_footer', 'add_thanks_wcf7');
// Inspect the rendered form once, not the shortcode source or a second content pass.
function jwsnj_enqueue_postal_for_rendered_form($content)
{
  $tags = new WP_HTML_Tag_Processor($content);
  if ($tags->next_tag(['class_name' => 'p-postal-code'])) {
    wp_enqueue_script('yubinbango-script');
  }
  return $content;
}

function jwsnj_form_content()
{
  add_filter('the_content', 'jwsnj_enqueue_postal_for_rendered_form', PHP_INT_MAX);
  try {
    the_content();
  } finally {
    remove_filter('the_content', 'jwsnj_enqueue_postal_for_rendered_form', PHP_INT_MAX);
  }
}
