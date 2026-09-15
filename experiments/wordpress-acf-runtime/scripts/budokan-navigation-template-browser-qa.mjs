import { chromium } from 'playwright';
const url = process.argv[2];
if (!url) process.exit(2);
const near=(a,b,t=1)=>Math.abs(a-b)<=t;
const assert=(c,m)=>{if(!c)throw new Error(m);};
const browser=await chromium.launch({headless:true});
const measure=async(page)=>page.evaluate(()=>{
  const visual=document.querySelector('.global_mainVisual');
  const content=document.querySelector('.global_inner._content._normalPage._navigationPage');
  const main=document.querySelector('.gc_main._oneColumn');
  const wrap=main?.querySelector('.block-editor_wrap');
  const p=wrap?.querySelector('p');
  const bread=document.querySelector('.module_breadCrumb');
  if(!visual||!content||!main||!wrap||!p||!bread)return null;
  const r=e=>{const b=e.getBoundingClientRect();return{top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width};};
  const contentStyle=getComputedStyle(content);
  return {
    visual:r(visual),content:r(content),main:r(main),wrap:r(wrap),p:r(p),bread:r(bread),
    contentPaddingLeft:parseFloat(contentStyle.paddingLeft),
    contentPaddingRight:parseFloat(contentStyle.paddingRight),
    hasSidebar:!!document.querySelector('.gc_sub'),
    hasColumnShell:!!document.querySelector('.global_inner._column'),
    clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,
    innerWidth:window.innerWidth
  };
});
try {
  const pc=await browser.newPage({viewport:{width:1380,height:1000}});
  await pc.goto(url,{waitUntil:'networkidle'});
  const pcd=await measure(pc);
  assert(pcd,'Navigation PC template owner elements missing');
  assert(!pcd.hasSidebar,'Navigation template must not render the default sidebar owner');
  assert(!pcd.hasColumnShell,'Navigation template must not render the default two-column shell');
  assert(pcd.scrollWidth<=pcd.clientWidth+1,`PC horizontal overflow: ${pcd.scrollWidth}/${pcd.clientWidth}`);
  assert(near(pcd.content.top,pcd.visual.bottom),`PC content must start at visual bottom: ${pcd.content.top}/${pcd.visual.bottom}`);
  assert(near(pcd.main.width,960,1),`Navigation PC authored rail expected 960px, got ${pcd.main.width}`);
  assert(near(pcd.p.top-pcd.content.top,64,1),`Navigation PC top inset expected 64px, got ${pcd.p.top-pcd.content.top}`);
  assert(near(pcd.content.bottom-pcd.wrap.bottom,100,1),`Navigation PC bottom inset expected 100px, got ${pcd.content.bottom-pcd.wrap.bottom}`);
  assert(pcd.bread.top>=pcd.content.bottom-1,'PC breadcrumb must follow Navigation content without overlap');
  await pc.close();

  const sp=await browser.newPage({viewport:{width:375,height:812}});
  await sp.goto(url,{waitUntil:'networkidle'});
  const spd=await measure(sp);
  assert(spd,'Navigation SP template owner elements missing');
  assert(!spd.hasSidebar,'Navigation SP template must not render the default sidebar owner');
  assert(!spd.hasColumnShell,'Navigation SP template must not render the default two-column shell');
  assert(spd.scrollWidth<=spd.clientWidth+1,`SP horizontal overflow: ${spd.scrollWidth}/${spd.clientWidth}`);
  assert(near(spd.content.top,spd.visual.bottom),`SP content must start at visual bottom: ${spd.content.top}/${spd.visual.bottom}`);
  assert(near(spd.contentPaddingLeft,24,0.1) && near(spd.contentPaddingRight,24,0.1),`Navigation SP current-Figma inline inset expected 24px/24px, got ${spd.contentPaddingLeft}px/${spd.contentPaddingRight}px`);
  const expectedRail=spd.content.width-spd.contentPaddingLeft-spd.contentPaddingRight;
  assert(near(spd.main.width,expectedRail,1),`Navigation SP authored rail must equal the padded content box (${expectedRail}px); got ${spd.main.width}px. viewport=${spd.innerWidth}px client=${spd.clientWidth}px`);
  assert(near(spd.p.top-spd.content.top,48,1),`Navigation SP top inset expected 48px, got ${spd.p.top-spd.content.top}`);
  assert(near(spd.content.bottom-spd.wrap.bottom,64,1),`Navigation SP bottom inset expected 64px, got ${spd.content.bottom-spd.wrap.bottom}`);
  assert(spd.bread.top>=spd.content.bottom-1,'SP breadcrumb must follow Navigation content without overlap');
  await sp.close();
  console.log('PASS Budokan Navigation template PC/SP owner QA.');
} finally { await browser.close(); }
