import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.argv[2] || 'http://127.0.0.1:8772/';
const out = process.argv[3] || '/tmp/ref002-budokan-final';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });

function near(actual, expected, label, tolerance = 0.8) {
  if (Math.abs(actual - expected) > tolerance) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

async function run(name, width, height, expected) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  const runtimeErrors = [];
  page.on('pageerror', e => runtimeErrors.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('html.calendar-ready');
  await page.evaluate(() => document.fonts?.ready);

  const evidence = await page.evaluate(() => {
    const box = selector => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height, bottom: r.bottom + scrollY };
    };
    const visibleCount = selector => [...document.querySelectorAll(selector)].filter(el => {
      const s = getComputedStyle(el); const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    }).length;
    return {
      document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, bodyHeight: document.body.getBoundingClientRect().height },
      sections: {
        header: box('.site-header'), hero: box('.hero'), events: box('.events-section'), sns: box('.sns-strip'), purpose: box('.purpose-section'), about: box('.about-section'), news: box('.news-section'), partner: box('.partner-section'), instagram: box('.instagram-section'), banner: box('.banner-section'), footer: box('.site-footer'), mobileMenu: box('.mobile-purpose-menu')
      },
      pending: document.querySelectorAll('[data-asset-status="pending"]').length,
      aboutVisibleCards: visibleCount('.about-card'),
      partnerItems: document.querySelectorAll('.partner-item').length,
      instagramVisibleThumbs: visibleCount('.instagram-thumb'),
      calendar: {
        ready: document.documentElement.classList.contains('calendar-ready'),
        view: window.__ref002Calendar?.view?.type || null,
        eventCount: window.__ref002Calendar?.getEvents?.().length ?? null
      }
    };
  });

  if (runtimeErrors.length) throw new Error(`${name}: runtime errors: ${runtimeErrors.join(' | ')}`);
  if (evidence.document.scrollWidth > evidence.document.clientWidth + 1) throw new Error(`${name}: horizontal overflow ${evidence.document.scrollWidth} > ${evidence.document.clientWidth}`);
  for (const [key, target] of Object.entries(expected.sections)) {
    const actual = evidence.sections[key];
    if (!actual) throw new Error(`${name}.${key}: missing`);
    near(actual.y, target.y, `${name}.${key}.y`);
    near(actual.height, target.height, `${name}.${key}.height`);
  }
  near(evidence.document.bodyHeight, expected.bodyHeight, `${name}.bodyHeight`, 1.0);
  if (!evidence.calendar.ready || evidence.calendar.view !== 'dayGridMonth' || evidence.calendar.eventCount !== 18) {
    throw new Error(`${name}: FullCalendar final state mismatch ${JSON.stringify(evidence.calendar)}`);
  }
  if (evidence.aboutVisibleCards !== expected.aboutCards) throw new Error(`${name}: about cards ${evidence.aboutVisibleCards}`);
  if (evidence.partnerItems !== 12) throw new Error(`${name}: partner item count ${evidence.partnerItems}`);
  if (evidence.instagramVisibleThumbs !== expected.instagramThumbs) throw new Error(`${name}: instagram thumbs ${evidence.instagramVisibleThumbs}`);

  await page.screenshot({ path: `${out}/${name}-full-page.png`, fullPage: true });
  await page.close();
  return { name, evidence, expected };
}

try {
  const pc = await run('pc', 1380, 1000, {
    bodyHeight: 6181,
    aboutCards: 6,
    instagramThumbs: 5,
    sections: {
      header: { y: 0, height: 100 }, hero: { y: 100, height: 640 }, events: { y: 740, height: 948 }, sns: { y: 1688, height: 200 }, purpose: { y: 1888, height: 808 }, about: { y: 2696, height: 1179 }, news: { y: 3875, height: 652 }, partner: { y: 4530, height: 380 }, instagram: { y: 4910, height: 545 }, banner: { y: 5455, height: 160 }, footer: { y: 5614, height: 567 }
    }
  });
  const sp = await run('sp', 375, 844, {
    bodyHeight: 8360.125,
    aboutCards: 3,
    instagramThumbs: 4,
    sections: {
      header: { y: 0, height: 60 }, hero: { y: 60, height: 518 }, events: { y: 578, height: 1834 }, sns: { y: 2160, height: 252 }, purpose: { y: 2476, height: 1668 }, about: { y: 4144, height: 1053 }, news: { y: 5197, height: 975 }, partner: { y: 6172, height: 781 }, instagram: { y: 6953, height: 684 }, banner: { y: 7637, height: 200 }, footer: { y: 7837, height: 467.125 }, mobileMenu: { y: 8304.125, height: 56 }
    }
  });
  const result = {
    generatedAt: new Date().toISOString(),
    evidenceDomain: 'web-page',
    figma: { fileKey: 'RfAQQ28V1HGaeIcpgRmQq1', pcStructured: '839:4676', spStructured: '446:10020', pcVisualTruth: '2270:4565', spVisualTruth: '2270:5570', spDeviceChromePx: 40 },
    visualComplete: pc.evidence.pending === 0 && sp.evidence.pending === 0,
    assetPending: { pc: pc.evidence.pending, sp: sp.evidence.pending },
    pc, sp
  };
  await fs.writeFile(`${out}/final-runtime-evidence.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
