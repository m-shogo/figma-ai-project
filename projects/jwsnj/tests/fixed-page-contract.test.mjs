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
    const stub='function get_the_ID(){return 5;} function get_field($a,$b){return '+id+';} function wp_get_attachment_image($id,$size,$icon,$attrs){return "<img src=\\\"/media/page.webp\\\">";} function get_the_title(){return "A & B";} function esc_html($s){return htmlspecialchars($s,ENT_QUOTES);} function esc_url($s){return htmlspecialchars($s,ENT_QUOTES);} function get_theme_file_uri($s){return "/theme/".$s;} ?>';
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

test('search and basic form CSS use natural text heights and native selectors',()=>{
  const search=read('css/module/module_search-01.css');
  assert.equal((search.match(/min-height: var\(--_search-height-SP\)/g)||[]).length,2);
  assert.match(search,/minmax\(0, 1fr\) minmax\(0, var\(--_button-width-SP\)\)/);
  assert.match(search,/&:is\(body\.search \.gc_main \*, body\.error404 \.gc_main \*\)/);
  assert.doesNotMatch(search,/^@media|html\._browser-ie\s*&|(?<!min-)height: var\(--_search-height-SP\)|transition: var\(--transition-duration\)/m);
  assert.equal((search.match(/&:focus-visible/g)||[]).length,2);
  const form=read('css/wordpress/form.css').replace(/\/\*[\s\S]*?\*\//g,'');
  const base=form.slice(0,form.indexOf('.size-SS'));
  assert.match(base,/min-height: calc\(50 \* var\(--to-rem-func\)\)/);
  assert.match(base,/min-height: 10em;\s*field-sizing: content/);
  assert.doesNotMatch(base,/(?<!min-)height: (?:calc\(50|10em)/);
  assert.match(base,/&:focus-visible/);
  assert.match(form,/\.label-need,\s*\.label-any\s*\{/);
  assert.doesNotMatch(form,/&-need|&-any|white-space:\s*nowrap/);
  assert.match(form,/&:focus-within/);
});

test('CSS duplicate properties are removed and About owners preserve original scope',()=>{
 const dropdown=read('css/module/module_dropdown.css'),menu=read('css/module/module_menu.css');
 for(const css of [dropdown,menu]) assert.doesNotMatch(css,/position: absolute;\s*position: absolute;/);
 const about=read('css/project/top_about.css');
 assert.match(about,/^\.global_contents > \.jwsnj_topAbout \.jwsnj_topAbout_inner\s*\{/m);
 assert.match(about,/^\.global_contents > \.jwsnj_topAbout \.jwsnj_topAbout_map\s*\{/m);
 assert.match(about,/&:has\(~ \.jwsnj_topAbout_cards\)/);
 const vars=read('css/global/variables.css');
 for(const name of ["--jwsnj-color-accent","--jwsnj-color-main","--jwsnj-color-text","--jwsnj-color-text-gray-700","--color-base--bg-blue-soft","--color-error-border","--color-gray-border-03","--color-separator--soft","--font-serif-en","--font-serif-ja","--icon-chevron-down","--width-main"]) assert.ok(!new RegExp('^\\s*'+name+':','m').test(vars),name);
});

test('legacy list and pagination responsive states are owner-local, admin focus remains visible',()=>{
 const list=read('css/module/module_newsList-01.css'),card=read('css/module/module_newsCard-01.css');
 assert.match(list,/\.link,\s*\.no-link\s*\{[^{}]*@media \(calc\(768/);
 assert.match(card,/\.body\s*\{[^{}]*@media \(calc\(768/);
 assert.match(read('css/module/module_pager-01.css'),/&:hover:not\(\.current\)/);
 const pager=read('css/module/module_pager-02.css');
 assert.match(pager,/&\.back\s*\{\s*order: 3;\s*@media \(calc\(768[^{}]+\{\s*order: 2;/);
 const admin=read('css/admin-style.css');
 assert.doesNotMatch(admin,/outline:\s*none/);
 assert.match(admin,/&:focus-visible\s*\{\s*opacity: 1;\s*outline: 2px solid currentColor/);
});

test('Formidable choice controls preserve native checked state and real labels',()=>{
 const css=read('css/wordpress/form.css');
 const scope=css.slice(css.indexOf('.frm_forms {'),css.indexOf('/* //ラベル */',css.indexOf('.frm_forms {')));
 assert.match(scope,/appearance: auto !important/);
 assert.match(scope,/accent-color: var\(--color-primary\)/);
 assert.match(scope,/&:has\(input:checked\)/);
 assert.match(scope,/min-height: calc\(50 \* var\(--to-rem-func\)\)/);
 assert.doesNotMatch(scope,/text-indent: -1000px|font-size: 0;|height: 0;|content: attr\(value\)/);
 assert.match(css,/input\[type='file'\]:not\(\.frm_transparent\)/);
});

test('inherited menu modules have no empty sample selector or empty desktop bucket',()=>{
  for(const path of ['css/module/module_menu.css','css/module/module_dropdown.css']){
    const css=read(path);
    assert.doesNotMatch(css,/^[ \t]+(?:\.[\w-]+,\n[ \t]+)*\.[\w-]+ \{\s*\}/m);
    assert.doesNotMatch(css,/@media \(calc\(768/);
    assert.match(css,/\[data-open='true'\]/);
    assert.match(css,/\[data-open='false'\]/);
  }
});

test('head app title uses actual escaped WordPress site name, not sample text',()=>{
  const head=read('template-parts/_head_contents.php');
  assert.match(head,/\$site_name = get_bloginfo\('name'\)/);
  assert.match(head,/<meta name="apple-mobile-web-app-title" content="<\?php echo esc_attr\(\$site_name\); \?>"/);
  assert.doesNotMatch(head,/サンプルサイト/);
});

test('legacy numeric pager reuses the defined English font token',()=>{
  const pager=read('css/module/module_pager-01.css');
  const tokens=read('css/global/variables.css');
  assert.match(pager,/font-family:\s*var\(--font-sansSerif-en\)/);
  assert.match(tokens,/--font-sansSerif-en\s*:/);
  assert.doesNotMatch(pager,/var\(--enText\)/);
});


test('legacy news titles and pager links localize motion reduction without animating layout', () => {
  for (const file of ['module_newsCard-01.css', 'module_newsList-01.css']) {
    const css = read('css/module/' + file);
    assert.doesNotMatch(css, /transition:\s*var\(--transition-duration\)/);
    assert.match(css, /transition: color var\(--transition-duration\);\s*@media \(prefers-reduced-motion: reduce\)\s*\{\s*transition: none/);
  }
  for (const file of ['module_pager-01.css', 'module_pager-02.css']) {
    const css = read('css/module/' + file);
    assert.match(css, /transition: (?:color|background-color) var\(--transition-duration\), (?:color|background-color) var\(--transition-duration\);\s*@media \(prefers-reduced-motion: reduce\)\s*\{\s*transition: none/);
  }
});

test('adjacent heading spacing has no identical desktop redeclaration', () => {
  const css = read('css/blocks/wp-block-heading-style.css');
  assert.doesNotMatch(css, /margin-top: var\(--wp-block-margin-small\);\s*@media \([^{}]+\)\s*\{\s*margin-top: var\(--wp-block-margin-small\);/);
  assert.equal((css.match(/margin-top: var\(--wp-block-margin-small\);/g) || []).length, 6);
});


test('legacy CF7 decorative choices do not hide ordinary native controls', () => {
  const form = read('css/wordpress/form.css');
  assert.match(form, /^input:is\(\[type='checkbox'\], \[type='radio'\]\)\s*\{\s*appearance: auto;\s*accent-color: var\(--color-primary\)/m);
  assert.match(form, /^:where\(\.wpcf7\) input\s*\{/m);
  assert.doesNotMatch(form, /^input\s*\{\s*\/\* \/\/ 共通 \*\//m);
  assert.match(form, /transition: border-color var\(--transition-duration\), background-color var\(--transition-duration\);\s*@media \(prefers-reduced-motion: reduce\)\s*\{\s*transition: none/);
});

test('legacy CF7 file labels and wrappers do not style unrelated files', () => {
  const css = read('css/wordpress/form.css');
  assert.match(css, /^:where\(\.wpcf7\) \.file label \{/m);
  assert.match(css, /^:where\(\.wpcf7\) \.file \{/m);
  assert.doesNotMatch(css, /^\.file(?: label)? \{/m);
});

test('CSS entrypoints retain one import owner and version every child without changing order', () => {
  const helper = new URL('../theme/inc/css-assets.php', import.meta.url).pathname;
  const theme = new URL('../theme/', import.meta.url).pathname;
  const code = 'require $argv[1]; foreach (["css/style.css","css/editor-style.css"] as $entry) { echo json_encode(jwsnj_css_import_files($argv[2].$entry)).PHP_EOL; }';
  const rows = execFileSync('php', ['-r', code, helper, theme], {encoding:'utf8'}).trim().split('\n').map(JSON.parse);
  for (const [i, entry] of ['css/style.css','css/editor-style.css'].entries()) {
    const css = read(entry).replace(/\/\*[\s\S]*?\*\//g, '');
    const expected = [...css.matchAll(/@import\s+['"]\.\/([^'"]+)['"];/g)].map(m => m[1]);
    assert.ok(expected.length > 0);
    assert.deepEqual(rows[i].map(r => r[0]), expected);
    for (const [relative, version] of rows[i]) {
      assert.match(version, /^\d+$/);
      assert.doesNotMatch(read('css/'+relative).replace(/\/\*[\s\S]*?\*\//g,''), /@import\s/);
    }
  }
  assert.equal(rows[1].at(-1)[0], 'editor-content.css');
  const front = read('inc/front.php');
  assert.match(front, /jwsnj_enqueue_css_entry\('common-style', '\/css\/style.css'/);
  assert.match(front, /jwsnj_enqueue_css_entry\('editor-style', '\/css\/editor-style.css'/);
});

test('form rendering does not execute the content filter at enqueue time', () => {
  const front = read('inc/front.php');
  const form = read('inc/form.php');
  const template = read('templates/template-form.php');
  assert.doesNotMatch(front, /apply_filters\('the_content', get_the_content\(\)\)/);
  assert.match(front, /wp_register_script\('yubinbango-script'/);
  assert.match(template, /jwsnj_form_content\(\)/);
  assert.match(form, /new WP_HTML_Tag_Processor\(\$content\)/);
  assert.match(form, /finally\s*\{\s*remove_filter/);
  for (const p of ['inc/front.php','inc/form.php','templates/template-form.php']) {
    execFileSync('php',['-l',new URL('../theme/'+p,import.meta.url).pathname]);
  }
});

test('legacy visual handles a deleted attachment without warnings or an empty image URL', () => {
  const path = new URL('../theme/template-parts/_visual.php', import.meta.url).pathname;
  const stub = 'error_reporting(E_ALL); set_error_handler(function($level,$message){throw new ErrorException($message,0,$level);}); function get_current_post_type(){return false;} function is_page(){return true;} function is_404(){return false;} function is_search(){return false;} function is_post_type_archive(){return false;} function is_tax(){return false;} function get_field($key,$id){return (int)$GLOBALS["argv"][2];} function get_the_ID(){return 1;} function get_template_directory_uri(){return "/theme";} function wp_get_attachment_image_src($id,$size){return $id===7?["/media/real.webp",100,50,true]:false;} function esc_url($s){return htmlspecialchars($s,ENT_QUOTES);} function the_title(){echo "Actual page title";} function get_template_part(...$args){} require $argv[1];';
  for (const [id, expected] of [[0,'/theme/images/common/noimage_visual-01.webp'],[7,'/media/real.webp'],[99,'']]) {
    const html = execFileSync('php',['-r',stub,path,String(id)],{encoding:'utf8'});
    assert.match(html, /<h1 class="gm_title"><span>Actual page title<\/span><\/h1>/);
    if (expected) assert.ok(html.includes('background-image: url('+expected+')'));
    else {
      assert.match(html, /<div class="gm_background"><\/div>/);
      assert.doesNotMatch(html, /background-image: url\(\)/);
    }
  }
});
