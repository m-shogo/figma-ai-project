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
const types={'.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp'};
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
