import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const out = process.env.SECTION_CAPTURE_DIR || '/tmp/ref001-section-captures';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
await page.goto('http://127.0.0.1:8877/ref-001/latest/preview/', { waitUntil: 'networkidle' });
for (const name of ['reason','education','student-voice','messages','courses','links','cta-value']) {
  const el = page.locator(`[data-section="${name}"]`).first();
  if (await el.count()) await el.screenshot({ path: path.join(out, `sp-${name}.png`) });
}
await browser.close();
console.log('PASS section captures');
