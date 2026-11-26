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
  assert.match(css,/\.gc_sub\s*\{\s*display:\s*none/);
  assert.match(css,/1024 \*/);
  assert.match(css,/object-position: center bottom/);
  assert.doesNotMatch(css,/white-space:\s*nowrap|(?<!min-)height:\s*calc/);
  assert.match(read('css/style.css'),/fixed_page\.css/);
});


test('opt-in course template uses CMS title and body, one top breadcrumb, no sidebar and password gate',()=>{
  const p=read('templates/template-course.php');
  execFileSync('php',['-l',new URL('../theme/templates/template-course.php',import.meta.url).pathname]);
  assert.match(p,/Template Post Type: page/);
  assert.doesNotMatch(p,/get_sidebar|get_field|update_post_meta|wp_insert_post|figma\.com/);
  for(const locked of [false,true]){
    const stub='define("ABSPATH","/"); function get_header(){echo "<!--header-->";} function get_footer(){echo "<!--footer-->";} function get_template_part($p,$n,$a){echo "<!--".$p." ".json_encode($a)."-->";} function get_the_title(){return "Course & title";} function esc_html($s){return htmlspecialchars($s,ENT_QUOTES);} function post_password_required(){return '+locked+';} function get_the_password_form(){return "<form>password</form>";} function the_content(){echo "<p>editor body</p>";} ?>';
    const html=execFileSync('php',['-r',stub+p],{encoding:'utf8'});
    assert.match(html,/<h1 class="jwsnj_coursePage_title">Course &amp; title<\/h1>/);
    assert.equal((html.match(/_breadCrumb/g)||[]).length,1);
    assert.match(html,/"jwsnj_page":true/);
    assert.ok(html.indexOf('_breadCrumb')<html.indexOf('<h1'));
    assert.equal(html.includes('editor body'),!locked);
    assert.equal(html.includes('<form>password</form>'),locked);
    assert.equal((html.match(/<!--header-->/g)||[]).length,1);
    assert.equal((html.match(/<!--footer-->/g)||[]).length,1);
  }
});
test('course shell scopes full-width first intro, bounded content, and reuses breadcrumb rules',()=>{
  const css=read('css/project/course_page.css');
  assert.match(read('css/style.css'),/project\/course_page\.css/);
  assert.match(read('css/project/news_archive.css'),/section\.jwsnj_coursePage\s*\{/);
  assert.match(css,/body:has\(\.jwsnj_courseMain\)\s*\{\s*min-width:\s*0/);
  assert.match(css,/minmax\(0, calc\(1040 \* var\(--to-rem-func\)\)\)/);
  assert.match(css,/\.is-style-jwsnj-course-intro-layout:first-child\s*\{\s*grid-column: full/);
  assert.match(css,/padding-block: calc\(64 \* var\(--to-rem-func\)\) calc\(80 \* var\(--to-rem-func\)\)/);
  assert.match(css,/overflow-wrap: anywhere/);
  assert.match(css,/clip-path: inset\(50%\)/);
  assert.doesNotMatch(css,/white-space:\s*nowrap|height:\s*calc|100vw|figma\.com/);
});


test('course title fallback is suppressed only by a non-empty heading inside the first intro group',()=>{
  const css=read('css/project/course_page.css');
  const rule=css.match(/&:has\([^{}\n]+\)\s*>\s*\.jwsnj_coursePage_title\s*\{[^{}]+\}/g);
  assert.equal(rule?.length,1);
  assert.match(rule[0],/\.jwsnj_coursePage_content > \.wp-block-group\.is-style-jwsnj-course-intro-layout:first-child \.wp-block-group\.is-style-jwsnj-course-intro-heading h2\.wp-block-heading:not\(:empty\)/);
  assert.match(rule[0],/clip-path:\s*inset\(50%\)/);
  assert.doesNotMatch(css,/intro-layout:first-child\)\s*>\s*\.jwsnj_coursePage_title/);
  const template=read('templates/template-course.php');
  assert.equal((template.match(/<h1 class="jwsnj_coursePage_title">/g)||[]).length,1);
  assert.match(template,/<h1 class="jwsnj_coursePage_title"><\?php echo esc_html\(get_the_title\(\)\); \?><\/h1>/);
});
