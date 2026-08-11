import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:8765/visual-preview/';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1380, height: 900 } });
const responses = new Map();

page.on('response', (response) => {
  responses.set(response.url(), response.status());
});

await page.goto(url, { waitUntil: 'networkidle' });

// Course pictograms sit far below the initial viewport. Scroll the real section
// into view before judging whether the browser loaded/decoded the persisted SVGs.
await page.locator('.ref001-courses').scrollIntoViewIfNeeded();
await page.waitForTimeout(150);

await page.locator('.ref001-course-card__icon img').evaluateAll(async (images) => {
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
      // Report failed dimensions/status below.
    }
  }));
});

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

console.log(JSON.stringify({ coursePictograms: results }, null, 2));

const failures = results.filter(
  (asset) => !asset.complete || asset.naturalWidth <= 0 || asset.naturalHeight <= 0 || asset.status !== 200,
);

// Figma bitmap composites are CSS backgrounds rather than <img> nodes. A prior
// repair proved that geometry and the old <img>-only asset gate can both be green
// while a malformed/empty composite still renders as a blank placeholder. Decode
// each final-group fixture in the browser and inspect pixels so transparent or
// effectively flat images fail closed.
await page.locator('.ref001-student-voice').scrollIntoViewIfNeeded();
await page.waitForTimeout(100);

const compositeResults = await page.locator('[data-figma-composite-node]:not([data-figma-composite-node=""])').evaluateAll(async (elements) => {
  return Promise.all(elements.map(async (element) => {
    const nodeId = element.dataset.figmaCompositeNode || '';
    const backgroundImage = getComputedStyle(element).backgroundImage;
    const match = backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);
    const src = match ? match[1] : '';

    if (!src) {
      return { nodeId, decoded: false, naturalWidth: 0, naturalHeight: 0, visiblePixels: 0, channelRange: 0, reason: 'no-background-url' };
    }

    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let visiblePixels = 0;
          let minChannel = 255;
          let maxChannel = 0;
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] === 0) continue;
            visiblePixels += 1;
            minChannel = Math.min(minChannel, pixels[i], pixels[i + 1], pixels[i + 2]);
            maxChannel = Math.max(maxChannel, pixels[i], pixels[i + 1], pixels[i + 2]);
          }
          resolve({
            nodeId,
            decoded: true,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            visiblePixels,
            channelRange: visiblePixels > 0 ? maxChannel - minChannel : 0,
            reason: null,
          });
        } catch (error) {
          resolve({ nodeId, decoded: false, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, visiblePixels: 0, channelRange: 0, reason: String(error) });
        }
      };
      image.onerror = () => resolve({ nodeId, decoded: false, naturalWidth: 0, naturalHeight: 0, visiblePixels: 0, channelRange: 0, reason: 'decode-error' });
      image.src = src;
    });
  }));
});

console.log(JSON.stringify({ studentVoiceComposites: compositeResults }, null, 2));

const compositeFailures = compositeResults.filter(
  (asset) => !asset.decoded || asset.naturalWidth <= 0 || asset.naturalHeight <= 0 || asset.visiblePixels <= 0 || asset.channelRange < 20,
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

if (compositeResults.length !== 3) {
  console.error(`Expected 3 Student Voice composite fixtures, found ${compositeResults.length}.`);
  process.exit(1);
}

if (compositeFailures.length > 0) {
  console.error(`Student Voice composite decode/pixel failures: ${compositeFailures.length}`);
  process.exit(1);
}
