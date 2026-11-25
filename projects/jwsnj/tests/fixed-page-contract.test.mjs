import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read = p => readFileSync(new URL('../theme/'+p,import.meta.url),'utf8');
test('fixed page preserves CMS body, password gate and existing sidebar ownership',()=>{
  const p=read('page.php'),s=read('sidebar.php'),v=read('template-parts/_fixed-page-visual.php');
  assert.match(p,/post_password_required\(\)/);
  assert.ok(p.indexOf('post_password_required()') < p.indexOf('the_content()'));
  assert.match(p,/get_sidebar\(\)/);
  assert.match(p,/\$sidebar !== ''/);
  assert.ok(p.indexOf('_breadCrumb')>p.indexOf('the_content()'));
  assert.match(s,/'theme_location' => 'sidebar-nav'/);
  assert.match(s,/new Custom_Sidebar_Walker_Nav_Menu/);
  assert.match(s,/'fallback_cb' => false/);
  assert.match(v,/get_field\('page_img', get_the_ID\(\)\)/);
  assert.doesNotMatch(v,/noimage|figma\.com\/api\/mcp\/asset/);
  for(const file of ['page.php','sidebar.php','template-parts/_fixed-page-visual.php','template-parts/_breadCrumb.php']){
    execFileSync('php',['-l',new URL('../theme/'+file,import.meta.url).pathname]);
  }
});
test('fixed page visual renders only the actual title and attachment',()=>{
  const v=read('template-parts/_fixed-page-visual.php');
  for(const id of [0,7]){
    const stub='function get_the_ID(){return 5;} function get_field($a,$b){return '+id+';} function wp_get_attachment_image($id,$size,$icon,$attrs){return "<img src=\\\"/media/page.webp\\\">";} function get_the_title(){return "A & B";} function esc_html($s){return htmlspecialchars($s,ENT_QUOTES);} ?>';
    const html=execFileSync('php',['-r',stub+v],{encoding:'utf8'});
    assert.match(html,/<h1>A &amp; B<\/h1>/);
    assert.equal(html.includes('has-image'),!!id);
    assert.equal(html.includes('<img'),!!id);
  }
});
test('empty sidebar emits no landmark and actual menu is reused',()=>{
  const s=read('sidebar.php');
  for(const menu of ['', '<div><ul></ul></div>', '<ul><li>Actual menu</li></ul>']){
    const stub='class Custom_Sidebar_Walker_Nav_Menu {} function wp_nav_menu($args){return '+JSON.stringify(menu)+';} ?>';
    const html=execFileSync('php',['-r',stub+s],{encoding:'utf8'}).trim();
    assert.equal(html.includes('<nav'),menu.includes('<li>'));
  }
});
test('fixed page layout has bounded columns and no fixed text heights',()=>{
  const css=read('css/project/fixed_page.css');
  assert.match(css,/minmax\(0, 1fr\) minmax\(0, calc\(256/);
  assert.match(css,/\.gc_sub \{ display: none/);
  assert.match(css,/1024 \*/);
  assert.match(css,/object-position: center bottom/);
  assert.doesNotMatch(css,/white-space:\s*nowrap|(?<!min-)height:\s*calc/);
  assert.match(read('css/style.css'),/fixed_page\.css/);
});
