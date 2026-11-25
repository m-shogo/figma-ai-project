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
  for(const p of ['archive.php','index.php','template-parts/_news-archive.php','template-parts/_list-news.php','template-parts/_list-news_article.php','template-parts/_visual.php','template-parts/_news-archive-visual.php','template-parts/_pagination-news.php']){
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
