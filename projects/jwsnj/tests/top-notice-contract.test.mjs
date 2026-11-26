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


test('TOP MV complete-grid responsive sizes reflect PC quarter/half and SP half/full slots',()=>{
  const part=read('template-parts/_top-mv-grid.php');
  function render(count,processor=true){
    const rows=Array.from({length:count},(_,i)=>({img_pc:i+1,img_sp:i+11}));
    const encoded=Buffer.from(JSON.stringify(rows)).toString('base64');
    // Stub the Core tag-processor contract, not its parsing implementation.
    const tagStub=String.raw`class WP_HTML_Tag_Processor {
      private $html;
      function __construct($html){$this->html=$html;}
      function next_tag($query){return $query["tag_name"]==="IMG";}
      function get_attribute($name){return preg_match('/\b'.preg_quote($name,'/').'="([^"]*)"/',$this->html,$m)?$m[1]:null;}
      function set_attribute($name,$value){$this->html=str_replace($name.'="'.$this->get_attribute($name).'"',$name.'="'.$value.'"',$this->html);}
      function get_updated_html(){return $this->html;}
    }`;
    const stub='$rows=json_decode(base64_decode("'+encoded+'"),true); function get_field($n){global $rows;return $rows;} function wp_attachment_is_image($id){return $id>0;} function wp_get_attachment_image_src($id,$s){return ["/media/".$id.".webp",800,600];} function wp_get_attachment_image_srcset($id,$s){return "/media/".$id.".webp 800w";} function wp_get_attachment_image($id,$s,$icon,$attrs){$q=chr(34);$sizes=$id===2?"custom":($attrs["loading"]==="lazy"?"auto, ":"").$attrs["sizes"];return "<img src=".$q."/media/".$id.".webp".$q." srcset=".$q."/media/".$id.".webp 800w".$q." sizes=".$q.$sizes.$q.">";} function esc_attr($s){return htmlspecialchars($s,ENT_QUOTES);} '+(processor?tagStub:'')+' ?>';
    return execFileSync('php',['-r',stub+part],{encoding:'utf8'});
  }
  const full=render(6);
  const sources=[...full.matchAll(/<source[^>]*\ssizes="([^"]+)"/g)].map(x=>x[1]);
  const images=[...full.matchAll(/<img[^>]*\ssizes="([^"]+)"/g)].map(x=>x[1]);
  assert.deepEqual(sources,['50vw','50vw','50vw','50vw','50vw','100vw']);
  assert.deepEqual(images,['(min-width: 67.5rem) 25vw, 50vw','custom','(min-width: 67.5rem) 25vw, 50vw','auto, (min-width: 67.5rem) 25vw, 50vw','auto, (min-width: 67.5rem) 25vw, 50vw','(min-width: 67.5rem) 50vw, 100vw']);
  const partial=render(3);
  assert.deepEqual([...partial.matchAll(/<source[^>]*\ssizes="([^"]+)"/g)].map(x=>x[1]),['100vw','100vw','100vw']);
  assert.deepEqual([...partial.matchAll(/<img[^>]*\ssizes="([^"]+)"/g)].map(x=>x[1]),['100vw','custom','100vw']);
  const old=render(6,false);
  assert.deepEqual([...old.matchAll(/<img[^>]*\ssizes="([^"]+)"/g)].map(x=>x[1]),['100vw','custom','100vw','auto, 100vw','auto, 100vw','100vw']);
  assert.doesNotMatch(part,/figma\.com|update_field|wp_insert_post/);
});


test('TOP MV uses bundled Swiper instead of a custom animation and keeps static fallback',()=>{
  const part=read('template-parts/_top-mv-grid.php');
  const css=read('css/project/top_mainVisual.css');
  const js=read('js/home.js');
  assert.match(part,/<div class="jwsnj_topMv_viewport">\s*<div class="jwsnj_topMv_track" id="jwsnj_topMv_track">\s*<ul/);
  assert.match(part,/<\?php if \(\$complete\) : \?>\s*<button type="button"[^>]*aria-controls="jwsnj_topMv_track" hidden>/);
  assert.match(css,/&\.is-swiper-prepared \.jwsnj_topMv_track\s*\{[\s\S]*?transition-timing-function: linear/);
  assert.doesNotMatch(css,/@keyframes|animation-play-state|white-space:\s*nowrap/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition-duration: 0ms/);
  assert.match(css,/&\[hidden\] \{ display: none; \}/);
  assert.match(css,/focus-visible/);
  assert.match(js,/new Swiper\(viewport, \{/);
  assert.match(js,/loop: true,\s*speed: desktop\.matches \? 36000 : 18000/);
  assert.match(js,/autoplay: \{ delay: 0, waitForTransition: true, disableOnInteraction: false \}/);
  assert.match(js,/copy\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(js,/copy\.setAttribute\('inert', ''\)/);
  assert.match(js,/await Promise\.all\(visible\.map/);
  assert.match(js,/instance\.destroy\(true, true\)/);
  const bundled=read('js/swiper-bundle.min.js');
  assert.match(bundled,/Swiper 14\.0\.1/);
  assert.match(bundled,/slideNext:function\([^)]*\)\{[^;]*;if\(!r\|\|i\.destroyed\)return i/);
  assert.match(js,/swiper\.autoplay\.stop\(\);[\s\S]*?swiper\.disable\(\);/);
  assert.match(js,/beforeResize: function \(instance\) \{[\s\S]*?instance\.params\.spaceBetween = parseFloat/);
  assert.match(read('inc/front.php'),/wp_enqueue_script\('swiper-script'/);
  execFileSync('node',['--check',new URL('../theme/js/home.js',import.meta.url).pathname]);
});

test('MV Swiper controller covers init, immediate stop, resume, reduced motion and failure fallback',async()=>{
  const {runInNewContext}=await import('node:vm');
  async function fixture({complete=true,reduced=false,fail=false,available=true,initFail=false}={}){
    const classes=()=>{const s=new Set();return {contains:k=>s.has(k),add:(...k)=>k.forEach(x=>s.add(x)),remove:(...k)=>k.forEach(x=>s.delete(x))};};
    const callbacks={};
    const copies=[];
    let decoded=0, options, instance, cloneCount=0, removed=0, starts=0, stops=0, destroyed=0, position=-40, transition, gap=11, loopMoves=0;
    const imgs=[{loading:'lazy',getClientRects:()=>[{}],decode:async()=>{decoded++;if(fail)throw Error('decode');},removeAttribute:()=>{}},{getClientRects:()=>[]}];
    const grid={classList:classes(),cloneNode:()=>{cloneCount++;const attrs={};const copy={attrs,setAttribute:(k,v)=>attrs[k]=v,removeAttribute:()=>{},querySelectorAll:()=>[],remove:()=>removed++};copies.push(copy);return copy;}};
    const track={classList:classes(),querySelector:()=>complete?grid:null,append:()=>{},querySelectorAll:()=>imgs};
    const viewport={classList:classes()};
    const toggle={hidden:true,textContent:'',addEventListener:(n,fn)=>callbacks[n]=fn};
    const root={querySelector:s=>s.includes('viewport')?viewport:s.includes('track')?track:toggle,classList:classes()};
    const mq={matches:reduced,addEventListener:(n,fn)=>callbacks.reduced=fn};
    const desktop={matches:false,addEventListener:(n,fn)=>callbacks.desktop=fn};
    function Swiper(el,opts){
      if(initFail)throw Error('init');
      assert.equal(el,viewport);options=opts;
      instance=this;viewport.swiper=this;
      this.params={speed:opts.speed,spaceBetween:opts.spaceBetween};
      this.size=100;this.snapGrid=[0,111,222];this.snapIndex=1;this.activeIndex=1;
      this.autoplay={start:()=>starts++,stop:()=>stops++};
      this.enabled=true;
      this.disable=()=>{this.enabled=false;};
      this.enable=()=>{this.enabled=true;};
      // Model bundled slideNext's enabled guard before loopFix.
      this.slideNext=()=>{if(this.enabled)loopMoves++;};
      this.getTranslate=()=>position;this.setTransition=v=>transition=v;this.setTranslate=v=>position=v;
      this.on=(n,f)=>callbacks[n]=f;this.off=n=>delete callbacks[n];
      this.slideTo=(idx,speed)=>{assert.equal(idx,1);assert.ok(speed>0);return true;};
      this.transitionEnd=()=>{};
      this.destroy=()=>{this.destroyed=true;destroyed++;};
    }
    runInNewContext(read('js/home.js'),{jQuery:fn=>{if(typeof fn==='function')fn();},window:{matchMedia:s=>s.includes('reduced')?mq:desktop,getComputedStyle:()=>({columnGap:gap+'px'})},document:{querySelectorAll:()=>[root]},Swiper:available?Swiper:undefined});
    await new Promise(resolve=>setImmediate(resolve));
    return {root,toggle,mq,callbacks,copies,options:()=>options,instance:()=>instance,setGap:v=>{gap=v;},stats:()=>({cloneCount,removed,decoded,starts,stops,destroyed,position,transition,loopMoves})};
  }
  const ready=await fixture();
  assert.equal(ready.root.classList.contains('is-swiper-ready'),true);
  assert.equal(ready.toggle.hidden,false);
  assert.equal(ready.options().loop,true);
  assert.equal(ready.options().spaceBetween,11);
  assert.equal(ready.options().speed,18000);
  assert.equal(ready.stats().cloneCount,2);
  assert.deepEqual(ready.copies[0].attrs,{'aria-hidden':'true',inert:''});
  ready.callbacks.click();
  assert.equal(ready.stats().stops,1);
  assert.equal(ready.stats().transition,0);
  assert.equal(ready.stats().position,-40);
  assert.equal(ready.instance().enabled,false);
  ready.instance().slideNext(); // simulate a queued zero-delay frame after stop
  assert.equal(ready.stats().loopMoves,0);
  ready.setGap(15);
  ready.options().on.beforeResize(ready.instance());
  assert.equal(ready.instance().params.spaceBetween,15);
  ready.options().on.resize(ready.instance());
  assert.equal(ready.instance().enabled,false);
  assert.equal(ready.toggle.textContent,'写真の動きを再開');
  ready.callbacks.click();
  assert.equal(ready.instance().enabled,true);
  ready.callbacks.transitionEnd();
  assert.equal(ready.stats().starts,1);
  ready.instance().slideNext();
  assert.equal(ready.stats().loopMoves,1);
  assert.equal(ready.toggle.textContent,'写真の動きを停止');
  ready.mq.matches=true;
  ready.callbacks.reduced();
  assert.equal(ready.stats().destroyed,1);
  assert.equal(ready.stats().removed,2);
  assert.equal(ready.toggle.hidden,true);
  assert.equal(ready.root.classList.contains('is-swiper-prepared'),false);
  for(const opts of [{complete:false},{reduced:true},{available:false},{fail:true},{initFail:true}]){
    const f=await fixture(opts);
    assert.equal(f.toggle.hidden,true);
    assert.equal(f.root.classList.contains('is-swiper-ready'),false);
    assert.equal(f.root.classList.contains('is-swiper-prepared'),false);
  }
});


test('TOP fixed-copy rhythm follows the distinct PC/SP Figma group gaps',()=>{
  const about=read('css/project/top_about.css');
  assert.match(about,/\.jwsnj_topAbout_copy \{\s*position: relative;\s*z-index: 1;\s*display: grid;\s*gap: calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(about,/\.jwsnj_topAbout_title \{\s*display: grid;\s*gap: calc\(8 \* var\(--to-rem-func\)\);\s*margin: 0 0 calc\(4 \* var\(--to-rem-func\)\)/);
  assert.match(about,/\.jwsnj_topAbout_copy \{ gap: calc\(24 \* var\(--to-rem-func\)\); \}/);
  assert.match(about,/\.jwsnj_topAbout_title \{ gap: calc\(16 \* var\(--to-rem-func\)\); margin-bottom: calc\(8 \* var\(--to-rem-func\)\); \}/);
  const applicants=read('css/project/top_applicants.css');
  assert.match(applicants,/padding: calc\(12 \* var\(--to-rem-func\)\) calc\(16 \* var\(--to-rem-func\)\) calc\(12 \* var\(--to-rem-func\)\) calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(applicants,/\.jwsnj_topApplicants_topics li:first-child \{ gap: calc\(10 \* var\(--to-rem-func\)\); \}/);
  assert.match(applicants,/\.jwsnj_topApplicants_topics li:first-child \{ gap: calc\(16 \* var\(--to-rem-func\)\); \}/);
  assert.match(applicants,/padding-inline: calc\(24 \* var\(--to-rem-func\)\) calc\(20 \* var\(--to-rem-func\)\)/);
  assert.doesNotMatch(read('template-parts/_top-applicants.php'),/<a\s|<button|href=/);
});
