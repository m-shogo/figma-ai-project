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
