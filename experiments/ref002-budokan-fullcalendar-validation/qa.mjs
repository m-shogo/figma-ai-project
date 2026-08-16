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

async function stateSnapshot(page) {
  return page.evaluate(() => ({
    view: window.__ref002Calendar?.view?.type || null,
    uiView: document.documentElement.dataset.calendarUiView || null,
    htmlView: document.documentElement.dataset.calendarView || null,
    month: document.querySelector('.calendar-month')?.textContent.trim() || null,
    tabs: [...document.querySelectorAll('[data-calendar-view]')].map((el) => ({
      view: el.dataset.calendarView,
      selected: el.getAttribute('aria-selected')
    }))
  }));
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

  let evidence = null;
  const interactions = {};
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForFunction(() => document.documentElement.dataset.calendarStatus === 'ready', null, { timeout: 20000 });
    await page.waitForFunction(() => window.__ref002Calendar?.view?.type === 'dayGridMonth', null, { timeout: 10000 });
    await page.waitForFunction(() => document.querySelectorAll('[data-ref002-event="true"]').length >= 18, null, { timeout: 10000 });

    evidence = await page.evaluate(() => {
      const box = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height, bottom: r.bottom + scrollY };
      };
      const weekdayNodes = [...document.querySelectorAll('[data-ref002-weekday]')];
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
        weekdays: weekdayNodes.map((el) => el.textContent.trim()),
        weekdayCodes: weekdayNodes.map((el) => el.dataset.ref002Weekday),
        eventCount: window.__ref002Calendar.getEvents().length,
        mountedEventCount: document.querySelectorAll('[data-ref002-event="true"]').length,
        renderedDates: document.querySelectorAll('[data-ref002-date]').length,
        assetPendingCount: document.querySelectorAll('[data-asset-status="pending"]').length,
        view: window.__ref002Calendar.view.type,
        uiView: document.documentElement.dataset.calendarUiView || null,
        status: document.documentElement.dataset.calendarStatus
      };
    });

    assert(evidence.document.scrollWidth <= evidence.document.clientWidth + 1, `${name}: horizontal overflow ${evidence.document.scrollWidth}/${evidence.document.clientWidth}`);
    assert(evidence.status === 'ready', `${name}: FullCalendar did not initialize`);
    assert(evidence.view === 'dayGridMonth', `${name}: expected dayGridMonth, got ${evidence.view}`);
    assert(evidence.uiView === 'dayGridMonth', `${name}: visual tab state is not dayGridMonth: ${evidence.uiView}`);
    assert(evidence.month === '8月', `${name}: expected 8月, got ${evidence.month}`);
    assert(evidence.weekdays.length === 7, `${name}: expected 7 weekday headers, got ${evidence.weekdays.length}`);
    assert(evidence.weekdayCodes[0] === '1', `${name}: calendar is not Monday-first: ${evidence.weekdayCodes.join(',')}`);
    assert(evidence.eventCount === 18, `${name}: expected 18 FullCalendar Event Objects, got ${evidence.eventCount}`);
    assert(evidence.mountedEventCount >= 18, `${name}: expected rendered event hooks, got ${evidence.mountedEventCount}`);
    assert(evidence.renderedDates >= 30, `${name}: expected rendered date cells, got ${evidence.renderedDates}`);
    assert(evidence.assetPendingCount > 0, `${name}: unresolved Figma image slots were silently treated as resolved`);

    const expectedWidth = name === 'pc' ? { list: 660, calendar: 420 } : { list: 327, calendar: 327 };
    assert(Math.abs(evidence.eventList.width - expectedWidth.list) <= 2, `${name}: event list width ${evidence.eventList.width}`);
    assert(Math.abs(evidence.calendarPanel.width - expectedWidth.calendar) <= 2, `${name}: calendar panel width ${evidence.calendarPanel.width}`);

    await page.locator('[data-calendar-view="listMonth"]').click();
    await page.waitForFunction(() => window.__ref002Calendar?.view?.type === 'listMonth');
    await page.waitForFunction(() => {
      const tab = document.querySelector('[data-calendar-view="listMonth"]');
      return document.documentElement.dataset.calendarUiView === 'listMonth' && tab?.getAttribute('aria-selected') === 'true';
    }, null, { timeout: 5000 });
    const listState = await stateSnapshot(page);
    assert(listState.view === 'listMonth' && listState.uiView === 'listMonth', `${name}: list state mismatch ${JSON.stringify(listState)}`);
    interactions.listToggle = listState;

    await page.locator('[data-calendar-view="dayGridMonth"]').click();
    await page.waitForFunction(() => window.__ref002Calendar?.view?.type === 'dayGridMonth');
    await page.waitForFunction(() => document.documentElement.dataset.calendarUiView === 'dayGridMonth');

    await page.locator('.calendar-prev').click();
    await page.waitForFunction(() => document.querySelector('.calendar-month')?.textContent.trim() === '7月');
    const julyState = await stateSnapshot(page);
    await page.locator('.calendar-next').click();
    await page.waitForFunction(() => document.querySelector('.calendar-month')?.textContent.trim() === '8月');
    const augustState = await stateSnapshot(page);
    interactions.prevNext = { julyState, augustState };

    await page.screenshot({ path: `${outputDir}/${name}-repair-wave-1.png`, fullPage: true });
    results.push({ name, width, height, ok: true, consoleErrors, evidence, interactions });
  } catch (error) {
    const failureState = await stateSnapshot(page).catch(() => null);
    await page.screenshot({ path: `${outputDir}/${name}-failure.png`, fullPage: true }).catch(() => {});
    results.push({ name, width, height, ok: false, consoleErrors, evidence, interactions, failureState, error: String(error) });
    throw error;
  } finally {
    await page.close();
  }
}

let runError = null;
try {
  await runViewport('pc', 1380, 900);
  await runViewport('sp', 375, 844);
} catch (error) {
  runError = error;
} finally {
  await fs.writeFile(`${outputDir}/repair-wave-1-runtime.json`, JSON.stringify({
    generatedAt: new Date().toISOString(),
    evidenceDomain: 'web-page',
    transferScope: 'web-and-library-scoped',
    visualComplete: false,
    visualIncompleteReason: 'Figma image assets remain ASSET_PENDING until materialized with provenance',
    figma: {
      fileKey: 'RfAQQ28V1HGaeIcpgRmQq1',
      structured: { pc: '839:4676', sp: '446:10020' },
      visualTruth: { pc: '2270:4565', sp: '2270:5570' },
      calendar: { pc: '894:19362', sp: '1399:11920' }
    },
    results
  }, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

if (runError) throw runError;
