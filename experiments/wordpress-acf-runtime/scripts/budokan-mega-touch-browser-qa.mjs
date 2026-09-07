import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) throw new Error('Usage: node budokan-mega-touch-browser-qa.mjs <url>');
// Run headed under Xvfb in CI so Chromium uses its desktop scrollbar geometry.
// Headless Chromium uses overlay-style viewport metrics and cannot reproduce the
// clientWidth < innerWidth condition this boundary audit needs.
const browser = await chromium.launch({ headless: false, args: ['--disable-features=OverlayScrollbar'] });
const context = await browser.newContext({ viewport: { width: 1395, height: 900 }, hasTouch: true, isMobile: false });
const page = await context.newPage();

const near = (a,b,t=1) => Math.abs(a-b) <= t;
const rect = async (loc) => loc.evaluate(el => { const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}; });
const snapshot = async () => page.evaluate(() => {
  const header=document.querySelector('#global_header');
  const main=document.querySelector('main') || document.querySelector('#main') || document.querySelector('.contents');
  const h=header?.getBoundingClientRect(); const m=main?.getBoundingClientRect();
  return { scrollX:window.scrollX, scrollY:window.scrollY, innerWidth:window.innerWidth,
    docWidth:document.documentElement.scrollWidth,
    header:h?{x:h.x,y:h.y,width:h.width,height:h.height}:null,
    main:m?{x:m.x,y:m.y,width:m.width,height:m.height}:null };
});
const assertStable = (before, after, label) => {
  for (const k of ['scrollX','scrollY','innerWidth','docWidth']) if (!near(before[k],after[k])) throw new Error(`${label}: ${k} moved ${before[k]} -> ${after[k]}`);
  for (const owner of ['header','main']) if (before[owner] && after[owner]) for (const k of ['x','y','width','height']) if (!near(before[owner][k],after[owner][k])) throw new Error(`${label}: ${owner}.${k} moved ${before[owner][k]} -> ${after[owner][k]}`);
};
const touchCenter = async (loc) => { const r=await rect(loc); await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2); };
const hitOwns = async (loc) => loc.evaluate(el => { const r=el.getBoundingClientRect(); const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); return !!hit && (hit===el || el.contains(hit)); });

