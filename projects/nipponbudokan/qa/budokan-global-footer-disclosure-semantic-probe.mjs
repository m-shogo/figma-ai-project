import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-global-footer-disclosure-semantic-probe.mjs <url>');
  process.exit(2);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  const state = await page.evaluate(() => {
    const globalItem = document.querySelector('#global_navigation [class*="gnl_item"]._hasChild');
    const globalButton = document.querySelector('#global_navigation [class*="gnl_item"]._hasChild > [class*="gnl_title"] > [class*="gnl_button"]');
    const footerItem = document.querySelector('#global_footer [class*="gfl_item"]._hasChild');
    const footerButton = document.querySelector('#global_footer [class*="gfl_item"]._hasChild [class*="gfl_button"]');
    return {
      globalExists: Boolean(globalItem && globalButton),
      globalDataOpen: globalItem?.getAttribute('data-open') ?? null,
      globalAriaExpanded: globalButton?.getAttribute('aria-expanded') ?? null,
      footerExists: Boolean(footerItem && footerButton),
      footerDataOpen: footerItem?.getAttribute('data-open') ?? null,
      footerAriaExpanded: footerButton?.getAttribute('aria-expanded') ?? null,
    };
  });

  console.log(`PROBE global exists=${state.globalExists} data-open=${state.globalDataOpen} aria-expanded=${state.globalAriaExpanded}`);
  console.log(`PROBE footer exists=${state.footerExists} data-open=${state.footerDataOpen} aria-expanded=${state.footerAriaExpanded}`);

  if (!state.globalExists || !state.footerExists) {
    throw new Error(`WordPress Walker disclosure fixture missing: ${JSON.stringify(state)}`);
  }
  const failures = [];
  if (state.globalAriaExpanded !== 'false') failures.push(`global aria-expanded=${state.globalAriaExpanded}`);
  if (state.footerAriaExpanded !== 'false') failures.push(`footer aria-expanded=${state.footerAriaExpanded}`);
  if (failures.length) {
    throw new Error(`Global/Footer WordPress disclosure semantics mismatch: ${failures.join(' | ')}`);
  }

  console.log('PASS Budokan Global/Footer disclosure semantic baseline probe');
} finally {
  await browser.close();
}
