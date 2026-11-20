import { chromium } from 'playwright';
const url = process.argv[2];
if (!url) process.exit(2);
const near = (a,b,t=1) => Math.abs(a-b) <= t;
const assert = (c,m) => { if (!c) throw new Error(m); };
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1380,height:1000}});
try {
  await page.goto(url,{waitUntil:'networkidle'});
  const data = await page.evaluate(() => {
    const visual=document.querySelector('.global_mainVisual');
    const content=document.querySelector('.global_inner._content');
    const main=document.querySelector('.gc_main._oneColumn');
    const wrap=main?.querySelector('.block-editor_wrap');
    const p=wrap?.querySelector('p');
    if(!visual||!content||!main||!wrap||!p) return null;
    const r=e=>{const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width};};
    return {visual:r(visual),content:r(content),main:r(main),wrap:r(wrap),p:r(p),clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth};
  });
  assert(data,'one-column owner elements missing');
  assert(data.scrollWidth <= data.clientWidth + 1, `horizontal overflow: ${data.scrollWidth}/${data.clientWidth}`);
  assert(near(data.content.top,data.visual.bottom), `wrapper must start at visual bottom: ${data.content.top}/${data.visual.bottom}`);
  assert(near(data.main.width,960,1), `authored rail expected 960px, got ${data.main.width}`);
  assert(near(data.p.top-data.content.top,64,1), `current Figma one-column/navigation top inset expected 64px, got ${data.p.top-data.content.top}`);
  assert(near(data.content.bottom-data.wrap.bottom,100,1), `current Figma one-column/navigation bottom inset expected 100px, got ${data.content.bottom-data.wrap.bottom}`);
  console.log('PASS Budokan explicit one-column PC content rhythm QA.');
} finally { await browser.close(); }
