import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.argv[2] || 'http://127.0.0.1:8772/';
const outputDir = process.argv[3] || '/tmp/ref002-budokan';
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function runViewport(name, width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    reducedMotion: 'reduce'
  });

  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForFunction(() => document.documentElement.dataset.calendarStatus === 'ready', null, { timeout: 20000 });
  await page.waitForSelector('.fc-daygrid', { timeout: 10000 });

  const evidence = await page.evaluate(() => {
    const box = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height, bottom: r.bottom + scrollY };
    };
    const weekdays = [...document.querySelectorAll('.fc-col-header-cell-cushion')].map((el) => el.textContent.trim());
    return {
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight
      },
      header: box('.site-header'),
      hero: box('.hero'),
      eventSection: box('.events-section'),
      eventList: box('.event-list'),
      calendarPanel: box('.calendar-panel'),
      calendar: box('#calendar'),
      month: document.querySelector('.calendar-month')?.textContent.trim(),
      weekdays,
      eventCount: document.querySelectorAll('.fc-event').length,
      view: document.documentElement.dataset.calendarView,
      status: document.documentElement.dataset.calendarStatus
    };
  });

  assert(evidence.document.scrollWidth <= evidence.document.clientWidth + 1, `${name}: horizontal overflow ${evidence.document.scrollWidth}/${evidence.document.clientWidth}`);
  assert(evidence.status === 'ready', `${name}: FullCalendar did not initialize`);
  assert(evidence.month === '8月', `${name}: expected 8月, got ${evidence.month}`);
  assert(evidence.weekdays.length === 7, `${name}: expected 7 weekday headers, got ${evidence.weekdays.length}`);
  assert(evidence.weekdays[0].startsWith('月'), `${name}: calendar is not Monday-first: ${evidence.weekdays.join(',')}`);
  assert(evidence.eventCount >= 18, `${name}: expected at least 18 rendered events, got ${evidence.eventCount}`);

  const expectedWidth = name === 'pc' ? { list: 660, calendar: 420 } : { list: 327, calendar: 327 };
  assert(Math.abs(evidence.eventList.width - expectedWidth.list) <= 2, `${name}: event list width ${evidence.eventList.width}`);
  assert(Math.abs(evidence.calendarPanel.width - expectedWidth.calendar) <= 2, `${name}: calendar panel width ${evidence.calendarPanel.width}`);

  await page.locator('[data-calendar-view="listMonth"]').click();
  await page.waitForSelector('.fc-list', { timeout: 5000 });
  const listView = await page.evaluate(() => ({
    view: document.documentElement.dataset.calendarView,
    selected: document.querySelector('[data-calendar-view="listMonth"]')?.getAttribute('aria-selected')
  }));
  assert(listView.view === 'listMonth' && listView.selected === 'true', `${name}: list view toggle failed`);

  await page.locator('[data-calendar-view="dayGridMonth"]').click();
  await page.waitForSelector('.fc-daygrid', { timeout: 5000 });
  await page.locator('.calendar-prev').click();
  await page.waitForFunction(() => document.querySelector('.calendar-month')?.textContent.trim() === '7月');
  await page.locator('.calendar-next').click();
  await page.waitForFunction(() => document.querySelector('.calendar-month')?.textContent.trim() === '8月');

  await page.screenshot({ path: `${outputDir}/${name}-first-pass.png`, fullPage: true });
  results.push({ name, width, height, consoleErrors, evidence, interactions: { listToggle: true, prevNext: true } });
  await page.close();
}

try {
  await runViewport('pc', 1380, 900);
  await runViewport('sp', 375, 844);
  await fs.writeFile(`${outputDir}/first-pass-runtime.json`, JSON.stringify({
    generatedAt: new Date().toISOString(),
    evidenceDomain: 'web-page',
    transferScope: 'web-and-library-scoped',
    figma: {
      fileKey: 'RfAQQ28V1HGaeIcpgRmQq1',
      structured: { pc: '839:4676', sp: '446:10020' },
      visualTruth: { pc: '2270:4565', sp: '2270:5570' },
      calendar: { pc: '894:19362', sp: '1399:11920' }
    },
    results
  }, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
