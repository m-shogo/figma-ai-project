import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(new URL('../theme/'+p,import.meta.url),'utf8');
const part=read('template-parts/_top-notice.php');
function render(enabled,rows){
  const encoded=Buffer.from(JSON.stringify(rows)).toString('base64');
  const stub='$rows=json_decode(base64_decode("'+encoded+'"),true); $i=-1; function get_field($n){return '+(enabled?'true':'false')+';} function have_rows($n){global $rows,$i;return $i+1<count($rows);} function the_row(){global $i;$i++;} function get_sub_field($n,$format=true){global $rows,$i;return $rows[$i][$n]??null;} function wp_kses_post($s){return strip_tags($s,"<a><br><p>");} function wp_strip_all_tags($s){return strip_tags($s);} function esc_attr($s){return htmlspecialchars($s,ENT_QUOTES);} function esc_html($s){return htmlspecialchars($s,ENT_QUOTES);} ?>';
  return execFileSync('php',['-r',stub+part],{encoding:'utf8'}).trim();
}
test('TOP notice preserves existing ACF display and skips empty/hidden rows',()=>{
  const row={date:'20260127',textarea:'Visible'};
  assert.equal(render(false,[row]),'');
  assert.equal(render(true,[]),'');
  assert.equal(render(true,[{...row,none:['_hide']},{textarea:'<br>'}]),'');
  const html=render(true,[row,{date:'20260231',textarea:'Invalid date'},{date:'',textarea:'No date'},{...row,none:['_hide'],textarea:'Secret'}]);
  assert.match(html,/datetime="2026-01-27">2026\.01\.27/);
  assert.equal((html.match(/<time /g)||[]).length,1);
  assert.match(html,/Invalid date/);
  assert.match(html,/No date/);
  assert.doesNotMatch(html,/Secret|2026-03/);
});
test('TOP notice preserves actual links and plain text without invented URLs',()=>{
  const html=render(true,[{textarea:'Plain'},{textarea:'<a href="/real/">Real link</a>'}]);
  assert.equal((html.match(/<a /g)||[]).length,1);
  assert.match(html,/href="\/real\/"/);
  assert.match(html,/aria-hidden="true"/);
  assert.match(read('front-page.php'),/_top-notice/);
  assert.match(read('css/style.css'),/top_notice\.css/);
  const css=read('css/project/top_notice.css');
  assert.match(css,/min-height: calc\(60/);
  assert.match(css,/focus-visible/);
  assert.doesNotMatch(css,/white-space:\s*nowrap|(?<!min-)height:\s*calc/);
  for(const file of ['front-page.php','template-parts/_top-notice.php']){
    execFileSync('php',['-l',new URL('../theme/'+file,import.meta.url).pathname]);
  }
});

test('TOP fixed catchphrase uses official PC glyphs and distinct SP art',()=>{
  const part=read('template-parts/_top-catchphrase.php');
  for (const file of ['img_catch-493.svg','img_catch-482.svg','img_catch-483.svg','img_catch-480.svg','img_catch-481.svg','img_catchphrase-sp.svg']) {
    assert.ok(part.includes('images/top/'+file));
    const svg=read('images/top/'+file);
    assert.match(svg, /<svg/);
    assert.ok(svg.length>100);
  }
  assert.match(part,/aria-label="ワクワク"/);
  assert.match(part,/alt="ワクワク"/);
  assert.match(part,/最高の土曜日を/);
  assert.match(read('front-page.php'), /_top-catchphrase/);
  assert.match(read('css/style.css'), /^@import '\.\/project\/top_catchphrase\.css';/m);
  const css=read('css/project/top_catchphrase.css');
  assert.match(css,/body\.home \{ min-width: 0; \}/);
  assert.match(css,/flex-wrap: wrap/);
  assert.match(css,/1080/);
  assert.doesNotMatch(css,/white-space:\s*nowrap/);
  execFileSync('php',['-l',new URL('../theme/template-parts/_top-catchphrase.php',import.meta.url).pathname]);
});

test('TOP About fixed copy and official map are connected without CMS or dummy links',()=>{
  const part=read('template-parts/_top-about-intro.php');
  for(const name of ['img_map.svg','img_map-pin-01.svg','img_map-pin-02.svg']){
    assert.ok(part.includes('images/top/'+name));
    assert.match(read('images/top/'+name),/<svg/);
  }
  assert.match(read('images/top/img_about-underline.svg'),/<svg/);
  assert.match(part,/ニュージャージー補習授業校とは/);
  assert.match(part,/すべての生徒が、/);
  assert.match(part,/自分らしく/);
  assert.match(part,/もうひとつの学びの場を提供しています/);
  assert.doesNotMatch(part,/<a\s|have_rows|get_field|figma\.com/);
  assert.match(read('front-page.php'),/_top-about-intro[\s\S]*_top-news/);
  assert.match(read('css/style.css'),/^@import '\.\/project\/top_about\.css';/m);
  const css=read('css/project/top_about.css');
  assert.match(css,/img_about-underline\.svg/);
  assert.match(css,/overflow-wrap: anywhere/);
  assert.doesNotMatch(css,/white-space:\s*nowrap/);
  execFileSync('php',['-l',new URL('../theme/template-parts/_top-about-intro.php',import.meta.url).pathname]);
});

test('TOP Applicants preserves approved fixed copy and exact stored illustration/photo paths without fake links',()=>{
  const part=read('template-parts/_top-applicants.php');
  for(const name of ['ico_flow.svg','ico_fee.svg','ico_visit.svg','img_applicants.webp']){
    assert.ok(part.includes('images/top/'+name));
    assert.ok(readFileSync(new URL('../theme/images/top/'+name,import.meta.url)).length>100);
  }
  assert.match(part,/入学・編入手続きの流れ/);
  assert.match(part,/学校見学のお問い合わせ/);
  assert.doesNotMatch(part,/<a\s|<button|href=|get_field|have_rows|figma\.com/);
  assert.match(read('front-page.php'),/_top-applicants[\s\S]*_top-news/);
  assert.match(read('css/style.css'),/^@import '\.\/project\/top_applicants\.css';/m);
  const css=read('css/project/top_applicants.css');
  assert.match(css,/min-height: calc\(80/);
  assert.match(css,/min-height: calc\(100/);
  assert.match(css,/aspect-ratio: 4 \/ 5/);
  assert.doesNotMatch(css,/white-space:\s*nowrap|(?<!min-)height:\s*calc/);
  execFileSync('php',['-l',new URL('../theme/template-parts/_top-applicants.php',import.meta.url).pathname]);
});

test('TOP MV uses existing image repeater and renders only valid initial still images',()=>{
  const part=read('template-parts/_top-mv-grid.php');
  function render(rows){
    const stub='$rows=json_decode(base64_decode("'+Buffer.from(JSON.stringify(rows)).toString('base64')+'"),true); function get_field($n){global $rows;return $rows;} function absint($v){return abs((int)$v);} function wp_attachment_is_image($id){return $id>0 && $id<100;} function wp_get_attachment_image_src($id,$s){return ["/media/".$id.".webp",800,600];} function wp_get_attachment_image_srcset($id,$s){return "/media/".$id.".webp 800w";} function wp_get_attachment_image($id,$s,$icon,$attrs){$q=chr(34);return "<img src=".$q."/media/".$id.".webp".$q." fetchpriority=".$q.$attrs["fetchpriority"].$q.">";} function esc_attr($s){return htmlspecialchars($s,ENT_QUOTES);} ?>';
    return execFileSync('php',['-r',stub+part],{encoding:'utf8'}).trim();
  }
  assert.equal(render([]),'');
  assert.equal(render([{img_pc:101,img_sp:0}]),'');
  assert.equal(render([{img_pc:-1,img_sp:[2]},{img_pc:1.5,img_sp:true},{img_pc:'2bad',img_sp:'0'},{img_pc:{ID:4},img_sp:-3}]),'');
  const validFallback=render([{img_pc:-1,img_sp:'3'},{img_pc:'4',img_sp:{ID:1}}]);
  assert.match(validFallback,/src="\/media\/3\.webp"/);
  assert.match(validFallback,/src="\/media\/4\.webp"/);
  assert.doesNotMatch(validFallback,/\/media\/1\.webp/);
  const partial=render([{img_pc:1,img_sp:2,text:'sample'},{img_pc:0,img_sp:3}]);
  assert.equal((partial.match(/<li class=/g)||[]).length,2);
  assert.match(partial,/srcset="\/media\/2\.webp 800w"/);
  assert.match(partial,/src="\/media\/3\.webp"/);
  assert.doesNotMatch(partial,/is-complete|sample/);
  const complete=render(Array.from({length:8},(_,i)=>({img_pc:i+1,img_sp:i+11})));
  assert.equal((complete.match(/<li class=/g)||[]).length,6);
  assert.match(complete,/is-complete/);
  assert.equal((complete.match(/fetchpriority="high"/g)||[]).length,1);
  assert.doesNotMatch(complete,/\/media\/7\.webp/);
  assert.match(read('front-page.php'),/_top-mv-grid/);
  assert.doesNotMatch(read('front-page.php'),/tm_swiper-container|swiper-pagination/);
  assert.match(read('css/style.css'),/^@import '\.\/project\/top_mainVisual\.css';/m);
  const css=read('css/project/top_mainVisual.css');
  assert.match(css,/grid-template-areas: "a c" "b c" "f f"/);
  assert.match(css,/grid-template-areas: "a c d e" "b c f f"/);
  assert.doesNotMatch(read('js/home.js'),/tm_swiper-container/);
  execFileSync('php',['-l',new URL('../theme/template-parts/_top-mv-grid.php',import.meta.url).pathname]);
});

test('TOP Course uses only SPEC-authorized ACF fields and existing front-page location',()=>{
  const group=JSON.parse(read('acf/json/group_jwsnj_top_course.json'));
  assert.equal(group.fields.length,1);
  const field=group.fields[0];
  assert.equal(field.name,'top_course-01');
  assert.deepEqual(field.sub_fields.map(f=>f.name),['img','title','text','url','target']);
  assert.equal(field.sub_fields[0].return_format,'id');
  assert.deepEqual(group.location,[[{param:'page_type',operator:'==',value:'front_page'}]]);
  assert.ok(field.sub_fields.every(f=>f.parent_repeater===field.key));
  const part=read('template-parts/_top-course.php');
  function render(rows){
    const stub='$rows=json_decode(base64_decode("'+Buffer.from(JSON.stringify(rows)).toString('base64')+'"),true); function get_field($n){global $rows;return $rows;} function wp_attachment_is_image($id){return $id>0 && $id<100;} function wp_get_attachment_image($id,$s,$icon,$attrs){$q=chr(34);return "<img src=".$q."/media/".$id.".webp".$q.">";} function esc_url($s){return str_starts_with($s,"javascript:")?"":htmlspecialchars($s,ENT_QUOTES);} function esc_attr($s){return htmlspecialchars($s,ENT_QUOTES);} function esc_html($s){return htmlspecialchars($s,ENT_QUOTES);} function get_theme_file_uri($s){return "/theme/".$s;} ?>';
    return execFileSync('php',['-r',stub+part],{encoding:'utf8'}).trim();
  }
  assert.equal(render([]),'');
  assert.equal(render([{title:' ',img:1}]),'');
  const html=render([{title:'<Test>',img:1,url:'/actual/',target:['はい'],text:'<script>x</script>'},{title:'Second',img:-1,url:'javascript:alert(1)'}]);
  assert.match(html,/href="\/actual\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(html,/&lt;Test&gt;/);
  assert.match(html,/&lt;script&gt;x&lt;\/script&gt;/);
  assert.equal((html.match(/<a class=/g)||[]).length,1);
  assert.equal((html.match(/\/media\/1\.webp/g)||[]).length,1);
  assert.equal((html.match(/data-course-dot="/g)||[]).length,2);
  assert.match(html,/data-course-controls hidden/);
  assert.doesNotMatch(html,/javascript:|<script>|figma\.com/);
  for(const name of ['layer','mark','math']) assert.match(read('images/top/img_course-'+name+'.svg'),/<svg/);
  assert.match(read('front-page.php'),/_top-about-intro[\s\S]*_top-course[\s\S]*_top-applicants/);
  assert.match(read('css/style.css'),/top_course\.css/);
  const css=read('css/project/top_course.css');
  assert.match(css,/scroll-snap-type: x mandatory/);
  assert.match(css,/repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css,/focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
  assert.doesNotMatch(css,/white-space:\s*nowrap/);
  const js=read('js/home.js').split('/* TOP Course: progressive enhancement')[1].split('*/')[1];
  assert.match(js,/aria-current/);
  assert.match(js,/aria-disabled/);
  assert.match(js,/active < cards.length - 1/);
  assert.match(html,/role="list" data-course-list tabindex="0"/);
  assert.doesNotMatch(js,/\.disabled\s*=/);
  assert.match(js,/prefers-reduced-motion/);
  assert.doesNotMatch(js,/setInterval|autoplay/);
  execFileSync('php',['-l',new URL('../theme/template-parts/_top-course.php',import.meta.url).pathname]);
  execFileSync('node',['--check',new URL('../theme/js/home.js',import.meta.url).pathname]);
});
