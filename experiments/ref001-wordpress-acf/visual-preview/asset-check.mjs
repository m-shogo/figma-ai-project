import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:8765/visual-preview/';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const PNG_IEND = [73, 69, 78, 68, 174, 66, 96, 130];

function readChunkedFixture(spec) {
  const fixtureUrl = new URL(spec.path, import.meta.url);
  const text = readFileSync(fixtureUrl, 'utf8').trim();
  const lines = text.split(/\r?\n/);
  const base64 = lines.join('');
  let charCodeSum32 = 0;
  for (const character of base64) {
    charCodeSum32 = (charCodeSum32 + character.charCodeAt(0)) >>> 0;
  }

  const bytes = Buffer.from(base64, 'base64');
  const report = {
    key: spec.key,
    lineCount: lines.length,
    lineLengths: lines.map((line) => line.length),
    base64Length: base64.length,
    charCodeSum32,
    decodedByteLength: bytes.length,
    startBytes: [...bytes.subarray(0, spec.startBytes.length)],
    endBytes: [...bytes.subarray(-spec.endBytes.length)],
    width: spec.format === 'png' && bytes.length >= 24 ? bytes.readUInt32BE(16) : null,
    height: spec.format === 'png' && bytes.length >= 24 ? bytes.readUInt32BE(20) : null,
  };

  const expectedFullLineCount = spec.lineCount - 1;
  const valid =
    lines.length === spec.lineCount &&
    lines.slice(0, expectedFullLineCount).every((line) => line.length === 80) &&
    lines.at(-1)?.length === spec.lastLineLength &&
    base64.length === spec.base64Length &&
    charCodeSum32 === spec.charCodeSum32 &&
    bytes.length === spec.decodedByteLength &&
    report.startBytes.every((value, index) => value === spec.startBytes[index]) &&
    report.endBytes.every((value, index) => value === spec.endBytes[index]) &&
    (spec.width === undefined || report.width === spec.width) &&
    (spec.height === undefined || report.height === spec.height);

  return { report, valid };
}

const fixtureSpecs = [
  {
    key: 'student-voice-classroom',
    path: '../fixture-theme/assets/images/visual-qa/student-voice/classroom-mask-group.b64',
    format: 'jpeg',
    lineCount: 30,
    lastLineLength: 40,
    base64Length: 2360,
    charCodeSum32: 197156,
    decodedByteLength: 1770,
    startBytes: [255, 216],
    endBytes: [255, 217],
  },
  {
    key: 'messages-mask-group',
    path: '../fixture-theme/assets/images/visual-qa/messages/messages-mask-group.b64',
    format: 'jpeg',
    lineCount: 1,
    lastLineLength: 15440,
    base64Length: 15440,
    charCodeSum32: 1332210,
    decodedByteLength: 11579,
    startBytes: [255, 216],
    endBytes: [255, 217],
  },
  {
    key: 'cta-value-pc-left',
    path: '../fixture-theme/assets/images/visual-qa/cta-value/pc-left.b64',
    format: 'png',
    lineCount: 69,
    lastLineLength: 4,
    base64Length: 5444,
    charCodeSum32: 465102,
    decodedByteLength: 4083,
    startBytes: PNG_SIGNATURE,
    endBytes: PNG_IEND,
    width: 42,
    height: 45,
  },
  {
    key: 'cta-value-pc-right',
    path: '../fixture-theme/assets/images/visual-qa/cta-value/pc-right.b64',
    format: 'png',
    lineCount: 63,
    lastLineLength: 56,
    base64Length: 5016,
    charCodeSum32: 428323,
    decodedByteLength: 3760,
    startBytes: PNG_SIGNATURE,
    endBytes: PNG_IEND,
    width: 51,
    height: 44,
  },
  {
    key: 'cta-value-sp-left',
    path: '../fixture-theme/assets/images/visual-qa/cta-value/sp-left.b64',
    format: 'png',
    lineCount: 56,
    lastLineLength: 16,
    base64Length: 4416,
    charCodeSum32: 379624,
    decodedByteLength: 3311,
    startBytes: PNG_SIGNATURE,
    endBytes: PNG_IEND,
    width: 35,
    height: 44,
  },
  {
    key: 'cta-value-sp-right',
    path: '../fixture-theme/assets/images/visual-qa/cta-value/sp-right.b64',
    format: 'png',
    lineCount: 52,
    lastLineLength: 32,
    base64Length: 4112,
    charCodeSum32: 351477,
    decodedByteLength: 3082,
    startBytes: PNG_SIGNATURE,
    endBytes: PNG_IEND,
    width: 33,
    height: 42,
  },
];

const fixtureChecks = fixtureSpecs.map(readChunkedFixture);
console.log(JSON.stringify({ chunkedCompositeFixtures: fixtureChecks.map(({ report }) => report) }, null, 2));

const invalidFixtures = fixtureChecks.filter(({ valid }) => !valid);
if (invalidFixtures.length > 0) {
  console.error(`Chunked composite fixture integrity failures: ${invalidFixtures.length}`);
  process.exit(1);
}

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

const courseAssets = await page.locator('.ref001-course-card__icon img').evaluateAll((images) =>
  images.map((image) => ({
    src: image.currentSrc || image.src,
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
  })),
);

const courseResults = courseAssets.map((asset) => ({
  ...asset,
  status: responses.get(asset.src) ?? null,
}));
console.log(JSON.stringify({ coursePictograms: courseResults }, null, 2));

const courseFailures = courseResults.filter(
  (asset) => !asset.complete || asset.naturalWidth <= 0 || asset.naturalHeight <= 0 || asset.status !== 200,
);

