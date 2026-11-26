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
