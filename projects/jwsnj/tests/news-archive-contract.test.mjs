import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read = p => readFileSync(new URL('../theme/'+p,import.meta.url),'utf8');
const archive = read('template-parts/_news-archive.php');
const css = read('css/project/news_archive.css');
test('home fallback and category share archive owner, other queries retain original path',()=>{
  for(const file of ['archive.php','index.php']){
    const s=read(file);
    assert.match(s,/is_home\(\) \|\| is_category\(\)/);
    assert.match(s,/get_template_part\('template-parts\/_news-archive'\)/);
    assert.match(s,/get_sidebar\('archive'\)/);
  }
  assert.ok(archive.indexOf('_breadCrumb')>archive.indexOf('_list-news'));
  assert.match(archive,/get_category_link\(\$category->term_id\)/);
  assert.match(archive,/get_option\('page_for_posts'\)/);
  assert.match(archive,/<details/);
  assert.match(archive,/aria-current="page"/);
  assert.match(read('template-parts/_list-news_article.php'),/newsArchive' \? 'm\.d\.Y' : 'Y\/m\/d'/);
});
test('Figma layout uses natural wrap and scoped responsive rows',()=>{
  assert.match(css,/width:\s*calc\(240 \* var\(--to-rem-func\)\)/);
  assert.match(css,/min-height:\s*calc\(50 \* var\(--to-rem-func\)\)/);
  assert.match(css,/grid-template-columns:\s*minmax\(0, calc\(170/);
  assert.match(css,/gap:\s*calc\(40 \* var\(--to-rem-func\)\)/);
  assert.match(css,/overflow-wrap:\s*anywhere/);
  assert.match(css,/:focus-visible/);
  assert.doesNotMatch(css,/white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
  assert.ok(readFileSync(new URL('../theme/images/common/ico_blossom.svg',import.meta.url)).length>0);
});
test('isolated PHP pager handles bounds, current page and valid generated links',()=>{
  const part=read('template-parts/_pagination-news.php');
  for(const [total,current] of [[0,1],[1,1],[3,1],[12,1],[12,6],[12,12]]){
    const stub = '$wp_query=(object)["max_num_pages"=>'+total+']; function get_query_var($n){return '+current+';} function get_pagenum_link($n){return "/news/page/".$n."/?cat=7";} function esc_url($s){return htmlspecialchars($s,ENT_QUOTES);} function esc_attr($s){return htmlspecialchars($s,ENT_QUOTES);} function esc_html($s){return htmlspecialchars($s,ENT_QUOTES);} ?>';
    const html=execFileSync('php',['-r',stub+part],{encoding:'utf8'});
    if(!total){assert.equal(html,'');continue;}
    assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
    assert.equal((html.match(/class="page-numbers/g)||[]).length,Math.min(5,total));
    assert.equal((html.match(/is-desktop-only/g)||[]).length,Math.max(0,Math.min(5,total)-3));
    assert.match(html,new RegExp('aria-current="page">'+current+'<'));
    assert.equal((html.match(/aria-disabled="true"/g)||[]).length,Number(current===1)+Number(current===total));
    if(current>1) assert.ok(html.includes('/news/page/'+(current-1)+'/?cat=7'));
    if(current<total) assert.ok(html.includes('/news/page/'+(current+1)+'/?cat=7'));
  }
});
test('archive templates parse in PHP CLI',()=>{
  for(const p of ['archive.php','index.php','template-parts/_news-archive.php','template-parts/_list-news.php','template-parts/_list-news_article.php','template-parts/_label-category.php','template-parts/_visual.php','template-parts/_news-archive-visual.php','template-parts/_pagination-news.php','template-parts/_breadCrumb.php']){
    execFileSync('php',['-l',new URL('../theme/'+p,import.meta.url).pathname]);
  }
});


test('archive hero preserves CMS image ownership and no sample fallback',()=>{
  const hero=read('template-parts/_news-archive-visual.php');
  assert.match(archive,/_news-archive-visual/);
  assert.match(hero,/get_field\('page_img-post', 'option'\)/);
  assert.match(hero,/wp_get_attachment_image\(\$image_id, 'full'/);
  assert.match(hero,/<h1>/);
  assert.doesNotMatch(hero,/noimage|figma\.com\/api\/mcp\/asset/);
  assert.match(css,/body\.blog,\s*body\.category\s*\{\s*min-width:\s*0/);
  assert.match(css,/aspect-ratio:\s*335 \/ 146/);
  assert.match(css,/grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 2fr\)/);
  assert.match(css,/min-height:\s*calc\(400 \* var\(--to-rem-func\)\)/);
  assert.match(css,/object-fit:\s*cover/);
  const render=(imageId,title)=>{
    const stub='function get_the_title($id){return '+JSON.stringify(title)+';} function get_field($n,$scope){return '+imageId+';} function esc_html($s){return htmlspecialchars($s,ENT_QUOTES);} function wp_get_attachment_image($id,$size,$icon,$attrs){return $id===9?"<img src=\\"/wp-media/approved.webp\\" class=\\"".$attrs["class"]."\\">":"";} $args=["posts_page_id"=>5]; ?>';
    return execFileSync('php',['-r',stub+hero],{encoding:'utf8'});
  };
  assert.match(render(9,'News <title>'),/has-image[\s\S]*News &lt;title&gt;[\s\S]*approved\.webp/);
  const empty=render(0,'');
  assert.match(empty,/<h1>お知らせ<\/h1>/);
  assert.doesNotMatch(empty,/has-image|<img|heroImage/);
  assert.doesNotMatch(render(99,'Title'),/has-image|<img|heroImage/);
});


test('archive breadcrumb uses existing renderer with scoped Home label and safe category path',()=>{
  const part=read('template-parts/_breadCrumb.php');
  const render=(category,postsId,title,news=true)=>{
    const stub='class WP_Term {public $term_id;public $name;function __construct($id,$name){$this->term_id=$id;$this->name=$name;}} function home_url($s){return "/";} function get_option($n){return '+postsId+';} function get_the_title($n){return '+JSON.stringify(title)+';} function get_permalink($n){return "/news/";} function is_category(){return '+(category?'true':'false')+';} function get_queried_object(){return new WP_Term(9,"Current & category");} function get_ancestors($id,$t,$r){return [3,2];} function get_term($id,$t){return new WP_Term($id,"Parent ".$id);} function get_category_link($id){return "/category/".$id."/";} function is_wp_error($x){return false;} function is_front_page(){return true;} function esc_url($s){return htmlspecialchars($s,ENT_QUOTES);} function esc_html($s){return htmlspecialchars($s,ENT_QUOTES);} $args=["news_archive"=>'+(news?'true':'false')+',"posts_page_id"=>'+postsId+',"posts_page_url"=>'+(postsId?'"/news/"':'""')+']; ?>';
    return execFileSync('php',['-r',stub+part],{encoding:'utf8'});
  };
  const home=render(false,5,'お知らせ');
  assert.match(home,/aria-label="パンくずリスト"/);
  assert.match(home,/jwsnj_breadCrumb_homeIcon/);
  assert.match(home,/>ホーム</);
  assert.match(home,/aria-current="page">お知らせ</);
  const cat=render(true,5,'News & updates');
  assert.match(cat,/href="\/news\/"[\s\S]*News &amp; updates/);
  assert.ok(cat.indexOf('Parent 2')<cat.indexOf('Parent 3'));
  assert.match(cat,/aria-current="page">Current &amp; category</);
  assert.doesNotMatch(render(true,0,''),/href="\/news\/"/);
  assert.match(render(false,0,''),/aria-current="page">お知らせ</);
  const old=render(false,5,'',false);
  assert.match(old,/>TOP</);
  assert.doesNotMatch(old,/jwsnj_breadCrumb_homeIcon|aria-label="パンくずリスト"/);
  assert.match(css,/padding-inline:\s*calc\(64 \* var\(--to-rem-func\)\)/);
  assert.match(css,/content:\s*'\\f80b'/);
  assert.match(css,/font:\s*300 calc\(10 \* var\(--to-rem-func\)\)\/1 var\(--font-awesome\)/);
  assert.ok(readFileSync(new URL('../theme/webfonts/fa-light-300.woff2',import.meta.url)).length>0);
});


test('archive row endings follow PC/SP Figma and non-links do not mimic hoverable links',()=>{
  const rows=css.slice(css.indexOf('    .module_newsList-01 {'),css.indexOf('    .jwsnj_newsArchive_pager {'));
  assert.match(rows,/border-bottom:\s*calc\(1 \* var\(--to-rem-func\)\) solid var\(--jwsnj-color-separator\)/);
  assert.doesNotMatch(rows,/last-child/);
  assert.match(css,/\.module_newsList-01 \.mnl-01_article\s*\{\s*\/\* PC ends[^*]*\*\/\s*&:last-child\s*\{\s*border-bottom:\s*0/);
  assert.match(css,/\.module_newsList-01 \.mnl-01_article \.no-link:hover \.body \.title\s*\{\s*color:\s*var\(--color-text\)/);
  const pager=css.slice(css.indexOf('    .jwsnj_newsArchive_pager {'),css.indexOf('    :is(a, summary):focus-visible'));
  assert.equal((pager.match(/letter-spacing:\s*0\.05em/g)||[]).length,2);
  assert.match(pager,/letter-spacing:\s*0;\s*text-box-trim:\s*none/);
});


test('archive filter, hero and breadcrumb share only a real published posts index',()=>{
  const render=(mode,id,status='publish',type='page',front=1,url='/news/')=>{
    const stub='class WP_Term {public $term_id=7; public $name="News";} function get_option($k){return ["show_on_front"=>'+JSON.stringify(mode)+',"page_for_posts"=>'+id+',"page_on_front"=>'+front+'][$k]??0;} function get_post_type($id){return '+JSON.stringify(type)+';} function get_post_status($id){return '+JSON.stringify(status)+';} function get_permalink($id){return '+JSON.stringify(url)+';} function home_url($p){return "/";} function is_category(){return true;} function get_queried_object(){return new WP_Term;} function get_categories($a){return [new WP_Term];} function get_category_link($id){return "/category/news/";} function is_wp_error($v){return false;} function esc_html($s){return htmlspecialchars($s,ENT_QUOTES);} function esc_url($s){return htmlspecialchars($s,ENT_QUOTES);} function get_template_part($p,$n=null,$a=[]){echo "<!--".$p." ".json_encode($a,JSON_UNESCAPED_SLASHES)."-->";} ?>';
    return execFileSync('php',['-r',stub+archive],{encoding:'utf8'});
  };
  const configured=render('page',5);
  assert.match(configured, /href="\/news\/">すべて/);
  assert.match(configured, /"posts_page_id":5/);
  assert.match(configured, /"posts_page_url":"\/news\/"/);
  const latest=render('posts',5);
  assert.match(latest, /href="\/">すべて/);
  assert.match(latest, /"posts_page_id":0/);
  for(const invalid of [render('page',0),render('page',5,'draft'),render('page',5,'trash'),render('page',5,'publish','post'),render('page',1),render('page',5,'publish','page',1,'')]){
    assert.doesNotMatch(invalid, />すべて</);
    assert.match(invalid, /"posts_page_id":0/);
    assert.match(invalid, /href="\/category\/news\/" aria-current="page"/);
  }
});


test('news row only renders a link when the escaped URL is usable',()=>{
  const part=read('template-parts/_list-news_article.php');
  const render=url=>{
    const stub='function get_post_link_attributes(){return ["url"=>'+JSON.stringify(url)+',"targetAttr"=>" target=\"_blank\" rel=\"noreferrer external\""];} function esc_url($s){return str_starts_with($s,"javascript:")?"":htmlspecialchars($s,ENT_QUOTES);} function the_time($f){echo "2026-11-25";} function get_template_part($p,$n,$a){} function the_title(){echo "Example";} $args=["props"=>"newsArchive"]; ?>';
    return execFileSync('php',['-r',stub+part],{encoding:'utf8'});
  };
  const valid=render('/news/article/?x=1&y=2');
  assert.match(valid,/<a\s+class="link"\s+href="\/news\/article\/\?x=1&amp;y=2"/);
  assert.match(valid,/target="_blank"/);
  for(const url of ['', 'javascript:alert(1)']){
    const invalid=render(url);
    assert.match(invalid,/<span\s+class="no-link"/);
    assert.doesNotMatch(invalid,/href=|target=|<a\s/);
  }
});
test('standard post category labels isolate missing parent classes and escape attributes',()=>{
  const part=read('template-parts/_label-category.php');
  const stub='class WP_Term {public $slug; public $category_parent; public $cat_name; function __construct($slug,$parent,$name){$this->slug=$slug;$this->category_parent=$parent;$this->cat_name=$name;}} function get_post_type(){return "post";} function get_the_category(){return [new WP_Term("first",1,"First & one"),new WP_Term("orphan",2,"Orphan"),new WP_Term("missing",3,"Missing"),new WP_Term("root",0,"Root")];} function get_term($id,$taxonomy){return $id===1?new WP_Term("parent\"quote",0,"P"):($id===2?null:new stdClass);} function is_wp_error($v){return false;} function esc_attr($s){return htmlspecialchars($s,ENT_QUOTES);} function esc_html($s){return htmlspecialchars($s,ENT_QUOTES);} $args=["taxonomy"=>"_cat"]; set_error_handler(function($severity,$message){throw new Exception($message);}); ?>';
  const html=execFileSync('php',['-r',stub+part],{encoding:'utf8'});
  assert.match(html,/class="label first _parent&quot;quote">First &amp; one</);
  for(const slug of ['orphan','missing','root']) assert.match(html,new RegExp('class="label '+slug+'">'));
});