async function inspectBackgroundPixels(selector, nodeAttribute) {
  return page.locator(selector).evaluateAll(async (elements, attribute) => {
    return Promise.all(elements.map(async (element) => {
      const nodeId = element.getAttribute(attribute) || '';
      const backgroundImage = getComputedStyle(element).backgroundImage;
      const match = backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);
      const src = match ? match[1] : '';

      if (!src) {
        return {
          nodeId,
          decoded: false,
          naturalWidth: 0,
          naturalHeight: 0,
          visiblePixels: 0,
          channelRange: 0,
          reason: 'no-background-url',
        };
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
            for (let index = 0; index < pixels.length; index += 4) {
              if (pixels[index + 3] === 0) continue;
              visiblePixels += 1;
              minChannel = Math.min(minChannel, pixels[index], pixels[index + 1], pixels[index + 2]);
              maxChannel = Math.max(maxChannel, pixels[index], pixels[index + 1], pixels[index + 2]);
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
            resolve({
              nodeId,
              decoded: false,
              naturalWidth: image.naturalWidth,
              naturalHeight: image.naturalHeight,
              visiblePixels: 0,
              channelRange: 0,
              reason: String(error),
            });
          }
        };
        image.onerror = () => resolve({
          nodeId,
          decoded: false,
          naturalWidth: 0,
          naturalHeight: 0,
          visiblePixels: 0,
          channelRange: 0,
          reason: 'decode-error',
        });
        image.src = src;
      });
    }));
  }, nodeAttribute);
}

await page.locator('.ref001-student-voice').scrollIntoViewIfNeeded();
await page.waitForTimeout(100);
const studentVoiceResults = await inspectBackgroundPixels(
  '.ref001-student-voice [data-figma-composite-node]:not([data-figma-composite-node=""])',
  'data-figma-composite-node',
);
console.log(JSON.stringify({ studentVoiceComposites: studentVoiceResults }, null, 2));

const studentVoiceFailures = studentVoiceResults.filter(
  (asset) => !asset.decoded || asset.naturalWidth <= 0 || asset.naturalHeight <= 0 || asset.visiblePixels <= 0 || asset.channelRange < 20,
);

await page.locator('.ref001-messages').scrollIntoViewIfNeeded();
await page.waitForTimeout(100);
const messagesResults = await inspectBackgroundPixels(
  '.ref001-messages__image[data-figma-composite-node]',
  'data-figma-composite-node',
);
console.log(JSON.stringify({ messagesComposite: messagesResults }, null, 2));
const messagesFailures = messagesResults.filter(
  (asset) => !asset.decoded || asset.naturalWidth < 80 || asset.naturalHeight < 50 || asset.visiblePixels <= 0 || asset.channelRange < 20,
);

await page.locator('.ref001-cta-value').scrollIntoViewIfNeeded();
await page.waitForTimeout(100);
const ctaPcResults = await inspectBackgroundPixels(
  '.ref001-cta-value__person',
  'data-figma-composite-pc',
);
console.log(JSON.stringify({ ctaValuePcComposites: ctaPcResults }, null, 2));
const ctaPcFailures = ctaPcResults.filter(
  (asset) => !asset.decoded || asset.naturalWidth <= 0 || asset.naturalHeight <= 0 || asset.visiblePixels <= 0 || asset.channelRange < 20,
);

await page.setViewportSize({ width: 375, height: 900 });
await page.reload({ waitUntil: 'networkidle' });
await page.locator('.ref001-cta-value').scrollIntoViewIfNeeded();
await page.waitForTimeout(100);
const ctaSpResults = await inspectBackgroundPixels(
  '.ref001-cta-value__person',
  'data-figma-composite-sp',
);
console.log(JSON.stringify({ ctaValueSpComposites: ctaSpResults }, null, 2));
const ctaSpFailures = ctaSpResults.filter(
  (asset) => !asset.decoded || asset.naturalWidth <= 0 || asset.naturalHeight <= 0 || asset.visiblePixels <= 0 || asset.channelRange < 20,
);

await browser.close();

if (courseResults.length !== 7) {
  console.error(`Expected 7 Course pictogram images, found ${courseResults.length}.`);
  process.exit(1);
}

if (courseFailures.length > 0) {
  console.error(`Course pictogram load failures: ${courseFailures.length}`);
  process.exit(1);
}

if (studentVoiceResults.length !== 3) {
  console.error(`Expected 3 Student Voice composite fixtures, found ${studentVoiceResults.length}.`);
  process.exit(1);
}

if (studentVoiceFailures.length > 0) {
  console.error(`Student Voice composite decode/pixel failures: ${studentVoiceFailures.length}`);
  process.exit(1);
}

if (messagesResults.length !== 1) {
  console.error(`Expected 1 Messages composite fixture, found ${messagesResults.length}.`);
  process.exit(1);
}

if (messagesFailures.length > 0) {
  console.error(`Messages composite decode/pixel failures: ${messagesFailures.length}`);
  process.exit(1);
}

if (ctaPcResults.length !== 2 || ctaSpResults.length !== 2) {
  console.error(`Expected 2 CTA Value composites per endpoint, found PC=${ctaPcResults.length}, SP=${ctaSpResults.length}.`);
  process.exit(1);
}

if (ctaPcFailures.length > 0 || ctaSpFailures.length > 0) {
  console.error(`CTA Value composite decode/pixel failures: PC=${ctaPcFailures.length}, SP=${ctaSpFailures.length}`);
  process.exit(1);
}
