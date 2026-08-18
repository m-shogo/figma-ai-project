import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.argv[2] || 'http://127.0.0.1:8765/preview.php';
const outPath = process.argv[3] || '/tmp/ref001-v2-typography.json';

const t = (selector, size, lineHeight, letterSpacing = 0.05, weight = 500, extra = {}) => ({
  selector, size, lineHeight, letterSpacing, weight, ...extra,
});

/*
 * Authority is read directly from Figma AI page:
 * PC Top@2x 21384:8173 @ 1380px
 * SP Top_sp@2x 21376:4401 @ 375px
 *
 * Repeated nodes sharing one semantic selector are checked individually. Mixed
 * Figma text runs get explicit selectors instead of being flattened into the
 * dominant style of their parent text node.
 */
const contracts = {
  pc: {
    width: 1380,
    height: 1000,
    checks: [
      t('.ref-header__actions .ref-action', 14, 1),
      t('.ref-mv__quote', 119, 1.6, 0.02, 600),
      t('.ref-mv__hero-main strong', 77, 1.6, 0.02),
      t('.ref-mv__hero-sub', 44, 1.6),
      t('.ref-mv__hero-comma', 44, 1.6, -0.16),
      t('.ref-mv__hero-end', 71, 1.6),
      t('.ref-mv__desc', 20, 2),
      t('.ref-mv__oc-kicker', 14, 1),
      t('.ref-mv__oc b', 32, 1.3, 0.05, 600),
      t('.ref-mv__oc small', 22, 1),

      t('.ref-reason__head .ref-kicker', 20, 1, 0.05, 400),
      t('.ref-reason__title-lead', 30, 1),
      t('.ref-reason__head h2 strong', 42, 1),
      t('.ref-reason__head .ref-bracket-title', 50, 1, 0.05, 500, { pseudo: '::before' }),
      t('.ref-reason__intro', 16, 1.3),
      t('.ref-reason-card__title', 20, 1),
      t('.ref-reason-card__text', 16, 1.6),

      t('.ref-education__title .ref-kicker', 20, 1, 0.05, 400),
      t('.ref-education__title h2', 42, 1),
      t('.ref-education__intro h3', 24, 1),
      t('.ref-education__intro p', 16, 1.6),
      t('.ref-edu-card__number', 22, 1),
      t('.ref-edu-card__phase', 14, 1),
      t('.ref-edu-card h3', 20, 1),
      t('.ref-edu-card:nth-of-type(1) li span, .ref-edu-card:nth-of-type(2) li span, .ref-edu-card:nth-of-type(3) li:nth-child(-n+2) span, .ref-edu-card:nth-of-type(4) li:nth-child(n+2) span', 15, 1),
      t('.ref-edu-card:nth-of-type(3) li:nth-child(3) span', 15, 1, 0.01),
      t('.ref-edu-card:nth-of-type(4) li:nth-child(1) span', 15, 1, 0.01),

      t('.ref-shared-cta h2', 32, 1),
      t('.ref-shared-cta .ref-action', 16, 1),

      t('.ref-voice__head .ref-kicker', 20, 1, 0.05, 400),
      t('.ref-voice__head .ref-bracket-title', 30, 1),
      t('.ref-voice__head .ref-bracket-title strong', 42, 1),
      t('.ref-speech h3', 24, 1),
      t('.ref-speech p', 16, 1.6),
      t('.ref-voice-open__copy>p', 16, 1.6),
      t('.ref-pointbox p', 16, 1),
      t('.ref-pointbox strong', 16, 1),
      t('.ref-voice-open__advice strong', 18, 1),
      t('.ref-voice-open__advice span', 16, 1.6),
      t('.ref-voice-more', 18, 1),

      t('.ref-messages__head .ref-kicker', 20, 1, 0.05, 400),
      t('.ref-messages__head h2 span', 30, 1),
      t('.ref-messages__head h2 strong', 42, 1),
      t('.ref-messages__quote--pc', 28, 2.1),
      t('.ref-messages__profile', 16, 1.6),
      t('.ref-messages__indicator', 24, 1.3),

      t('.ref-courses__head .ref-kicker', 20, 1, 0.05, 400),
      t('.ref-courses__title-line', 30, 1),
      t('.ref-courses__head .ref-bracket-title strong', 42, 1, 0.05, 900),
      t('.ref-course h3', 20, 1),
      t('.ref-course:not(:nth-child(3)):not(:nth-child(7)) .ref-course__desc', 16, 1.3),
      t('.ref-course:nth-child(3) .ref-course__desc', 16, 1.3, 0.03),
      t('.ref-course:nth-child(7) .ref-course__desc', 16, 1.3, 0.03),
      t('.ref-course__rec-label', 14, 1),
      t('.ref-course__rec li', 13, 1),

      t('.ref-link-tile:not(.ref-link-tile--numbers) .ref-link-tile__copy', 22, 1),
      t('.ref-link-tile--numbers .ref-link-tile__copy', 22, 1.4),
      t('.ref-link-tile__numbers-kicker', 18, 1.4),
      t('.ref-link-tile__instagram-copy', 20, 1, 0.05, 400),
      t('.ref-link-tile__instagram-copy small', 14, 1, 0.05, 400),

      t('.ref-cta-value h2', 32, 1),
      t('.ref-cta-value .ref-action', 16, 1),

      t('.ref-footer__address', 16, 1.3),
      t('.ref-footer__related', 16, 1.6),
      t('.ref-footer__copyright', 14, 1, 0.05, 400),
    ],
  },
  sp: {
    width: 375,
    height: 844,
    checks: [
      t('.ref-mv__quote', 100, 1.6, 0.02, 600),
      t('.ref-mv__hero-main strong', 66, 1.6, 0.02),
      t('.ref-mv__hero-sub', 32, 1),
      t('.ref-mv__hero-comma', 32, 1, -0.16),
      t('.ref-mv__hero-end', 60, 1),
      t('.ref-mv__desc', 14, 2, 0),
      t('.ref-mv__oc-kicker', 14, 1),
      t('.ref-mv__oc b', 26, 1.3, 0.05, 600),
      t('.ref-mv__oc small', 16, 1),

      t('.ref-reason__head .ref-kicker', 20, 1, 0.05, 400),
      t('.ref-reason__title-lead', 24, 1.3),
      t('.ref-reason__head h2 strong', 32, 1.3),
      t('.ref-reason__head .ref-bracket-title', 42, 1, 0.05, 500, { pseudo: '::before' }),
      t('.ref-reason__intro', 16, 1.6),
      t('.ref-reason-card__title', 18, 1),
      t('.ref-reason-card__text', 16, 1.6),

      t('.ref-education__title .ref-kicker', 20, 1, 0.05, 400),
      t('.ref-education__title h2', 32, 1),
      t('.ref-education__intro h3', 20, 1),
      t('.ref-education__intro p', 16, 1.6),
      t('.ref-edu-card__number', 22, 1),
      t('.ref-edu-card__phase', 14, 1),
      t('.ref-edu-card:not(:first-of-type) h3', 18, 1.3),
      t('.ref-edu-card:first-of-type h3', 18, 1),
      t('.ref-edu-card li span', 15, 1),

      t('.ref-shared-cta h2', 24, 1.3),
      t('.ref-shared-cta .ref-action', 16, 1),

      t('.ref-voice__head .ref-kicker', 20, 1, 0.05, 400),
      t('.ref-voice__head .ref-bracket-title', 24, 1.3),
      t('.ref-voice__head .ref-bracket-title strong', 32, 1.3),
      t('.ref-speech h3', 16, 1.3),
      t('.ref-speech p', 14, 1.6),
      t('.ref-voice-open__copy>p', 16, 1.6),
      t('.ref-pointbox p', 16, 1.4),
      t('.ref-pointbox strong', 16, 1),
      t('.ref-voice-open__advice strong', 16, 1),
      t('.ref-voice-open__advice span', 16, 1.6),
      t('.ref-voice-more', 18, 1),

      t('.ref-messages__head .ref-kicker', 20, 1, 0.05, 400),
      t('.ref-messages__head h2 span', 24, 1),
      t('.ref-messages__head h2 strong', 32, 1),
      t('.ref-messages__quote--sp', 22, 2),
      t('.ref-messages__profile', 16, 1.6),
      t('.ref-messages__indicator', 20, 1.3),

      t('.ref-courses__head .ref-kicker', 20, 1, 0.05, 400),
      t('.ref-courses__title-line', 24, 1.3),
      t('.ref-courses__head .ref-bracket-title strong', 32, 1.3, 0.05, 900),
      t('.ref-course h3', 20, 1),
      t('.ref-course__desc', 16, 1.3),
      t('.ref-course__rec-label', 14, 1),
      t('.ref-course__rec li', 13, 1.4),

      t('.ref-link-tile:not(.ref-link-tile--numbers) .ref-link-tile__copy', 16, 1),
      t('.ref-link-tile--numbers .ref-link-tile__copy', 16, 1.4),
      t('.ref-link-tile__numbers-kicker', 13, 1.4),
      t('.ref-link-tile__instagram-copy', 16, 1, 0.05, 400),
      t('.ref-link-tile__instagram-copy small', 12, 1, 0.05, 400),

      t('.ref-cta-value h2', 24, 1.3),
      t('.ref-cta-value .ref-action', 16, 1),

      t('.ref-footer__address', 14, 1.3),
      t('.ref-footer__related', 16, 1),
      t('.ref-footer__copyright', 12, 1, 0.05, 400),
    ],
  },
};

