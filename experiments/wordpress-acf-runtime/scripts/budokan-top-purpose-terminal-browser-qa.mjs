import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-top-purpose-terminal-browser-qa.mjs <url>');
  process.exit(2);
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const close = (actual, expected, tolerance = 2) => Math.abs(actual - expected) <= tolerance;

const browser = await chromium.launch({ headless: true });
try {
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 900 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(url, { waitUntil: 'networkidle' });

  const sp = await mobilePage.evaluate(() => {
    const footer = document.querySelector('#global_footer');
    const defaultSticky = footer?.querySelector('.gf_sticky');
    const terminal = document.querySelector('.top_purposeMenu');
    const link = terminal?.querySelector('.tpm_link');
    const label = terminal?.querySelector('.tpm_label');
    const target = document.querySelector('#top_guide-01');
    if (!footer || !terminal || !link || !label || !target) return null;
    const terminalRect = terminal.getBoundingClientRect();
    const style = getComputedStyle(terminal);
    const labelStyle = getComputedStyle(label);
    return {
      viewportWidth: document.documentElement.clientWidth,
      viewportHeight: window.innerHeight,
      terminalWidth: terminalRect.width,
      terminalHeight: terminalRect.height,
      terminalTop: terminalRect.top,
      terminalBottom: terminalRect.bottom,
      position: style.position,
      zIndex: parseInt(style.zIndex, 10),
      borderTopWidth: parseFloat(style.borderTopWidth),
      labelSize: parseFloat(labelStyle.fontSize),
      labelLetterSpacing: parseFloat(labelStyle.letterSpacing),
      href: link.getAttribute('href'),
      targetId: target.id,
      followsFooterInDom: terminal.previousElementSibling === footer,
      defaultStickyPresent: Boolean(defaultSticky),
    };
  });

  assert(sp, 'SP purpose sticky elements missing.');
  assert(close(sp.viewportWidth, 375), `SP viewport expected 375px, got ${sp.viewportWidth}.`);
  assert(close(sp.terminalWidth, 375), `SP purpose sticky expected 375px, got ${sp.terminalWidth}.`);
  assert(close(sp.terminalHeight, 56), `SP purpose sticky expected 56px high, got ${sp.terminalHeight}.`);
  assert(sp.position === 'fixed', `SP purpose surface must be sticky/fixed, got ${sp.position}.`);
  assert(close(sp.terminalTop, sp.viewportHeight - 56, 1) && close(sp.terminalBottom, sp.viewportHeight, 1), `SP purpose sticky must pin to viewport bottom; top=${sp.terminalTop}, bottom=${sp.terminalBottom}, viewport=${sp.viewportHeight}.`);
  assert(sp.zIndex >= 80, `SP purpose sticky must own the footer-shortcut layer; z-index=${sp.zIndex}.`);
  assert(sp.followsFooterInDom, 'SP purpose sticky should remain a thin TOP derivative immediately after the Footer master in DOM order.');
  assert(!sp.defaultStickyPresent, 'TOP must not render the generic contact/access footer sticky beneath the purpose sticky.');
  assert(close(sp.borderTopWidth, 1, 0.25), `SP purpose sticky border expected 1px, got ${sp.borderTopWidth}.`);
  assert(close(sp.labelSize, 16, 0.5), `SP purpose sticky label expected 16px, got ${sp.labelSize}.`);
  assert(close(sp.labelLetterSpacing, 0.8, 0.25), `SP purpose sticky tracking expected 0.8px, got ${sp.labelLetterSpacing}.`);
  assert(sp.href === '#top_guide-01' && sp.targetId === 'top_guide-01', `SP purpose sticky must reuse existing purpose master; href=${sp.href}.`);

  await mobilePage.locator('.top_purposeMenu .tpm_link').click();
  await mobilePage.waitForTimeout(450);
  const afterClick = await mobilePage.evaluate(() => {
    const target = document.querySelector('#top_guide-01');
    const header = document.querySelector('#global_header');
    if (!target || !header) return null;
    return {
      scrollY: window.scrollY,
      targetTop: target.getBoundingClientRect().top,
      expectedTop: header.getBoundingClientRect().height + 30,
    };
  });
  assert(afterClick, 'SP purpose target/header missing after sticky click.');
  assert(afterClick.scrollY > 0, `SP purpose sticky click did not move the document; scrollY=${afterClick.scrollY}.`);
  assert(close(afterClick.targetTop, afterClick.expectedTop, 4), `SP purpose sticky should use existing smooth-scroll contract; targetTop=${afterClick.targetTop}, expected=${afterClick.expectedTop}.`);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });
  const pc = await desktopPage.evaluate(() => {
    const terminal = document.querySelector('.top_purposeMenu');
    const guide = document.querySelector('.tm_guide');
    if (!terminal || !guide) return null;
    return {
      terminalDisplay: getComputedStyle(terminal).display,
      guideDisplay: getComputedStyle(guide).display,
    };
  });
  assert(pc, 'PC purpose derivative/master elements missing.');
  assert(pc.terminalDisplay === 'none', `PC purpose sticky derivative must be hidden, got ${pc.terminalDisplay}.`);
  assert(pc.guideDisplay !== 'none', 'PC existing FV purpose-guide master must remain visible.');
  await desktopContext.close();

  console.log('PASS Budokan TOP purpose sticky SP geometry + replacement + interaction QA.');
  console.log('PASS Budokan TOP purpose sticky PC derivative visibility QA.');
} finally {
  await browser.close();
}
