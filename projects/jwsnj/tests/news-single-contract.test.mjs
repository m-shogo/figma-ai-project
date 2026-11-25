import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(new URL('../theme/'+p,import.meta.url),'utf8');
test('normal single reuses hero and blocks; legacy routing remains before new branch',()=>{
  const single=read('single.php'), part=read('template-parts/_news-single.php');
  assert.ok(single.indexOf("get_field('post_type') === 'file'")<single.indexOf("get_template_part('template-parts/_news-single')"));
  assert.match(part,/_news-archive-visual/);
  assert.match(part,/post_password_required\(\)/);
  assert.match(part,/the_content\(\)/);
  assert.doesNotMatch(part,/get_post_thumbnail_id|_label-category|figma\.com\/api\/mcp\/asset/);
  assert.match(read('template-parts/_news-archive-visual.php'),/news_single[\s\S]*sectionTitle/);
  for(const p of ['single.php','template-parts/_news-single.php','template-parts/_news-single-pager.php','template-parts/_news-archive-visual.php','template-parts/_breadCrumb.php']) execFileSync('php',['-l',new URL('../theme/'+p,import.meta.url).pathname]);
});
test('detail pager emits only valid existing destinations and decorative icons are hidden',()=>{
  const part=read('template-parts/_news-single-pager.php');
  for(const [prev,next,back] of [[0,0,''],[1,0,'/news/'],[0,2,''],[1,2,'/news/']]){
    const stub='function get_adjacent_article_post($dir){$id=$dir==="previous"?'+prev+':'+next+';return $id?(object)["ID"=>$id]:null;} function get_permalink($id){return "/post/".$id;} function esc_url($s){return $s;} $args=["posts_url"=>'+JSON.stringify(back)+']; ?>';
    const html=execFileSync('php',['-r',stub+part],{encoding:'utf8'});
    assert.equal(html.includes('class="prev"'),Boolean(prev));
    assert.equal(html.includes('class="next"'),Boolean(next));
    assert.equal(html.includes('class="back"'),Boolean(back));
    if(!prev&&!next&&!back)assert.equal(html,'');
    else assert.match(html,/aria-hidden="true"/);
  }
  const css=read('css/project/news_single.css');
  assert.match(css,/min-height: calc\(50 \* var\(--to-rem-func\)\)/);
  assert.match(css,/overflow-wrap: anywhere/);
  assert.match(css,/:focus-visible/);
  assert.doesNotMatch(css,/white-space:\s*nowrap|(?<!min-)height:\s*calc\(50/);
});
