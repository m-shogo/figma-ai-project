// Real browser engines, actual checked-in CSS imports, isolated HTML only.
// Not WordPress or Figma visual acceptance.
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(process.env.CSS_QA_MODULE_ROOT+'/package.json');
const {chromium,firefox,webkit}=require('playwright');
const root=resolve('projects/jwsnj/theme');
const out=resolve('css-qa-results');mkdirSync(out,{recursive:true});
const html='<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/css/style.css"><body class="home"><main class="global_contents"><section><div class="global_inner"><a id="link" href="#end">リンク</a><button id="button">ボタン</button><input id="text" type="text" aria-label="入力"><textarea id="area" aria-label="本文">長い本文</textarea><details><summary id="summary">詳細</summary>本文</details><div id="rem" style="width:calc(100 * var(--to-rem-func));height:1px"></div><div class="module_search-01"><form class="ms_from"><input class="ms_input" type="search" aria-label="検索"><button class="ms_button" type="button"><span>検索</span></button></form></div><div id="end">終わり</div></div></section></main></body></html>';
const types={'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp'};
const server=createServer((req,res)=>{
 try{const pathname=new URL(req.url,'http://localhost').pathname;if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return;}const p=resolve(root,'.'+decodeURIComponent(pathname));if(!p.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',types[extname(p)]||'application/octet-stream');res.end(readFileSync(p));}catch{res.statusCode=404;res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
const report=[];
try{
for(const [name,engine] of Object.entries({chromium,firefox,webkit})){
 const browser=await engine.launch();
 try{const page=await browser.newPage({viewport:{width:375,height:900},reducedMotion:'reduce'});
 await page.goto(url);await page.evaluate(()=>document.fonts.ready);
 const features=await page.evaluate(()=>({nesting:CSS.supports('selector(&)'),has:CSS.supports('selector(:has(*))'),trig:CSS.supports('width:calc(tan(atan2(1px,16px))*1rem)'),fieldSizing:CSS.supports('field-sizing:content'),container:CSS.supports('container-type:inline-size')}));
 for(const width of [320,375,767,768,1079,1080,1380]){
 await page.setViewportSize({width,height:900});await page.reload();await page.evaluate(()=>document.fonts.ready);
 const m=await page.evaluate(()=>{const box=id=>document.getElementById(id).getBoundingClientRect();const focus=[];for(const id of ['link','button','text','area','summary']){const el=document.getElementById(id);el.focus();const s=getComputedStyle(el);focus.push({id,style:s.outlineStyle,width:parseFloat(s.outlineWidth)});}return{rem:box('rem').width,body:document.body.getBoundingClientRect().width,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,text:box('text').height,area:box('area').height,focus};});
 assert.ok(Math.abs(m.rem-100)<0.2,name+' rem width '+m.rem);
 assert.ok(m.text>0&&m.area>=m.text,name+' form height');
 assert.ok(m.scroll<=m.client+1,name+' isolated fixture horizontal overflow');
 // Native link/summary/input/button focus evidence is recorded, not all contexts certified.
 if(width===375||width===1380)await page.screenshot({path:out+'/'+name+'-'+width+'.png',fullPage:true});
 report.push({name,version:browser.version(),width,features,...m});
 }
 await page.reload();await page.keyboard.press('Tab');const keyboard=await page.evaluate(()=>({id:document.activeElement.id,outline:getComputedStyle(document.activeElement).outlineStyle,width:getComputedStyle(document.activeElement).outlineWidth}));
 assert.equal(keyboard.id,'link',name+' first keyboard target');
 assert.notEqual(keyboard.outline,'none',name+' keyboard outline');
 assert.ok(parseFloat(keyboard.width)>0,name+' keyboard outline width');
 report.push({name,keyboard});
 // Execute the real authored wrapper functions with bundled jQuery, without replaying unrelated global listeners.
 const common = readFileSync(resolve(root,'js/common.js'),'utf8');
 const init = common.match(/  const initHTML = function \(\) \{[\s\S]*?\n  \};/)[0];
 const lightbox = common.match(/  const lightboxWrap = function \(\) \{[\s\S]*?\n  \};/)[0];
 await page.addScriptTag({url:url+'/js/jquery-3.7.1.min.js'});
 for (const width of [375,768,1380]) {
   await page.setViewportSize({width,height:900});
   const result = await page.evaluate(({init,lightbox}) => {
     const fixture = document.createElement('div');
     fixture.innerHTML = '<div class="gc_main"><p id="preserve-anchor">&nbsp;</p><p class="preserve-space"> </p><p> </p><p>編集者の本文</p><div style="width:120px"><table class="module_table-01" style="min-width:300px"><tr><td>Long table cell</td></tr></table></div><div class="module_password"><form><input type="submit" value="確認"></form></div><div class="block-editor_wrap"><figure class="wp-lightbox-container"><img alt="fixture"></figure></div></div>';
     document.body.append(fixture);
     const run = new Function('$',init+'\n'+lightbox+'\ninitHTML(); lightboxWrap();');
     run(window.jQuery);
     run(window.jQuery);
     const data = {
       table:fixture.querySelectorAll('.module_table-wrap').length,
       password:fixture.querySelectorAll('.mp_submit-wrap').length,
       lightbox:fixture.querySelectorAll('.lightbox_wrap').length,
       paragraphs:fixture.querySelectorAll('p').length,
       anchor:!!fixture.querySelector('#preserve-anchor'),
       space:!!fixture.querySelector('.preserve-space'),
       scroll:fixture.querySelector('.module_table-wrap').classList.contains('_scroll')
     };
     fixture.remove();
     window.jQuery(window).off('load.jwsnjTableWrap resize.jwsnjTableWrap');
     return data;
   },{init,lightbox});
   assert.deepEqual(result,{table:1,password:1,lightbox:1,paragraphs:3,anchor:true,space:true,scroll:true}, name+' repeated DOM enhancement '+width);
   report.push({name,width,domReplay:result});
 }
 // Actual theme imports: menu open/close cascade and table responsive owners.
 // Synthetic markup is isolated from WordPress and does not imply editor/site acceptance.
 for(const width of [375,768,1380]){
   await page.setViewportSize({width,height:900});
   const components=await page.evaluate(()=>{
     const fixture=document.createElement('div');
     fixture.className='block-editor_wrap';
     for(const [owner,prefix] of [['module_menu','mm'],['module_dropdown','mdd']]){
       const menu=document.createElement('div');
       menu.className=owner;
       menu.innerHTML='<div class="'+prefix+'_item-03" data-open="false"><div class="'+prefix+'_title-03"><a class="'+prefix+'_link-03" href="#end">リンク</a><button class="'+prefix+'_button-03">開閉</button></div><div class="'+prefix+'_wrapper-03"><div class="'+prefix+'_inner-03"><div class="'+prefix+'_list-03">子項目</div></div></div></div>';
       fixture.append(menu);
     }
     fixture.insertAdjacentHTML('beforeend','<figure class="wp-block-table is-scroll-on-mobile" data-jwsnj-table-hint tabindex="0"><table><tbody><tr><td>テーブル</td></tr></tbody></table><div class="scroll-hint-icon-wrap"><div class="scroll-hint-icon"></div></div></figure>');
     document.querySelector('.global_inner').append(fixture);
     const menus=[];
     for(const [owner,prefix] of [['module_menu','mm'],['module_dropdown','mdd']]){
       const item=fixture.querySelector('.'+prefix+'_item-03');
       const wrapper=item.querySelector('.'+prefix+'_wrapper-03');
       wrapper.style.transition='none';
       const closed=wrapper.getBoundingClientRect().height;
       item.dataset.open='true';
       const open=wrapper.getBoundingClientRect().height;
       item.dataset.open='false';
       const reclosed=wrapper.getBoundingClientRect().height;
       menus.push({owner,closed,open,reclosed});
     }
     const table=fixture.querySelector('figure');
     const cell=table.querySelector('td');
     const hint=table.querySelector('.scroll-hint-icon-wrap');
     const style=getComputedStyle(cell);
     const result={menus,table:{paddingBlock:parseFloat(style.paddingBlockStart),paddingInline:parseFloat(style.paddingInlineStart),scroll:getComputedStyle(table).overflowX,hint:getComputedStyle(hint).display,width:table.querySelector('table').getBoundingClientRect().width}};
     fixture.remove();
     return result;
   });
   for(const menu of components.menus){
     assert.ok(menu.closed<=1&&menu.open>1&&menu.reclosed<=1,name+' '+menu.owner+' disclosure '+width);
   }
   assert.ok(Math.abs(components.table.paddingBlock-(width<768?12:15))<0.2,name+' table block padding '+width);
   assert.ok(Math.abs(components.table.paddingInline-(width<768?20:30))<0.2,name+' table inline padding '+width);
   if(width<768){
     assert.equal(components.table.scroll,'auto');
     assert.equal(components.table.hint,'block');
     assert.ok(components.table.width>=959);
   }else{
     assert.equal(components.table.hint,'none');
   }
   report.push({name,width,components});
 }
 // Verify explicit transition scope and motion preference for actual block styles.
 await page.setViewportSize({width:1380,height:900});
 for(const reducedMotion of ['no-preference','reduce']){
   await page.emulateMedia({reducedMotion});
   await page.evaluate(()=>{
     const fixture=document.createElement('div');
     fixture.id='motion-probe';
     fixture.className='block-editor_wrap';
     fixture.innerHTML='<div class="wp-block-buttons"><div class="wp-block-button"><a class="wp-block-button__link" href="#end">ボタン</a></div></div><div class="wp-block-tabs"><div class="wp-block-tab-list"><button aria-selected="false">タブ</button></div></div><ul class="module_navigation --large"><li class="navigation"><a href="#end"><div class="image"><img alt="" width="60" height="40"></div><div class="content"><span class="title">案内</span></div></a></li></ul><p><a href="#end">テキストリンク</a></p>';
     document.querySelector('.global_inner').append(fixture);
   });
   const motion=await page.evaluate(()=>{
     const fixture=document.getElementById('motion-probe');
     const selectors=['.wp-block-button__link','.wp-block-tab-list button','.navigation img','.navigation .content','p a'];
     return selectors.map(selector=>{
       const s=getComputedStyle(fixture.querySelector(selector));
       return {selector,property:s.transitionProperty,duration:s.transitionDuration};
     });
   });
   const expected=[['background-color','color'],['background-color','color'],['transform'],['opacity'],['color']];
   for(let i=0;i<motion.length;i++){
     if(reducedMotion==='reduce'){
       assert.equal(motion[i].property,'none',name+' reduced '+motion[i].selector);
       assert.equal(motion[i].duration,'0s');
     }else{
       assert.deepEqual(motion[i].property.split(',').map(s=>s.trim()),expected[i],name+' explicit '+motion[i].selector);
     }
   }
   report.push({name,reducedMotion,motion});
   await page.evaluate(()=>document.getElementById('motion-probe').remove());
 }
 // Verify actual pseudo-element transitions and keyboard-operated Details.
 for (const reducedMotion of ['no-preference', 'reduce']) {
   await page.emulateMedia({reducedMotion});
   await page.evaluate(() => {
     const fixture = document.createElement('div');
     fixture.id = 'remaining-motion-probe';
     fixture.className = 'block-editor_wrap';
     fixture.innerHTML = '<details class="wp-block-details"><summary class="wp-block-details__summary"><span class="wp-block-details__title">質問</span><span class="wp-block-details__button" aria-hidden="true"><span class="wp-block-details__button-icon"></span></span></summary><div class="wp-block-details__content">回答</div></details><ul class="module_searchList-01"><li><a href="#end">検索結果</a></li></ul><figure class="wp-block-image"><a href="#end"><img alt="" width="60" height="40"></a></figure><figure class="wp-block-gallery"><figure class="wp-block-image"><a href="#end"><img alt="" width="60" height="40"></a></figure></figure>';
     document.querySelector('.global_inner').append(fixture);
   });
   const remaining = await page.evaluate(() => {
     const fixture = document.getElementById('remaining-motion-probe');
     const probes = [
       ['.wp-block-details__button-icon', '::after'],
       ['.module_searchList-01 a', null],
       ['.wp-block-image > a', '::after'],
       ['.wp-block-gallery .wp-block-image > a', '::after']
     ];
     return probes.map(([selector, pseudo]) => {
       const style = getComputedStyle(fixture.querySelector(selector), pseudo);
       return {selector, pseudo, property: style.transitionProperty, duration: style.transitionDuration};
     });
   });
   const expected = [['rotate'], ['color'], ['opacity', 'background-color', 'color'], ['opacity', 'background-color', 'color']];
   for (let i = 0; i < remaining.length; i++) {
     if (reducedMotion === 'reduce') {
       assert.equal(remaining[i].property, 'none', name + ' reduced ' + remaining[i].selector);
       assert.equal(remaining[i].duration, '0s');
     } else {
       assert.deepEqual(remaining[i].property.split(',').map(s => s.trim()), expected[i], name + ' explicit ' + remaining[i].selector);
     }
   }
   const summary = page.locator('#remaining-motion-probe summary');
   const details = page.locator('#remaining-motion-probe details');
   await summary.focus();
   await page.keyboard.press('Enter');
   assert.equal(await details.evaluate(el => el.open), true, name + ' keyboard details open');
   await page.keyboard.press('Enter');
   assert.equal(await details.evaluate(el => el.open), false, name + ' keyboard details close');
   report.push({name, reducedMotion, remaining});
   await page.evaluate(() => document.getElementById('remaining-motion-probe').remove());
 }
      // Actual legacy card/list and pager transition owners; heading spacing across the breakpoint.
      for (const width of [375, 768, 1380]) {
        await page.setViewportSize({width, height: 900});
        for (const reducedMotion of ['no-preference', 'reduce']) {
          await page.emulateMedia({reducedMotion});
          const legacy = await page.evaluate(() => {
            const fixture = document.createElement('div');
            fixture.className = 'block-editor_wrap';
            fixture.innerHTML = '<div class="module_newsCard-01"><article class="mnc-01_article"><a class="link" href="#end"><div class="foot"><p class="title">カード</p></div></a></article></div><div class="module_newsList-01"><article class="mnl-01_article"><a class="link" href="#end"><div class="body"><p class="title">一覧</p></div></a></article></div><div class="module_pager-01"><a class="page-numbers" href="#end">2</a></div><ul class="module_pager-02"><li class="back"><a href="#end">一覧</a></li></ul><div><h1>見出し1</h1><h2>次の見出し</h2></div><div><h5>見出し5</h5><h2>次の見出し</h2></div><div><h6>見出し6</h6><h2>次の見出し</h2></div>';
            document.querySelector('.global_inner').append(fixture);
            const selectors = ['.mnc-01_article .title', '.mnl-01_article .title', '.module_pager-01 a', '.module_pager-02 a'];
            const motion = selectors.map(selector => {
              const style = getComputedStyle(fixture.querySelector(selector));
              return {selector, property: style.transitionProperty, duration: style.transitionDuration};
            });
            const headingMargins = [...fixture.querySelectorAll('h2')].map(el => parseFloat(getComputedStyle(el).marginTop));
            fixture.remove();
            return {motion, headingMargins};
          });
          const expected = [['color'], ['color'], ['color', 'background-color'], ['background-color', 'color']];
          for (let i = 0; i < legacy.motion.length; i++) {
            if (reducedMotion === 'reduce') {
              assert.equal(legacy.motion[i].property, 'none', name + ' legacy motion ' + width);
              assert.equal(legacy.motion[i].duration, '0s');
            } else {
              assert.deepEqual(legacy.motion[i].property.split(',').map(value => value.trim()), expected[i], name + ' legacy motion ' + width);
            }
          }
          assert.deepEqual(legacy.headingMargins, [16, 16, 16], name + ' adjacent heading margin ' + width);
          report.push({name, width, reducedMotion, legacy});
        }
      }
 // Compare actual common.js query literals with real CSS controls at each boundary.
 const commonSource = readFileSync(resolve(root, 'js/common.js'), 'utf8');
 const headerQuery = commonSource.match(/const headerDesktop = window\.matchMedia\('([^']+)'\)/)[1];
 const footerQuery = commonSource.match(/const footerDesktop = window\.matchMedia\('([^']+)'\)/)[1];
 for (const width of [375, 767, 768, 769, 1079, 1080, 1081, 1380, 1079, 767]) {
   await page.setViewportSize({width, height: 900});
   const alignment = await page.evaluate(({headerQuery, footerQuery}) => {
     const fixture = document.createElement('div');
     fixture.innerHTML = '<nav class="global_navigation"><button class="gn_close">close</button></nav><footer class="global_footer"><ul class="gf_links-01"><li><button class="gfl_button-02">open</button></li></ul></footer>';
     document.body.append(fixture);
     const data = {headerMedia: matchMedia(headerQuery).matches, footerMedia: matchMedia(footerQuery).matches, headerCSS: getComputedStyle(fixture.querySelector('.gn_close')).display === 'none', footerCSS: getComputedStyle(fixture.querySelector('.gfl_button-02')).display === 'none'};
     fixture.remove();
     return data;
   }, {headerQuery, footerQuery});
   assert.equal(alignment.headerMedia, alignment.headerCSS, name + ' Header CSS/JS ' + width);
   assert.equal(alignment.footerMedia, alignment.footerCSS, name + ' Footer CSS/JS ' + width);
   report.push({name, width, alignment});
 }
 // Figma SP 512:2449 / 512:2454: authored row geometry, not full WP/visual parity.
 for (const width of [320, 375, 767, 1079, 1080, 1380]) {
   await page.setViewportSize({width, height: 900});
   const rows = await page.evaluate(() => {
     const fixture = document.createElement('div');
     fixture.innerHTML = '<nav class="global_navigation"><ul class="gn_links-01"><li class="gnl_item-02 _hasChild" data-open="true"><div class="gnl_title-02"><a class="gnl_link-02" href="#end"><span>学校案内</span></a><button class="gnl_button-02" type="button" aria-label="open"></button></div><div class="gnl_wrapper-02"><div class="gnl_inner-02"><ul class="gnl_list-02"><li class="gnl_item-03"><div class="gnl_title-03"><a class="gnl_link-03" href="#end"><span>学校概要</span></a></div></li><li class="gnl_item-03"><div class="gnl_title-03"><a class="gnl_link-03" href="#end"><span>長い日本語 English mixed label for wrapping naturally on small screens</span></a></div></li></ul></div></div></li><li class="gnl_item-02 _noChild"><div class="gnl_title-02"><a class="gnl_link-02" href="#end">教育内容</a></div></li></ul></nav>';
     document.body.append(fixture);
     const el = selector => fixture.querySelector(selector);
     const style = selector => getComputedStyle(el(selector));
     const title = style('.gnl_title-02');
     const parent = style('.gnl_link-02');
     const child = style('.gnl_link-03');
     const list = style('.gnl_list-02');
     const button = style('.gnl_button-02');
     const long = el('.gnl_item-03:last-child .gnl_link-03');
     const range = document.createRange();
     range.selectNodeContents(long.querySelector('span'));
     const bounds = long.getBoundingClientRect();
     const rects = [...range.getClientRects()];
     const result = {
       title: title.backgroundColor, parentSize: parent.fontSize, parentWeight: parent.fontWeight,
       parentPad: parent.paddingBlockStart, childSize: child.fontSize, childWeight: child.fontWeight,
       childPad: child.paddingBlockStart, listPad: list.paddingInlineStart, listBg: list.backgroundColor,
       firstBorder: style('.gnl_item-03:first-child').borderTopWidth,
       nextBorder: style('.gnl_item-03:last-child').borderTopWidth,
       parentGap: style('.gnl_item-02:last-child').borderTopWidth,
       button: button.display, buttonWidth: button.width,
       stroke: getComputedStyle(el('.gnl_button-02'), '::before').width,
       strokeColor: getComputedStyle(el('.gnl_button-02'), '::before').backgroundColor,
       childLines: rects.length,
       textFits: rects.every(rect => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1),
       grid: list.gridTemplateColumns
     };
     fixture.remove();
     return result;
   });
   if (width < 1080) {
     assert.equal(rows.title, 'rgb(245, 253, 235)', name + ' SP parent background');
     assert.deepEqual([rows.parentSize, rows.parentWeight, rows.parentPad], ['16px', '500', '20px']);
     assert.deepEqual([rows.childSize, rows.childWeight, rows.childPad], ['14px', '500', '15px']);
     assert.equal(rows.listPad, '20px');
     assert.equal(rows.listBg, 'rgb(255, 255, 255)');
     assert.deepEqual([rows.firstBorder, rows.nextBorder, rows.parentGap], ['0px', '1px', '2px']);
     assert.deepEqual([rows.buttonWidth, rows.stroke, rows.strokeColor], ['52px', '12px', 'rgb(40, 172, 95)']);
     if (width <= 375) assert.ok(rows.childLines >= 2 && rows.textFits, name + ' long child row ' + width);
   } else {
     assert.equal(rows.title, 'rgba(0, 0, 0, 0)');
     assert.equal(rows.button, 'none');
     assert.equal(rows.grid.split(' ').length, 3, name + ' preserve legacy desktop grid');
   }
   report.push({name, width, headerMenuRows: rows});
 }
 // Legacy file presentation must not leak to a generic .file component.
 for (const width of [375, 768, 1380]) {
   await page.setViewportSize({width, height: 900});
   const fileStyles = await page.evaluate(() => {
     const fixture = document.createElement('div');
     fixture.innerHTML = '<div class="file"><label>ordinary</label><input type="file"></div><div class="wpcf7"><div class="file"><label>legacy</label><input type="file"></div></div>';
     document.body.append(fixture);
     const data = [...fixture.querySelectorAll('.file')].map(el => ({
       display: getComputedStyle(el).display,
       labelBefore: getComputedStyle(el.querySelector('label'), '::before').content,
       fileDisplay: getComputedStyle(el.querySelector('input')).display
     }));
     fixture.remove();
     return data;
   });
   assert.notEqual(fileStyles[0].display, 'flex', name + ' ordinary wrapper');
   assert.ok(['none', 'normal'].includes(fileStyles[0].labelBefore), name + ' ordinary label pseudo');
   assert.notEqual(fileStyles[0].fileDisplay, 'none', name + ' ordinary file');
   assert.equal(fileStyles[1].display, 'flex', name + ' legacy wrapper');
   assert.equal(fileStyles[1].labelBefore, '"選択されていません"', name + ' legacy label');
   report.push({name, width, fileStyles});
 }
 // Footer owner locality: actual CSS, preserve the artwork switch and details geometry.
 for (const width of [375, 768, 1079, 1080, 1380]) {
   await page.setViewportSize({width, height: 900});
   const footer = await page.evaluate(() => {
     const fixture = document.createElement('footer');
     fixture.className = 'global_footer';
     fixture.innerHTML = '<div class="gf_brandStatement"><div class="gf_brandStatement-copy">copy</div><div class="gf_brandStatement-left is-sp"></div><div class="gf_brandStatement-right is-sp"><img class="gf_brandStatement-line" alt=""></div><div class="gf_brandStatement-left is-pc"></div><div class="gf_brandStatement-right is-pc"><img class="gf_brandStatement-line" alt=""></div></div><div class="gf_details"><div class="gf_information">identity</div><div class="gf_links-wrap">links</div></div>';
     document.body.append(fixture);
     const style = selector => getComputedStyle(fixture.querySelector(selector));
     const variants = ['.gf_brandStatement-left.is-sp', '.gf_brandStatement-right.is-sp', '.gf_brandStatement-left.is-pc', '.gf_brandStatement-right.is-pc'].map(selector => {
       const s = style(selector);
       return {display: s.display, row: s.gridRowStart, column: s.gridColumnStart, ratio: s.aspectRatio};
     });
     const data = {variants, details: style('.gf_details').display, identity: style('.gf_information').flexBasis, links: style('.gf_links-wrap').flexBasis};
     fixture.remove();
     return data;
   });
   const desktop = width >= 1080;
   assert.deepEqual(footer.variants.map(v => v.display), desktop ? ['none', 'none', 'block', 'block'] : ['block', 'block', 'none', 'none'], name + ' footer variants ' + width);
   const shown = desktop ? footer.variants.slice(2) : footer.variants.slice(0, 2);
   assert.deepEqual(shown.map(v => v.row), desktop ? ['1', '1'] : ['2', '2']);
   assert.deepEqual(shown.map(v => v.column), desktop ? ['1', '3'] : ['1', '2']);
   assert.equal(footer.details, desktop ? 'flex' : 'grid');
   assert.equal(footer.identity, desktop ? '308px' : 'auto');
   assert.equal(footer.links, desktop ? '541px' : 'auto');
   report.push({name, width, footer});
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 // Feature proof separate from production layout: actual cascade and containment.
 const mechanism=await page.evaluate(()=>{
   const root=document.documentElement;
   root.style.fontSize='20px';
   const enhanced=document.getElementById('rem').getBoundingClientRect().width;
   root.style.setProperty('--to-rem-func','0.0625rem');
   const fallback=document.getElementById('rem').getBoundingClientRect().width;
   root.style.removeProperty('--to-rem-func');root.style.removeProperty('font-size');
   const style=document.createElement('style');
   style.textContent='@layer cssqa-demo { #cssqa-layer { color: rgb(10, 20, 30); } } #cssqa-layer { color: rgb(40, 50, 60); } .cssqa-container { container-type:inline-size; width:200px; } .cssqa-grid { display:grid; grid-template-columns:1fr; @container (min-width:300px) { grid-template-columns:1fr 1fr; } }';
   document.head.append(style);
   const fixture=document.createElement('div');
   fixture.innerHTML='<div id="cssqa-layer">layer</div><div class="cssqa-container"><div class="cssqa-grid"><div>A</div><div>B</div></div></div>';
   document.body.append(fixture);
   const grid=fixture.querySelector('.cssqa-grid'),container=fixture.querySelector('.cssqa-container');
   const columns=()=>getComputedStyle(grid).gridTemplateColumns.split(' ').length;
   const narrow=columns();container.style.width='400px';const wide=columns();
   const layerColor=getComputedStyle(fixture.querySelector('#cssqa-layer')).color;
   fixture.remove();style.remove();
   return {enhanced,fallback,narrow,wide,layerColor,scopeSupported:'CSSScopeRule' in window};
 });
 assert.ok(Math.abs(mechanism.enhanced-125)<0.2,name+' 20px root rem');
 assert.ok(Math.abs(mechanism.fallback-125)<0.2,name+' fallback rem');
 assert.equal(mechanism.narrow,1);assert.equal(mechanism.wide,2);
 assert.equal(mechanism.layerColor,'rgb(40, 50, 60)');
 report.push({name,mechanism});
 }finally{await browser.close();}
}
}finally{writeFileSync(out+'/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await new Promise(r=>server.close(r));}
