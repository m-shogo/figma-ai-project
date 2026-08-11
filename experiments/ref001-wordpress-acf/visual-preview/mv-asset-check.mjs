import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:8765/visual-preview/';

const fixtureSpecs = [
  {
    key: 'pc-left',
    path: '../fixture-theme/assets/images/visual-qa/main-visual/pc-left.b64',
    lineCount: 79,
    lastLineLength: 24,
    base64Length: 6264,
    charCodeSum32: 534386,
    decodedByteLength: 4696,
  },
  {
    key: 'pc-right',
    path: '../fixture-theme/assets/images/visual-qa/main-visual/pc-right.b64',
    lineCount: 81,
    lastLineLength: 28,
    base64Length: 6428,
    charCodeSum32: 548332,
    decodedByteLength: 4819,
  },
  {
    key: 'sp-left',
    path: '../fixture-theme/assets/images/visual-qa/main-visual/sp-left.b64',
    lineCount: 51,
    lastLineLength: 36,
    base64Length: 4036,
    charCodeSum32: 341841,
    decodedByteLength: 3025,
  },
  {
    key: 'sp-right',
    path: '../fixture-theme/assets/images/visual-qa/main-visual/sp-right.b64',
    lineCount: 54,
    lastLineLength: 20,
    base64Length: 4260,
    charCodeSum32: 360173,
    decodedByteLength: 3195,
  },
];

function readFixture(spec) {
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
    lastLineLength: lines.at(-1)?.length ?? 0,
    base64Length: base64.length,
    charCodeSum32,
    decodedByteLength: bytes.length,
    startBytes: [...bytes.subarray(0, 2)],
    endBytes: [...bytes.subarray(-2)],
  };
  const valid =
    lines.length === spec.lineCount &&
    lines.slice(0, -1).every((line) => line.length === 80) &&
    lines.at(-1)?.length === spec.lastLineLength &&
    base64.length === spec.base64Length &&
    charCodeSum32 === spec.charCodeSum32 &&
    bytes.length === spec.decodedByteLength &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes.at(-2) === 255 &&
    bytes.at(-1) === 217;
  return { report, valid };
}

const fixtureChecks = fixtureSpecs.map(readFixture);
console.log(JSON.stringify({ mvCompositeFixtures: fixtureChecks.map(({ report }) => report) }, null, 2));
if (fixtureChecks.some(({ valid }) => !valid)) {
  console.error('Main Visual final-group fixture integrity check failed.');
  process.exit(1);
}

const endpointExpectations = {
  pc: [
    { pc: '21378:8041', sp: '21376:4894', base64Length: 6264 },
    { pc: '21378:8036', sp: '21376:4890', base64Length: 6428 },
  ],
  sp: [
    { pc: '21378:8041', sp: '21376:4894', base64Length: 4036 },
    { pc: '21378:8036', sp: '21376:4890', base64Length: 4260 },
  ],
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1380, height: 900 } });

async function inspectEndpoint(endpoint, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('.ref001-mv').scrollIntoViewIfNeeded();

  const results = await page.locator('.ref001-mv__fixture-composite').evaluateAll(async (pictures) =>
    Promise.all(pictures.map(async (picture) => {
      const image = picture.querySelector('img');
      if (!image) {
        return { decoded: false, reason: 'missing-img' };
      }
      try {
        await image.decode();
        const src = image.currentSrc || image.src;
        const payload = src.includes(',') ? src.slice(src.indexOf(',') + 1) : '';
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
        return {
          decoded: true,
          pcNode: picture.dataset.figmaCompositePc || '',
          spNode: picture.dataset.figmaCompositeSp || '',
          sourceKind: src.startsWith('data:image/jpeg;base64,') ? 'jpeg-data-uri' : 'other',
          base64Length: payload.length,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          visiblePixels,
          channelRange: visiblePixels > 0 ? maxChannel - minChannel : 0,
          reason: null,
        };
      } catch (error) {
        return { decoded: false, reason: String(error) };
      }
    })),
  );

  console.log(JSON.stringify({ [`mv-${endpoint}`]: results }, null, 2));
  const expected = endpointExpectations[endpoint];
  if (results.length !== expected.length) {
    throw new Error(`Expected ${expected.length} MV composites at ${endpoint}, found ${results.length}.`);
  }
  results.forEach((result, index) => {
    const target = expected[index];
    if (
      !result.decoded ||
      result.pcNode !== target.pc ||
      result.spNode !== target.sp ||
      result.sourceKind !== 'jpeg-data-uri' ||
      result.base64Length !== target.base64Length ||
      result.naturalWidth <= 0 ||
      result.naturalHeight <= 0 ||
      result.visiblePixels <= 0 ||
      result.channelRange < 20
    ) {
      throw new Error(`MV ${endpoint} composite ${index + 1} failed decode/source/pixel validation.`);
    }
  });
}

try {
  await inspectEndpoint('pc', 1380);
  await inspectEndpoint('sp', 375);
} finally {
  await browser.close();
}