try {
  await page.goto(url,{waitUntil:'networkidle'});
  const items=page.locator('.global_header .gn_mega [class*="gnl_item"]._hasChild');
  if (await items.count() < 2) throw new Error('Need two real mega-nav parent items.');
  const first=items.nth(0), second=items.nth(1);
  const firstTitle=first.locator(':scope > [class*="gnl_title"]');
  const firstButton=first.locator(':scope > [class*="gnl_title"] > [class*="gnl_button"]');
  const secondTitle=second.locator(':scope > [class*="gnl_title"]');
  const secondButton=second.locator(':scope > [class*="gnl_title"] > [class*="gnl_button"]');
  if (!(await hitOwns(firstTitle))) throw new Error('First mega parent row is pointer-intercepted before open.');
  if ((await firstButton.getAttribute('aria-expanded')) !== 'false') throw new Error('First mega initial aria-expanded must be false.');

  const before=await snapshot();
  await touchCenter(firstTitle);
  await page.waitForTimeout(50);
  if (!(await first.evaluate(el=>el.classList.contains('_touchOpen')))) throw new Error('First touch did not open first mega parent.');
  if ((await firstButton.getAttribute('aria-expanded')) !== 'true') throw new Error('Visible touch-open mega must expose aria-expanded=true.');
  assertStable(before,await snapshot(),'first touch open');

  await touchCenter(secondTitle); await page.waitForTimeout(50);
  if (await first.evaluate(el=>el.classList.contains('_touchOpen'))) throw new Error('Opening second mega did not close first.');
  if (!(await second.evaluate(el=>el.classList.contains('_touchOpen')))) throw new Error('Second mega did not open.');
  if ((await firstButton.getAttribute('aria-expanded')) !== 'false' || (await secondButton.getAttribute('aria-expanded')) !== 'true') throw new Error('Sibling switch ARIA is stale.');

  await page.touchscreen.tap(20,700); await page.waitForTimeout(50);
  if (await second.evaluate(el=>el.classList.contains('_touchOpen'))) throw new Error('Outside touch did not close mega.');
  if ((await secondButton.getAttribute('aria-expanded')) !== 'false') throw new Error('Outside close left stale aria-expanded.');

  await touchCenter(firstTitle); await page.waitForTimeout(50);
  if ((await firstButton.getAttribute('aria-expanded')) !== 'true') throw new Error('Reopen did not restore aria-expanded=true.');
  await page.setViewportSize({width:767,height:900}); await page.waitForTimeout(100);
  if (await first.evaluate(el=>el.classList.contains('_touchOpen'))) throw new Error('Breakpoint crossing left _touchOpen stale.');
  if ((await firstButton.getAttribute('aria-expanded')) !== 'false') throw new Error('Breakpoint crossing left aria-expanded stale.');
  if (await page.evaluate(()=>document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) throw new Error('Horizontal overflow after breakpoint crossing.');

  // Classic scrollbars can make layout/client width narrower than innerWidth.
  // The authoritative question is the CSS media query itself, not an assumed
  // relationship between viewport metrics. Only call this a defect if CSS
  // remains on its min-width:768px side while JS projects SP/cleans PC state.
  await page.setViewportSize({width:790,height:900});
  await page.evaluate(() => {
    document.documentElement.style.overflowY='scroll';
    document.body.style.minHeight='1800px';
  });
  await page.waitForTimeout(100);
  const gutterBefore=await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    jqueryWidth: window.jQuery ? window.jQuery(window).width() : null,
    cssPc: window.matchMedia('(min-width: 768px)').matches,
    htmlClass: document.documentElement.className,
  }));
  if (!(gutterBefore.clientWidth < gutterBefore.innerWidth)) throw new Error(`QA environment did not reserve a classic scrollbar gutter: ${JSON.stringify(gutterBefore)}`);
  if (!gutterBefore.cssPc) throw new Error(`Expected authoritative CSS PC state before gutter resize: ${JSON.stringify(gutterBefore)}`);
  if (!(await hitOwns(firstTitle))) throw new Error('Mega parent row is pointer-intercepted before scrollbar breakpoint audit.');
  await touchCenter(firstTitle); await page.waitForTimeout(50);
  if (!(await first.evaluate(el=>el.classList.contains('_touchOpen')))) throw new Error('Mega did not open before scrollbar breakpoint audit.');

  await page.setViewportSize({width:780,height:900}); await page.waitForTimeout(100);
  const gutterAfter=await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    jqueryWidth: window.jQuery ? window.jQuery(window).width() : null,
    cssPc: window.matchMedia('(min-width: 768px)').matches,
    htmlClass: document.documentElement.className,
  }));
  if (!gutterAfter.cssPc) throw new Error(`Authoritative CSS crossed to SP; this is not a scrollbar-only JS disagreement: ${JSON.stringify({gutterBefore,gutterAfter})}`);
  if (await first.evaluate(el=>!el.classList.contains('_touchOpen'))) throw new Error(`JS closed a PC touch mega while CSS remained PC: ${JSON.stringify({gutterBefore,gutterAfter})}`);
  if ((await firstButton.getAttribute('aria-expanded')) !== 'true') throw new Error('Scrollbar-only width delta left touch mega aria-expanded stale.');
  if (await page.evaluate(()=>document.documentElement.classList.contains('_sp'))) throw new Error(`JS projected SP state while authoritative CSS remained PC: ${JSON.stringify(gutterAfter)}`);
  if (await page.evaluate(()=>document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) throw new Error('Horizontal overflow during scrollbar breakpoint audit.');

  console.log('PASS Budokan PC touch Mega interaction stability');
} finally { await context.close(); await browser.close(); }
