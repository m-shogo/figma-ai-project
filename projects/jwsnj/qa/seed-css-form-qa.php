<?php
// Disposable local fixture only; never run on a live WordPress site.
if (wp_get_environment_type() !== 'local' || !str_contains(home_url(), '127.0.0.1:')) { throw new RuntimeException('local fixture only'); }
wp_set_current_user((int) get_users(['role'=>'administrator','fields'=>'ID','number'=>1])[0]);
if (!class_exists('FrmForm') || !class_exists('FrmFieldsHelper') || !is_callable(['FrmAppController','install'])) throw new RuntimeException('Formidable unavailable');
// Activation defers installation to an admin request; the disposable CLI fixture must initialize it explicitly.
FrmAppController::install();
global $wpdb;
$table = $wpdb->prefix . 'frm_forms';
if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) !== $table) throw new RuntimeException('Formidable installer did not create tables');
$id = FrmForm::create(['form_key'=>'css-qa-fixture','name'=>'CSS QA form','description'=>'','status'=>'published']);
if (!$id) throw new RuntimeException('form create failed');
foreach (['text','textarea','checkbox','radio','select'] as $i=>$type) {
    $field = FrmFieldsHelper::setup_new_vars($type, $id);
    $field['name'] = 'CSS QA '.$type;
    $field['field_key'] = 'cssqa-'.$type;
    $field['form_id'] = $id;
    $field['field_order'] = $i+1;
    if (in_array($type,['checkbox','radio','select'],true)) $field['options']=['短い選択肢','非常に長い選択肢を自然に折り返して表示するための検証テキスト'];
    $field['required']=0;
    unset($field['field_options']['draft']);
    if (!FrmField::create($field)) throw new RuntimeException('field create failed '.$type);
}
$page=wp_insert_post(['post_type'=>'page','post_status'=>'publish','post_title'=>'CSS QA fixture','post_content'=>'[jwsnj_qa_render_count][formidable id='.$id.']','page_template'=>'templates/template-form.php'],true);
if(is_wp_error($page)) throw new RuntimeException($page->get_error_message());
update_post_meta($page,'_wp_page_template','templates/template-form.php');
update_option('jwsnj_css_qa_page_id',$page);
echo "FORMIDABLE_FIXTURE_ID=$id PAGE=$page\n";

$postal_page = wp_insert_post(['post_type'=>'page','post_status'=>'publish','post_title'=>'CSS QA postal child','post_name'=>'css-qa-postal-child','post_parent'=>$page,'post_content'=>'[jwsnj_qa_render_count][jwsnj_qa_postal][formidable id='.$id.']','page_template'=>'templates/template-form.php'],true);
if(is_wp_error($postal_page)) throw new RuntimeException($postal_page->get_error_message());
update_post_meta($postal_page,'_wp_page_template','templates/template-form.php');
update_option('jwsnj_css_qa_postal_page_id',$postal_page);
