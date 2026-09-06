import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-news-single-rhythm-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 375, height: 1200 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const measurement = await page.evaluate(() => {
    const title = document.querySelector('.module_titleSingle');
    const featured = document.querySelector('.single_featured');
    if (!title || !featured) return null;
    const titleRect = title.getBoundingClientRect();
    const featuredRect = featured.getBoundingClientRect();
    return {
      titleBottom: titleRect.bottom,
      featuredTop: featuredRect.top,
      gap: featuredRect.top - titleRect.bottom,
    };
  });

  assert(measurement, 'SP News detail title/featured surfaces were not found.');
  assert(
    close(measurement.gap, 48),
    `SP title-to-featured rhythm expected current Figma 48px, got ${measurement.gap}px (titleBottom=${measurement.titleBottom}, featuredTop=${measurement.featuredTop}).`,
  );

  await context.close();
  console.log(`PASS Budokan News single SP title-to-featured rhythm: ${measurement.gap}px.`);
} finally {
  await browser.close();
}
