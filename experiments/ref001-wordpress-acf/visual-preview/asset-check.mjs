import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:8765/visual-preview/';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1380, height: 900 } });
const responses = new Map();

page.on('response', (response) => {
  responses.set(response.url(), response.status());
});

await page.goto(url, { waitUntil: 'networkidle' });

const assets = await page.locator('.ref001-course-card__icon img').evaluateAll((images) =>
  images.map((image) => ({
    src: image.currentSrc || image.src,
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
  })),
);

const results = assets.map((asset) => ({
  ...asset,
  status: responses.get(asset.src) ?? null,
}));

console.log(JSON.stringify(results, null, 2));

const failures = results.filter(
  (asset) => !asset.complete || asset.naturalWidth <= 0 || asset.naturalHeight <= 0 || asset.status !== 200,
);

await browser.close();

if (results.length !== 7) {
  console.error(`Expected 7 Course pictogram images, found ${results.length}.`);
  process.exit(1);
}

if (failures.length > 0) {
  console.error(`Course pictogram load failures: ${failures.length}`);
  process.exit(1);
}
