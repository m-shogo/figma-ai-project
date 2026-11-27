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
const html='<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/css/all.min.css"><link rel="stylesheet" href="/css/style.css"><body class="home"><main class="global_contents"><section><div class="global_inner"><a id="link" href="#end">リンク</a><button id="button">ボタン</button><input id="text" type="text" aria-label="入力"><textarea id="area" aria-label="本文">長い本文</textarea><details><summary id="summary">詳細</summary>本文</details><div id="rem" style="width:calc(100 * var(--to-rem-func));height:1px"></div><div class="module_search-01"><form class="ms_from"><input class="ms_input" type="search" aria-label="検索"><button class="ms_button" type="button"><span>検索</span></button></form></div><div id="end">終わり</div></div></section></main></body></html>';
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
     fixture.innerHTML='<div class="wp-block-buttons"><div class="wp-block-button"><a class="wp-block-button__link" href="#end">ボタン</a></div></div><div class="wp-block-tabs"><div class="wp-block-tab-list"><button aria-selected="false">タブ</button></div></div><ul class="module_navigation --large"><li class="navigation"><a class="module_navigationCard" href="#end"><div class="module_navigationCard_photo"><div class="module_navigationCard_crop"><img alt="" width="60" height="40"></div><span class="module_navigationCard_arrow" aria-hidden="true"></span></div><div class="module_navigationCard_content"><span class="module_navigationCard_title">案内</span></div></a></li></ul><p><a href="#end">テキストリンク</a></p>';
     document.querySelector('.global_inner').append(fixture);
   });
   const motion=await page.evaluate(()=>{
     const fixture=document.getElementById('motion-probe');
     const selectors=['.wp-block-button__link','.wp-block-tab-list button','.module_navigationCard_crop img','.module_navigationCard_content','p a'];
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
 // Header logo: the saved official 60x57 SVG retains its aspect ratio at each width.
  for (const width of [320, 375, 767, 1079, 1080, 1380]) {
    await page.setViewportSize({width, height: 900});
    const logo = await page.evaluate(async () => {
      const fixture = document.createElement('header');
      fixture.className = 'global_header';
      fixture.innerHTML = '<div class="gh_inner"><p class="gh_logo"><a href="#end"><img src="/images/common/img_njws-logo-header.svg" width="60" height="57" alt=""><span class="gh_logo-name">ニュージャージー補習授業校</span></a></p><button class="gh_menu" aria-label="menu">menu</button></div>';
      document.body.append(fixture);
      const image = fixture.querySelector('img');
      await image.decode();
      const name = fixture.querySelector('.gh_logo-name');
      const measure = () => {
        const text = name.getBoundingClientRect();
        const header = fixture.getBoundingClientRect();
        const button = fixture.querySelector('.gh_menu').getBoundingClientRect();
        const img = image.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(name);
        const rects = [...range.getClientRects()];
        return {
          width: img.width, height: img.height, natural: [image.naturalWidth, image.naturalHeight],
          padding: img.left - header.left, gap: text.left - img.right,
          size: getComputedStyle(name).fontSize, family: getComputedStyle(name).fontFamily,
          lineHeight: getComputedStyle(name).lineHeight, lines: rects.length,
          fits: text.top >= header.top - 1 && text.bottom <= header.bottom + 1 &&
            rects.every(rect => rect.left >= text.left - 1 && rect.right <= text.right + 1),
          noOverlap: button.width === 0 || text.right <= button.left + 1
        };
      };
      const normal = measure();
      name.textContent = 'ニュージャージー補習授業校 学校案内';
      const longer = measure();
      fixture.remove();
      return {normal, longer};
    });
    const desktop = width >= 1080;
    assert.deepEqual(logo.normal.natural, [60, 57]);
    assert.ok(Math.abs(logo.normal.width - (desktop ? 60 : 46)) <= 0.1, name + ' logo width ' + width);
    assert.ok(Math.abs(logo.normal.height - logo.normal.width * 57 / 60) <= 0.15, name + ' logo aspect ' + width);
    assert.equal(logo.normal.padding, desktop ? 40 : 16);
    assert.ok(Math.abs(logo.normal.gap - (desktop ? 12 : 8)) <= 0.1);
    assert.equal(logo.normal.size, desktop ? '20px' : '15px');
    assert.match(logo.normal.family, /Zen Kaku Gothic New/);
    assert.ok(logo.normal.fits && logo.normal.noOverlap, JSON.stringify(logo.normal));
    assert.ok(logo.longer.fits && logo.longer.noOverlap, JSON.stringify(logo.longer));
    if (width === 320) assert.ok(logo.longer.lines >= 2);
    report.push({name, width, headerLogo: logo});
  }
  // SP secondary links, actual authored CSS, including a long editor-supplied label.
  for (const width of [320, 375, 767, 1079, 1080, 1380]) {
    await page.setViewportSize({width, height: 900});
    const secondary = await page.evaluate(() => {
      const fixture = document.createElement('nav');
      fixture.className = 'global_navigation';
      fixture.innerHTML = '<div class="gn_menu">Primary</div><div class="gn_subMenu"><div class="gn_container-02"><ul class="menu gn_links-02"><li class="menu-item"><a class="module_textLink" href="#end">お問い合わせ</a></li><li class="menu-item"><a class="module_textLink" href="#end" target="_blank" rel="noopener noreferrer">寄付のお願い</a></li><li class="menu-item"><a class="module_textLink" href="#end">長い補助メニュー項目 Extraordinarily long text for natural wrapping without overflow</a></li></ul></div></div><div class="gn_search">Search</div>';
      document.body.append(fixture);
      const menu = fixture.querySelector('.gn_links-02');
      const sub = fixture.querySelector('.gn_subMenu');
      const rows = [...menu.children];
      const link = rows[0].querySelector('a');
      const style = getComputedStyle(link);
      const external = getComputedStyle(rows[1].querySelector('a'), '::after');
      const last = rows[2].querySelector('a');
      const range = document.createRange();
      range.selectNodeContents(last);
      const rects = [...range.getClientRects()];
      const box = last.getBoundingClientRect();
      const result = {
        display: getComputedStyle(menu).display,
        gap: getComputedStyle(menu).gap,
        inset: menu.getBoundingClientRect().left - fixture.getBoundingClientRect().left,
        topGap: sub.getBoundingClientRect().top - fixture.querySelector('.gn_menu').getBoundingClientRect().bottom,
        size: style.fontSize, weight: style.fontWeight, lineHeight: style.lineHeight,
        padding: style.paddingBottom,
        border: getComputedStyle(rows[0]).borderBottomColor,
        borderWidth: getComputedStyle(rows[0]).borderBottomWidth,
        iconSize: external.fontSize, iconGap: external.marginInlineStart,
        sameColumn: rows.every(row => Math.abs(row.getBoundingClientRect().left - rows[0].getBoundingClientRect().left) < 1),
        lines: rects.length,
        fits: rects.every(rect => rect.left >= box.left - 1 && rect.right <= box.right + 1)
      };
      fixture.remove();
      return result;
    });
    if (width < 1080) {
      assert.deepEqual([secondary.display, secondary.gap, secondary.size, secondary.weight, secondary.padding], ['grid', '16px', '13px', '500', '16px']);
      assert.equal(secondary.inset, 40);
      assert.equal(secondary.topGap, 40);
      assert.equal(secondary.border, 'rgb(215, 212, 212)');
      assert.equal(secondary.borderWidth, '1px');
      assert.deepEqual([secondary.iconSize, secondary.iconGap], ['12px', '4px']);
      assert.ok(secondary.sameColumn && secondary.fits, JSON.stringify(secondary));
      if (width <= 375) assert.ok(secondary.lines >= 2);
    } else {
      assert.equal(secondary.display, 'flex');
      assert.equal(secondary.gap, '20px');
      assert.equal(secondary.borderWidth, '0px');
    }
    report.push({name, width, secondary});
  }
  // PC357:1004 / SP442:2816, PC344:947 / SP442:2806, PC344:991 / SP442:2842.
  // Existing CSS, native list/button markup; isolated browser fixture, not editor iframe.
  for (const width of [320, 375, 768, 1080, 1380]) {
    await page.setViewportSize({width, height: 900});
    const parts = await page.evaluate(async () => {
      const fixture = document.createElement('div');
      fixture.className = 'block-editor_wrap';
      fixture.style.cssText = 'width:min(calc(100% - 40px),960px);margin-inline:auto';
      fixture.innerHTML = '<ul class="wp-block-list"><li><span>リスト間余白16px、ネストとの間隔12px</span><ul class="wp-block-list"><li>ネスト間隔は8px</li><li>ネストされたリスト</li></ul></li><li><span>番号なしリスト LongEditableLabelWithoutSpaces1234567890LongEditableLabelWithoutSpaces1234567890</span></li></ul><ol class="wp-block-list" start="10"><li>番号が2桁の場合</li><li value="1">番号リスト</li><li>リスト間15px</li></ol><div class="wp-block-buttons"><div class="wp-block-button"><a class="wp-block-button__link" href="#end">ボタン大</a></div><div class="wp-block-button has-custom-width" style="width:1200px"><a class="wp-block-button__link" href="#end">長いボタンのテキスト LongEditableLabelWithoutSpaces1234567890LongEditableLabelWithoutSpaces1234567890</a></div></div>';
      document.body.append(fixture);
      const root = fixture.querySelector('ul');
      const first = root.children[0];
      const second = root.children[1];
      const nest = first.querySelector('ul');
      const numbered = fixture.querySelector('ol');
      const faces = await document.fonts.load('400 14px "Font Awesome 6 Pro"', String.fromCodePoint(0xf061));
      const label = first.querySelector('span');
      const rect = el => el.getBoundingClientRect();
      const metric = (el, key, pseudo) => getComputedStyle(el, pseudo)[key];
      const box = rect(fixture);
      const long = second.querySelector('span');
      const range = document.createRange();
      range.selectNodeContents(long);
      const lines = [...range.getClientRects()];
      const buttons = [...fixture.querySelectorAll('.wp-block-button__link')];
      const custom = buttons[1].parentElement;
      const buttonRange = document.createRange();
      buttonRange.selectNodeContents(buttons[1]);
      const buttonLines = [...buttonRange.getClientRects()];
      const longBox = rect(buttons[1]);
      const result = {
        bullet: {
          font: metric(first, 'fontSize'), lineHeight: metric(first, 'lineHeight'),
          gap: rect(second).top - rect(first).bottom,
          textInset: rect(label).left - rect(root).left,
          nestInset: rect(nest.children[0]).left - rect(root).left,
          nestTop: rect(nest).top - rect(label).bottom,
          nestMargin: metric(nest, 'marginTop'),
          nestGap: rect(nest.children[1]).top - rect(nest.children[0]).bottom,
          marker: metric(first, 'width', '::before'),
          markerTop: metric(first, 'top', '::before'),
          nestedBorder: metric(nest.children[0], 'borderTopWidth', '::before'),
          lines: lines.length,
          fits: lines.every(r => r.left >= box.left - 1 && r.right <= box.right + 1)
        },
        ordered: {
          font: metric(numbered.children[0], 'fontSize'),
          gap: rect(numbered.children[1]).top - rect(numbered.children[0]).bottom,
          inset: parseFloat(metric(numbered,'paddingLeft')) + parseFloat(metric(numbered.children[0],'paddingLeft')),
          type: metric(numbered.children[0], 'listStyleType'),
          markerContent: metric(numbered.children[0], 'content', '::marker'),
          markerFont: metric(numbered.children[0], 'fontSize', '::marker'),
          beforeContent: metric(numbered.children[0], 'content', '::before')
        },
        button: {
          normalWidth: rect(buttons[0]).width, normalHeight: rect(buttons[0]).height,
          customWidth: rect(custom).width, container: box.width, longHeight: longBox.height,
          lines: buttonLines.length,
          fits: buttonLines.every(r => r.left >= longBox.left - 1 && r.right <= longBox.right - 50),
          icon: metric(buttons[1], 'fontSize', '::after'),
          iconFontLoaded: faces.length > 0 && faces.every(face => face.status === 'loaded')
        }
      };
      fixture.id = 'parts-recheck';
      return result;
    });
    const near = (actual, expected) => Math.abs(actual - expected) <= 1;
    assert.deepEqual([parts.bullet.font, parts.bullet.lineHeight, parts.bullet.marker, parts.bullet.markerTop, parts.bullet.nestedBorder], ['15px','24px','6px','9px','1px']);
    assert.ok(near(parts.bullet.gap,16) && near(parts.bullet.textInset,18) && near(parts.bullet.nestInset,24) && near(parts.bullet.nestGap,8) && parts.bullet.nestMargin === '12px' && parts.bullet.fits, JSON.stringify(parts));
    assert.deepEqual([parts.ordered.font, parts.ordered.type, parts.ordered.markerFont, parts.ordered.markerContent], ['15px','decimal','16px','normal']);
    assert.ok(near(parts.ordered.inset,34) && ['none','normal'].includes(parts.ordered.beforeContent));
    assert.ok(near(parts.ordered.gap,15));
    assert.ok(near(parts.button.normalWidth,260) && near(parts.button.normalHeight,50) && parts.button.customWidth <= parts.button.container + 1 && parts.button.fits && parts.button.icon === '14px' && parts.button.iconFontLoaded, JSON.stringify(parts));
    if (width <= 375) assert.ok(parts.bullet.lines >= 2 && parts.button.lines >= 2 && parts.button.longHeight > 50);
    if (width === 375 || width === 1380) await page.locator('#parts-recheck').screenshot({path:out+'/'+name+'-'+width+'-list-button.png'});
    await page.locator('#parts-recheck').evaluate(el => el.remove());
    report.push({name,width,partsRecheck:parts});
  }
 // In-page-link markup mirrors the existing ACF render; no ACF runtime claim.
 for (const width of [320, 375, 767, 768, 1380]) {
   await page.setViewportSize({width, height: 900});
   await page.emulateMedia({reducedMotion: 'no-preference'});
   await page.evaluate(() => {
     const fixture = document.createElement('div');
     fixture.id = 'inpage-link-recheck';
     fixture.className = 'block-editor_wrap';
     fixture.style.cssText = 'width:min(calc(100% - 40px),960px);margin-inline:auto';
     const labels = ['ページ内リンク 最小幅304px', 'ページ内リンクページ内リンクページ内リンク', 'ページ内リンク', 'ページ内リンク', 'ページ内リンク', '長文 LongEditableLabelWithoutSpaces1234567890LongEditableLabelWithoutSpaces1234567890LongEditableLabelWithoutSpaces1234567890'];
     const list = document.createElement('ul');
     list.className = 'module_inPageLink-01';
     for (const label of labels) {
       const item = document.createElement('li');
       item.className = 'inPageLink';
       const link = document.createElement('a');
       link.href = '#end';
       const title = document.createElement('div');
       title.className = 'title';
       title.textContent = label;
       link.append(title);
       item.append(link);
       list.append(item);
     }
     fixture.append(list);
     document.body.append(fixture);
   });
   const fixture = page.locator('#inpage-link-recheck');
   const first = fixture.locator('a').first();
   await first.scrollIntoViewIfNeeded();
   await page.evaluate(() => document.fonts.ready);
   const geometry = await fixture.evaluate(el => {
     const bounds = el.getBoundingClientRect();
     const list = el.querySelector('ul');
     const items = [...list.querySelectorAll('a')].map(link => {
       const rect = link.getBoundingClientRect();
       const label = link.querySelector('.title');
       const text = label.getBoundingClientRect();
       const style = getComputedStyle(link);
       const icon = getComputedStyle(link, '::after');
       return {
         width: rect.width, height: rect.height, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
         font: style.fontSize, weight: style.fontWeight, padding: style.paddingInlineStart, duration: style.transitionDuration,
         icon: [icon.width, icon.height, icon.fontSize, icon.fontWeight, icon.content],
         fits: rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 && label.scrollWidth <= label.clientWidth + 1 &&
           text.right <= rect.right - 16 - 24 + 1
       };
     });
     return { width: bounds.width, gap: parseFloat(getComputedStyle(list).gap), items };
   });
   assert.equal(geometry.gap, width < 768 ? 20 : 24);
   for (const item of geometry.items) {
     assert.ok(item.fits && item.height >= 47.9 && item.width >= Math.min(304,geometry.width) - 1, JSON.stringify(geometry));
     assert.deepEqual([item.font,item.weight,item.padding,item.duration], ['15px','500','16px','0.3s']);
     assert.deepEqual(item.icon.slice(0,4), ['24px','24px','10px','900']);
     assert.ok(item.icon[4].includes('\uf063'), JSON.stringify(item.icon));
     if (width < 768) assert.ok(Math.abs(item.width - geometry.width) <= 1);
   }
   if (width < 768) for(let i=1;i<geometry.items.length;i++) assert.ok(Math.abs(geometry.items[i].top - geometry.items[i-1].bottom - 20)<=1);
   assert.ok(geometry.items.at(-1).height > 48 || width >= 768, JSON.stringify(geometry));
   await first.focus();
   assert.ok(await first.evaluate(el => el === document.activeElement && parseFloat(getComputedStyle(el).outlineWidth) >= 2));
   await page.emulateMedia({reducedMotion:'reduce'});
   assert.equal(await first.evaluate(el => getComputedStyle(el).transitionDuration), '0s');
   if(width===375||width===1380) await fixture.screenshot({path:out+'/'+name+'-'+width+'-inpage-links.png'});
   await fixture.evaluate(el=>el.remove());
   report.push({name,width,inPageLinks:geometry});
 }
 // Large Navigation: same reusable markup, QA-only data, no production URL.
 for (const width of [320,375,767,768,1380]) {
   await page.setViewportSize({width,height:900});
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.evaluate(() => {
     const fixture=document.createElement('div');
     fixture.id='large-nav-parts';
     fixture.className='block-editor_wrap';
     fixture.style.cssText='width:min(calc(100% - 40px),960px);margin-inline:auto';
     const items=['幼児部','長文のタイトル LongEditableLabelWithoutSpaces1234567890LongEditableLabelWithoutSpaces1234567890','中等部'];
     const cards=items.map((title,i)=>'<li class="navigation"><a class="module_navigationCard"'+(i===0?' href="#end"':'')+'><div class="module_navigationCard_photo"><div class="module_navigationCard_crop"><img src="/images/top/img_course-preschool.webp" alt=""></div><span class="module_navigationCard_arrow" aria-hidden="true"></span></div><div class="module_navigationCard_content"><h2 class="module_navigationCard_title">'+title+'</h2><div class="module_navigationCard_text">テキストが入ります。テキストが入ります。'+(i===1?' LongEditableTextWithoutSpaces1234567890LongEditableTextWithoutSpaces1234567890':'')+'</div></div></a></li>');
     cards.push('<li class="navigation"><a class="module_navigationCard"><div class="module_navigationCard_content"><h2 class="module_navigationCard_title">画像なし</h2></div></a></li>');
     fixture.innerHTML='<ul class="module_navigation --large">'+cards.join('')+'</ul>';
     document.body.append(fixture);
   });
   const fixture=page.locator('#large-nav-parts');
   for(const image of await fixture.locator('img').all()) await image.evaluate(el=>el.decode());
   const geometry=await fixture.evaluate(el=>{
     const list=el.querySelector('ul'), box=list.getBoundingClientRect();
     const cards=[...list.querySelectorAll('.module_navigationCard')].map(a=>{
       const r=a.getBoundingClientRect(), photo=a.querySelector('.module_navigationCard_photo'), copy=a.querySelector('.module_navigationCard_content');
       const text=a.querySelector('.module_navigationCard_text'),title=a.querySelector('.module_navigationCard_title');
       const ar=a.querySelector('.module_navigationCard_arrow');
       return {width:r.width, fits:r.left>=box.left-1&&r.right<=box.right+1&&title.scrollWidth<=title.clientWidth+1&&(!text||text.scrollWidth<=text.clientWidth+1), photo:photo?photo.getBoundingClientRect().width/photo.getBoundingClientRect().height:null, gap:photo?copy.getBoundingClientRect().top-photo.getBoundingClientRect().bottom:null, copyGap:text?text.getBoundingClientRect().top-title.getBoundingClientRect().bottom:null, arrow:ar?[ar.getBoundingClientRect().width,ar.getBoundingClientRect().height]:null, href:a.hasAttribute('href'), tab:a.tabIndex};
     });
     return {width:box.width,columns:getComputedStyle(list).gridTemplateColumns.split(' ').length,gap:parseFloat(getComputedStyle(list).gap),cards};
   });
   assert.equal(geometry.columns,width<768?1:3);
   assert.equal(geometry.gap,40);
   for(const card of geometry.cards){
     assert.ok(card.fits,JSON.stringify(geometry));
     if(card.photo!==null){
       assert.ok(Math.abs(card.photo-1.5)<0.02&&Math.abs(card.gap-24)<1&&Math.abs(card.copyGap-20)<1,JSON.stringify(card));
       assert.deepEqual(card.arrow,[32,32]);
     }
   }
   // Native anchors without href may report tabIndex=0 in Chromium even
   // though they are not sequential keyboard stops. Test actual focus.
   const first=fixture.locator('a[href]').first();
   await first.focus();
   for(const disabled of await fixture.locator('a:not([href])').all()) {
     assert.equal(await disabled.evaluate(el=>{el.focus();return el===document.activeElement;}),false,'href-less card is not focusable');
   }
   await first.focus();
   await page.keyboard.press('Tab');
   assert.equal(await fixture.evaluate(el=>el.contains(document.activeElement)),false,'Tab skips href-less cards');
   await first.focus();
   assert.ok(await first.evaluate(el=>el===document.activeElement&&parseFloat(getComputedStyle(el).outlineWidth)>=2));
   await first.hover();
   await page.waitForFunction(el=>getComputedStyle(el.querySelector('img')).transform!=='none',await first.elementHandle());
   await page.emulateMedia({reducedMotion:'reduce'});
   assert.equal(await first.locator('img').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
   await page.mouse.move(0,0);
   await first.evaluate(el=>el.blur());
   if(width===375||width===1380)await fixture.screenshot({path:out+'/'+name+'-'+width+'-large-navigation.png'});
   await fixture.evaluate(el=>el.remove());
   report.push({name,width,largeNavigation:geometry});
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
  // Footer identity Figma 114:487 / 279:2769; existing site-name owner, exact saved mark.
  for (const width of [320, 375, 768, 1080, 1380]) {
    await page.setViewportSize({width, height: 900});
    const footerLogo = await page.evaluate(async () => {
      const fixture = document.createElement('footer');
      fixture.className = 'global_footer';
      fixture.innerHTML = '<div class="gf_details global_inner"><div class="gf_information"><p class="gf_logo"><a href="#end"><img src="/images/common/img_njws-logo.svg" width="51" height="48" alt=""><span>ニュージャージー補習授業校 学校案内</span></a></p></div><div class="gf_links-wrap">Menu fixture</div></div>';
      document.body.append(fixture);
      const img = fixture.querySelector('img');
      await img.decode();
      const name = fixture.querySelector('.gf_logo span');
      const style = getComputedStyle(name);
      const box = name.getBoundingClientRect();
      const logo = fixture.querySelector('.gf_logo').getBoundingClientRect();
      const parent = fixture.querySelector('.gf_information').getBoundingClientRect();
      const mark = img.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(name);
      const rects = [...range.getClientRects()];
      const data = {
        size: style.fontSize, weight: style.fontWeight, lineHeight: style.lineHeight,
        tracking: style.letterSpacing, family: style.fontFamily,
        natural: [img.naturalWidth, img.naturalHeight], displayed: [mark.width, mark.height],
        gap: box.left - mark.right, lines: rects.length,
        fits: logo.left >= parent.left - 1 && logo.right <= parent.right + 1 &&
          rects.every(rect => rect.left >= box.left - 1 && rect.right <= box.right + 1)
      };
      fixture.remove();
      return data;
    });
    assert.deepEqual([footerLogo.size, footerLogo.weight, footerLogo.lineHeight], ['18px', '500', '27px']);
    assert.match(footerLogo.family, /Zen Kaku Gothic New/);
    assert.deepEqual(footerLogo.natural, [51, 48]);
    assert.ok(Math.abs(footerLogo.displayed[0] - 51) <= 0.1 && Math.abs(footerLogo.displayed[1] - 48) <= 0.1);
    assert.ok(Math.abs(footerLogo.gap - 12) <= 0.1 && footerLogo.fits, JSON.stringify(footerLogo));
    if (width === 320) assert.ok(footerLogo.lines >= 2);
    report.push({name, width, footerLogo});
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
