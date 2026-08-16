import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.argv[2] || 'http://127.0.0.1:8772/';
const outputDir = process.argv[3] || '/tmp/ref002-budokan';
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

function assertNear(actual, expected, label, tolerance = 0.5) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected}, got ${actual} (${actual - expected >= 0 ? '+' : ''}${(actual - expected).toFixed(3)}px)`);
  }
}

async function measure(name, width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    reducedMotion: 'reduce'
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForFunction(() => document.documentElement.dataset.calendarStatus === 'ready');
  await page.evaluate(() => document.fonts?.ready);

  const result = await page.evaluate(() => {
    const box = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: r.x + scrollX,
        y: r.y + scrollY,
        width: r.width,
        height: r.height,
        bottom: r.bottom + scrollY
      };
    };
    return {
      document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
      hero: box('.hero'),
      events: box('.events-section'),
      eventList: box('.event-list'),
      calendar: box('.calendar-panel'),
      sns: box('.sns-strip'),
      purpose: box('.purpose-section'),
      purposeCards: box('.purpose-cards'),
      purposeCard: box('.purpose-card'),
      assetPendingCount: document.querySelectorAll('[data-asset-status="pending"]').length
    };
  });

  if (result.document.scrollWidth > result.document.clientWidth + 1) {
    throw new Error(`${name}: horizontal overflow ${result.document.scrollWidth}/${result.document.clientWidth}`);
  }

  const authority = name === 'pc'
    ? {
        hero: { y: 100, height: 640 },
        events: { y: 740, height: 948 },
        eventList: { y: 944, width: 660, height: 744 },
        calendar: { y: 944, width: 420, height: 706 },
        sns: { y: 1688, width: 1380, height: 200 },
        purpose: { y: 1888, width: 1380, height: 808 },
        purposeCards: { y: 2135, width: 1056 },
        purposeCard: { width: 352 }
      }
    : {
        // Structured SP Figma coordinates minus the 40px status/device chrome.
        hero: { y: 60, height: 518 },
        events: { y: 578, height: 1834 },
        eventList: { y: 734, width: 327, height: 656 },
        calendar: { y: 1446, width: 327, height: 674 },
        sns: { y: 2160, width: 327, height: 252 },
        purpose: { y: 2476, width: 375, height: 1668 },
        purposeCards: { y: 2877, width: 311 },
        purposeCard: { width: 311 }
      };

  const deltas = {};
  for (const [key, expected] of Object.entries(authority)) {
    const actual = result[key];
    if (!actual) throw new Error(`${name}: missing ${key}`);
    deltas[key] = {};
    for (const [property, expectedValue] of Object.entries(expected)) {
      const actualValue = actual[property];
      assertNear(actualValue, expectedValue, `${name}.${key}.${property}`);
      deltas[key][property] = actualValue - expectedValue;
    }
  }

  if (result.assetPendingCount < 8) {
    throw new Error(`${name}: expected unresolved image slots to remain explicit after Purpose wave, got ${result.assetPendingCount}`);
  }

  await page.screenshot({ path: `${outputDir}/${name}-repair-wave-2.png`, fullPage: true });
  await page.close();
  return { name, width, height, result, authority, deltas };
}

try {
  const pc = await measure('pc', 1380, 900);
  const sp = await measure('sp', 375, 844);
  const evidence = {
    generatedAt: new Date().toISOString(),
    evidenceDomain: 'web-page',
    repair: {
      hypothesis: 'SP downstream +40px offset comes from device/status chrome being retained in the hero wrapper height',
      owner: '.hero@SP',
      before: { heroHeightPx: 558, downstreamOffsetPx: 40 },
      after: { heroHeightPx: 518, expectedDownstreamOffsetPx: 0 },
      antiPatternAvoided: 'do not subtract 40px independently from every downstream section'
    },
    pc,
    sp
  };
  await fs.writeFile(`${outputDir}/repair-wave-2-coordinate-evidence.json`, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
