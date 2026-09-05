import { chromium } from 'playwright';

const url = process.argv[2];
const phase = process.argv[3];
if (!url || !['geometry', 'paint', 'padding'].includes(phase)) {
  console.error('FAIL usage: node budokan-local-nav-surface-diagnostic.mjs <url> <geometry|paint|padding>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1380, height: 1000 } });
try {
  await page.goto(url, { waitUntil: 'networkidle' });
  const pc = await page.evaluate(() => {
    const nav = document.querySelector('.local_navigation');
    if (!nav) return null;
    const rect = nav.getBoundingClientRect();
    const style = getComputedStyle(nav);
    return {
      left: rect.left,
      width: rect.width,
      height: rect.height,
      background: style.backgroundColor,
      borderTopWidth: style.borderTopWidth,
      borderBottomWidth: style.borderBottomWidth,
      boxShadow: style.boxShadow,
      paddingTop: parseFloat(style.paddingTop),
      paddingRight: parseFloat(style.paddingRight),
      paddingBottom: parseFloat(style.paddingBottom),
      paddingLeft: parseFloat(style.paddingLeft),
    };
  });
  assert(pc, 'PC Local Navigation was not found.');

  if (phase === 'geometry') {
    assert(Math.abs(pc.left) <= 1, `left expected 0px, got ${pc.left}px.`);
    assert(Math.abs(pc.width - 1380) <= 1, `width expected 1380px, got ${pc.width}px.`);
    assert(Math.abs(pc.height - 222) <= 1, `height expected 222px, got ${pc.height}px.`);
  }
  if (phase === 'paint') {
    assert(pc.background === 'rgb(255, 255, 255)', `background expected white, got ${pc.background}.`);
    assert(pc.borderTopWidth === '0px' && pc.borderBottomWidth === '0px', `borders must not add height: top=${pc.borderTopWidth}, bottom=${pc.borderBottomWidth}.`);
    assert(pc.boxShadow.includes('rgb(215, 212, 212)') && pc.boxShadow.includes('inset'), `inset separator mismatch: ${pc.boxShadow}.`);
  }
  if (phase === 'padding') {
    assert(Math.abs(pc.paddingTop - 56) <= 1 && Math.abs(pc.paddingBottom - 56) <= 1, `vertical padding expected 56px, got top=${pc.paddingTop}, bottom=${pc.paddingBottom}.`);
    assert(Math.abs(pc.paddingLeft - 110) <= 1 && Math.abs(pc.paddingRight - 110) <= 1, `horizontal padding expected 110px, got left=${pc.paddingLeft}, right=${pc.paddingRight}.`);
  }

  console.log(`PASS Local Navigation surface ${phase}: ${JSON.stringify(pc)}`);
} finally {
  await browser.close();
}
