import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

// Cover the authored SP/PC contract without reviving a retired intermediate
// desktop breakpoint. 767/768 are the only responsive boundary endpoints;
// 320/375 and 1024/1380 remain broad content-stress coverage within each mode.
const widths = [320, 375, 767, 768, 1024, 1380];
const outDir = process.env.REF001_STRESS_DIR || path.resolve('experiments/ref001-blind-clean-20260812/evidence/stress/latest');
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto('http://127.0.0.1:8765/preview.php', { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(async () => { await document.fonts.ready; });

  await page.evaluate(() => {
    const titleSuffix = ' 将来の選択肢をじっくり比較しながら、自分らしい進路を見つけることができました。';
    const profileSuffix = '／学内活動や資格学習にも取り組みながら、自分のペースで将来について考えています。';
    document.querySelectorAll('.ref-speech').forEach((bubble, index) => {
      const title = bubble.querySelector('h3');
      const profile = bubble.querySelector('p');
      if (title) title.textContent = `${title.textContent}${titleSuffix}${index === 0 ? titleSuffix : ''}`;
      if (profile) profile.textContent = `${profile.textContent}${profileSuffix}${profileSuffix}`;
    });
  });

  await page.waitForTimeout(80);

  const probe = await page.evaluate(() => {
    const px = value => Math.round(value * 10) / 10;
    const bubbles = [...document.querySelectorAll('.ref-speech')].map((bubble, index) => {
      const rect = bubble.getBoundingClientRect();
      const descendants = [...bubble.querySelectorAll('h3,p')];
      const descendantRects = descendants.map(el => el.getBoundingClientRect());
      const contentBottom = Math.max(rect.top, ...descendantRects.map(r => r.bottom));
      const contentRight = Math.max(rect.left, ...descendantRects.map(r => r.right));
      const contentLeft = Math.min(rect.right, ...descendantRects.map(r => r.left));
      const top = bubble.closest('.ref-voice-item__top');
      const item = bubble.closest('.ref-voice-item');
      const nextBlock = item?.classList.contains('ref-voice-item--open')
        ? item.querySelector('.ref-voice-open__detail')
        : item?.querySelector('.ref-voice-more');
      const nextRect = nextBlock?.getBoundingClientRect() || null;
      const scrollOverflowX = Math.max(0, bubble.scrollWidth - bubble.clientWidth);
      const visualOverflowX = Math.max(0, contentRight - rect.right, rect.left - contentLeft);
      return {
        index,
        open: Boolean(item?.classList.contains('ref-voice-item--open')),
        bubble: { left: px(rect.left), top: px(rect.top), right: px(rect.right), bottom: px(rect.bottom), width: px(rect.width), height: px(rect.height) },
        scrollWidth: bubble.scrollWidth,
        clientWidth: bubble.clientWidth,
        scrollHeight: bubble.scrollHeight,
        clientHeight: bubble.clientHeight,
        horizontalOverflowPx: px(Math.max(scrollOverflowX, visualOverflowX)),
        verticalOverflowPx: px(Math.max(0, bubble.scrollHeight - bubble.clientHeight, contentBottom - rect.bottom)),
        nextBlockOverlapPx: nextRect ? px(Math.max(0, contentBottom - nextRect.top)) : 0,
        topContainerOverflowPx: top ? px(Math.max(0, contentBottom - top.getBoundingClientRect().bottom)) : 0,
      };
    });
    return {
      viewport: innerWidth,
      sectionHeight: px(document.querySelector('.ref-voice')?.getBoundingClientRect().height || 0),
      bubbles,
    };
  });

  probe.hasStressFailure = probe.bubbles.some(b => b.horizontalOverflowPx > 0.5 || b.verticalOverflowPx > 0.5 || b.nextBlockOverlapPx > 0.5 || b.topContainerOverflowPx > 0.5);
  results.push(probe);

  const section = page.locator('.ref-voice');
  if (await section.count()) await section.screenshot({ path: path.join(outDir, `student-voice-stress-${width}.png`), animations: 'disabled', caret: 'hide' });
  await page.close();
}

await browser.close();

const failures = results.filter(result => result.hasStressFailure);
const report = { mode: 'hard-gate', results };
await fs.writeFile(path.join(outDir, 'variable-content-stress.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));

if (failures.length) {
  const details = failures.map(result => {
    const bad = result.bubbles
      .filter(b => b.horizontalOverflowPx > 0.5 || b.verticalOverflowPx > 0.5 || b.nextBlockOverlapPx > 0.5 || b.topContainerOverflowPx > 0.5)
      .map(b => `bubble${b.index}[x=${b.horizontalOverflowPx},y=${b.verticalOverflowPx},next=${b.nextBlockOverlapPx},top=${b.topContainerOverflowPx}]`)
      .join(' ');
    return `${result.viewport}px ${bad}`;
  });
  console.error(`Variable-content stress gate failed: ${details.join('; ')}`);
  process.exitCode = 1;
} else {
  console.log(`PASS variable-content stress gate viewports=${widths.join(',')}`);
}