const px = value => value === 'normal' ? 0 : Number.parseFloat(value || '0');
const near = (actual, expected, tolerance = 0.06) => Math.abs(actual - expected) <= tolerance;

const browser = await chromium.launch({ headless: true });
const report = { generatedAt: new Date().toISOString(), authority: { pc: '21384:8173', sp: '21376:4401' }, results: {} };
let failed = false;

try {
  for (const [mode, contract] of Object.entries(contracts)) {
    const page = await browser.newPage({ viewport: { width: contract.width, height: contract.height }, deviceScaleFactor: 1, locale: 'ja-JP' });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts?.ready);

    const rows = [];
    for (const check of contract.checks) {
      const values = await page.locator(check.selector).evaluateAll((nodes, expected) => nodes.map((node) => {
        const style = getComputedStyle(node, expected.pseudo || null);
        const visible = style.display !== 'none' && style.visibility !== 'hidden';
        return {
          text: (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100),
          visible,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          fontWeight: style.fontWeight,
          fontFamily: style.fontFamily,
        };
      }), check);

      if (!values.length) {
        failed = true;
        rows.push({ selector: check.selector, pseudo: check.pseudo || null, status: 'MISSING' });
        continue;
      }

      for (const actual of values.filter(row => row.visible || check.pseudo)) {
        const expectedLine = check.size * check.lineHeight;
        const expectedLetter = check.size * check.letterSpacing;
        const errors = [];
        if (!near(px(actual.fontSize), check.size)) errors.push(`font-size ${actual.fontSize} != ${check.size}px`);
        if (!near(px(actual.lineHeight), expectedLine)) errors.push(`line-height ${actual.lineHeight} != ${expectedLine}px`);
        if (!near(px(actual.letterSpacing), expectedLetter)) errors.push(`letter-spacing ${actual.letterSpacing} != ${expectedLetter}px`);
        if (Number(actual.fontWeight) !== check.weight) errors.push(`font-weight ${actual.fontWeight} != ${check.weight}`);
        if (errors.length) failed = true;
        rows.push({ selector: check.selector, pseudo: check.pseudo || null, text: actual.text, expected: { fontSize: check.size, lineHeight: expectedLine, letterSpacing: expectedLetter, fontWeight: check.weight }, actual, status: errors.length ? 'FAIL' : 'PASS', errors });
      }
    }

    report.results[mode] = { viewport: { width: contract.width, height: contract.height }, rows };
    await page.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(outPath, JSON.stringify(report, null, 2));
for (const [mode, result] of Object.entries(report.results)) {
  const failures = result.rows.filter(row => row.status !== 'PASS');
  console.log(`[${mode}] ${result.rows.length - failures.length}/${result.rows.length} typography checks passed`);
  for (const row of failures) console.error(`${row.selector}${row.pseudo || ''}: ${(row.errors || [row.status]).join(' | ')}`);
}
if (failed) process.exit(1);
