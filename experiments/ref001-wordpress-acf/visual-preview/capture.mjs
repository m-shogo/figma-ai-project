import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:8765/visual-preview/';
const outputDir = process.argv[3] || 'captures';

const captures = [
  { name: 'ref001-pc-1380.png', viewport: { width: 1380, height: 900 } },
  { name: 'ref001-sp-375.png', viewport: { width: 375, height: 844 } },
];

const browser = await chromium.launch({ headless: true });

for (const capture of captures) {
  const page = await browser.newPage({ viewport: capture.viewport });
  await page.goto(url, { waitUntil: 'networkidle' });

  // Full-page screenshots do not guarantee that far-below-the-fold image
  // resources were requested. Walk the document first so the capture reflects
  // what a real user sees after scrolling through the page.
  await page.evaluate(async () => {
    const step = Math.max(400, Math.floor(window.innerHeight * 0.75));
    const bottom = document.documentElement.scrollHeight;
    for (let y = 0; y < bottom; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    window.scrollTo(0, bottom);
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  await page.locator('img').evaluateAll(async (images) => {
    await Promise.all(images.map(async (image) => {
      try {
        if (!image.complete) {
          await new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
          });
        }
        if (image.decode) await image.decode();
      } catch {
        // Asset QA separately reports decode failures; screenshot generation
        // must still complete so the failure is visible in the artifact.
      }
    }));
  });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${outputDir}/${capture.name}`,
    fullPage: true,
  });
  await page.close();
}

await browser.close();
