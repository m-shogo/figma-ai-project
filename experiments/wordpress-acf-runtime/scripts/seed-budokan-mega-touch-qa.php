<?php
/** Disposable PC-touch mega-menu QA fixture. */
if (!defined('WP_CLI') || !WP_CLI) { fwrite(STDERR, "Run with wp eval-file.\n"); exit(2); }
if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') { WP_CLI::error('Refusing to seed Mega touch QA outside local.'); }
if (wp_get_theme()->get_stylesheet() !== 'nipponbudokan') { WP_CLI::error('Mega touch QA requires nipponbudokan theme.'); }

$page = get_page_by_path('qa-budokan-mega-touch');
$payload = array('post_type'=>'page','post_status'=>'publish','post_title'=>'Mega Touch QA','post_name'=>'qa-budokan-mega-touch','post_content'=>'<!-- wp:paragraph --><p>Mega touch runtime QA fixture.</p><!-- /wp:paragraph --><!-- wp:spacer {"height":"1800px"} --><div style="height:1800px" aria-hidden="true" class="wp-block-spacer"></div><!-- /wp:spacer -->');
if ($page) { $payload['ID']=(int)$page->ID; $page_id=wp_update_post($payload,true); } else { $page_id=wp_insert_post($payload,true); }
if (is_wp_error($page_id)) { WP_CLI::error($page_id->get_error_message()); }
update_post_meta((int)$page_id,'_wp_page_template','templates/template-oneColumn.php');

$menu = wp_get_nav_menu_object('mega-nav-touch-qa');
if ($menu) { $menu_id=(int)$menu->term_id; foreach (wp_get_nav_menu_items($menu_id,array('post_status'=>'any')) ?: array() as $item) wp_delete_post((int)$item->ID,true); }
else { $created=wp_create_nav_menu('mega-nav-touch-qa'); if (is_wp_error($created)) WP_CLI::error($created->get_error_message()); $menu_id=(int)$created; }

foreach (array('Mega Alpha QA'=>'Alpha Child QA','Mega Beta QA'=>'Beta Child QA') as $parent_title=>$child_title) {
  $parent_id=wp_update_nav_menu_item($menu_id,0,array('menu-item-title'=>$parent_title,'menu-item-url'=>home_url('/'.sanitize_title($parent_title).'/'),'menu-item-type'=>'custom','menu-item-status'=>'publish'));
  if (is_wp_error($parent_id)) WP_CLI::error($parent_id->get_error_message());
  $child_id=wp_update_nav_menu_item($menu_id,0,array('menu-item-title'=>$child_title,'menu-item-url'=>home_url('/'.sanitize_title($child_title).'/'),'menu-item-type'=>'custom','menu-item-parent-id'=>(int)$parent_id,'menu-item-status'=>'publish'));
  if (is_wp_error($child_id)) WP_CLI::error($child_id->get_error_message());
}
$locations=get_theme_mod('nav_menu_locations',array());
$locations['mega-nav']=$menu_id;
set_theme_mod('nav_menu_locations',$locations);
update_option('budokan_mega_touch_qa_page_id',(int)$page_id,false);
flush_rewrite_rules(false);
WP_CLI::success(sprintf('Seeded Mega touch QA page #%d and mega menu #%d.',(int)$page_id,$menu_id));
