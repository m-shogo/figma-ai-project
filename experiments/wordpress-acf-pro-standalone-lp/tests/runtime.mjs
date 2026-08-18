import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.resolve(testDir, '..');
const dependencyPackage = process.env.QA_DEPENDENCY_PACKAGE || path.join(fixtureRoot, '.runtime', 'playwright', 'package.json');
const runtimeRequire = createRequire(dependencyPackage);
const { chromium } = runtimeRequire('playwright');

const url = process.env.WP_URL || 'http://127.0.0.1:8088/';
const caseName = process.env.QA_CASE || 'unknown';
const fixturePath = process.env.QA_FIXTURE_PATH || path.resolve('fixtures', `${caseName}.json`);
const output = process.env.QA_OUTPUT || path.resolve('.runtime/qa', caseName);
const viewports = process.env.QA_VIEWPORTS
  ? JSON.parse(process.env.QA_VIEWPORTS)
  : [
      { name: 'sp-390', width: 390, height: 844 },
      { name: 'boundary-768', width: 768, height: 1024 },
      { name: 'pc-1440', width: 1440, height: 1000 },
    ];

const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const expectedCards = fixture.fields?.cards || [];
const expectedCardTitles = expectedCards.map((card) => card.title || '');
const expectedPlaceholderCount = expectedCards.filter((card) => card.image == null).length;
const expectedImageCount = expectedCards.length - expectedPlaceholderCount;
const expectedHeroTitle = fixture.fields?.hero_title || '';

fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
let failed = false;

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto(url, { waitUntil: 'networkidle' });
  const status = response?.status() ?? 0;
  await page.locator('main[data-fixture-id]').waitFor();
  const renderedFixture = await page.locator('main[data-fixture-id]').getAttribute('data-fixture-id');

  const imageLocators = await page.locator('.lp-card__image').all();
  for (const image of imageLocators) {
    await image.scrollIntoViewIfNeeded();
  }
  if (imageLocators.length) {
    await page.waitForLoadState('networkidle');
  }

  const rendered = await page.evaluate(() => {
    const root = document.documentElement;
    const readable = [...document.querySelectorAll('[data-qa-readable]')];
    const clipped = readable.filter((element) => {
      const style = getComputedStyle(element);
      const constrained = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflow) || ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY);
      return constrained && element.scrollHeight > element.clientHeight + 1;
    }).map((element) => element.textContent?.trim().slice(0, 80) || element.tagName);
    const images = [...document.querySelectorAll('.lp-card__image')].map((image) => ({
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      aspect: image.naturalWidth > image.naturalHeight
        ? 'landscape'
        : image.naturalWidth < image.naturalHeight
          ? 'portrait'
          : 'square',
    }));
    return {
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      clippedReadableText: clipped,
      cardCount: document.querySelectorAll('.lp-card').length,
      cardTitles: [...document.querySelectorAll('.lp-card h3')].map((element) => element.textContent?.trim() || ''),
      placeholderCount: document.querySelectorAll('.lp-card__placeholder').length,
      heroTitle: document.querySelector('#lp-hero-title')?.textContent?.trim() || '',
      images,
    };
  });

  const aspectKinds = new Set(rendered.images.map((image) => image.aspect));
  const mutationMatches = {
    cardCount: rendered.cardCount === expectedCards.length,
    cardOrderAndTitles: JSON.stringify(rendered.cardTitles) === JSON.stringify(expectedCardTitles),
    placeholderCount: rendered.placeholderCount === expectedPlaceholderCount,
    heroTitle: rendered.heroTitle === expectedHeroTitle,
    imageCount: rendered.images.length === expectedImageCount,
    imageIntegrity: rendered.images.every((image) => image.complete && image.naturalWidth >= 64 && image.naturalHeight >= 64),
    baselineAspectCoverage: caseName !== 'figma-baseline' || ['landscape', 'portrait', 'square'].every((aspect) => aspectKinds.has(aspect)),
  };

  const screenshot = path.join(output, `${viewport.name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  results.push({
    viewport,
    status,
    renderedFixture,
    consoleErrors,
    pageErrors,
    rendered,
    expected: {
      cardCount: expectedCards.length,
      cardTitles: expectedCardTitles,
      placeholderCount: expectedPlaceholderCount,
      imageCount: expectedImageCount,
      heroTitle: expectedHeroTitle,
    },
    mutationMatches,
    screenshot,
  });

  if (
    status >= 400 ||
    renderedFixture !== caseName ||
    consoleErrors.length ||
    pageErrors.length ||
    rendered.horizontalOverflow ||
    rendered.clippedReadableText.length ||
    Object.values(mutationMatches).some((matches) => !matches)
  ) {
    failed = true;
  }
  await page.close();
}

await browser.close();
fs.writeFileSync(path.join(output, 'runtime.json'), JSON.stringify({ caseName, fixturePath, url, results }, null, 2));
if (failed) {
  console.error(`FAIL runtime QA or CMS mutation verification: ${caseName}`);
  process.exit(1);
}
console.log(`PASS runtime QA + CMS mutation verification: ${caseName}`);
