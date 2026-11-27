import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(process.env.CSS_QA_MODULE_ROOT + '/package.json');
const { chromium } = require('playwright');
const front = new URL(process.argv[2]);
const id = Number(front.searchParams.get('page_id'));
assert.equal(front.hostname, '127.0.0.1');
assert.equal(process.env.JWSNJ_PARTS_QA_DISPOSABLE, '1');
assert.ok(Number.isSafeInteger(id) && id > 0);
assert.ok(process.env.QA_WP_ADMIN_USER && process.env.QA_WP_ADMIN_PASSWORD);
const editorUrl = new URL('/wp-admin/post.php', front);
editorUrl.searchParams.set('post', String(id));
editorUrl.searchParams.set('action', 'edit');
mkdirSync('form-qa-results', { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1380, height: 900 } });
  await page.route('**/*', route => new URL(route.request().url()).origin === front.origin ? route.continue() : route.abort());
  await page.goto(new URL('/wp-login.php', front).href);
  await page.locator('#user_login').fill(process.env.QA_WP_ADMIN_USER);
  await page.locator('#user_pass').fill(process.env.QA_WP_ADMIN_PASSWORD);
  await page.locator('#wp-submit').click();
  await page.waitForURL('**/wp-admin/**');

  const openEditor = async () => {
    await page.goto(editorUrl.href, { waitUntil: 'load' });
    await page.waitForFunction(id => {
      const editor = window.wp?.data?.select('core/editor');
      const blocks = window.wp?.data?.select('core/block-editor');
      return Number(editor?.getCurrentPostId()) === id &&
        blocks?.getBlocks().some(block => block.name === 'core/details');
    }, id, { timeout: 60000 });
    assert.equal(await page.evaluate(() => wp.data.select('core/editor').getEditedPostAttribute('title')), 'JWSNJ Native Parts QA');
  };
  const inspect = () => page.evaluate(() => {
    const all = wp.data.select('core/block-editor').getBlocks();
    const flat = list => list.flatMap(block => [block, ...flat(block.innerBlocks || [])]);
    const blocks = flat(all);
    const counts = {};
    for (const block of blocks) counts[block.name] = (counts[block.name] || 0) + 1;
    return {
      counts,
      visibility: blocks.filter(block => block.attributes.metadata?.blockVisibility?.viewport).map(block => block.attributes.metadata.blockVisibility.viewport),
      invalid: blocks.filter(block => block.isValid === false || !wp.blocks.getBlockType(block.name)).map(block => block.name),
      content: wp.data.select('core/editor').getEditedPostContent()
    };
  });
  const expected = {
    'core/heading': 4, 'core/paragraph': 13, 'core/separator': 1, 'core/list': 4,
    'core/list-item': 8, 'core/buttons': 1, 'core/button': 2, 'core/details': 3
  };
  await openEditor();
  // A fresh WP user receives a real welcome modal that intercepts canvas clicks.
  // Close it through the editor UI; never force a click through the overlay.
  const welcome = page.getByRole('heading', { name: 'Welcome to the editor', exact: true });
  const welcomeVisible = await welcome.waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true, error => {
      if (error.name !== 'TimeoutError') throw error;
      return false;
    });
  if (welcomeVisible) {
    const dialog = page.locator('.components-modal__frame').filter({ has: welcome });
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
  }
  const before = await inspect();
  assert.deepEqual(before.invalid, [], 'invalid/recovery blocks in editor');
  assert.deepEqual(before.counts, expected);
  assert.deepEqual(before.visibility, [{ desktop: false }, { tablet: false }, { mobile: false }, { tablet: false, mobile: false }]);

  // Operate on the actual editor canvas, including the iframe variant.
  const frame = page.locator('iframe[name="editor-canvas"]');
  const target = 'パーツ集検証終了';
  const paragraph = frame.count().then(count => count
    ? page.frameLocator('iframe[name="editor-canvas"]').locator('[data-type="core/paragraph"]').filter({ hasText: target })
    : page.locator('[data-type="core/paragraph"]').filter({ hasText: target }));
  const editable = await paragraph;
  await editable.waitFor({ state: 'visible' });
  assert.equal(await editable.count(), 1);
  await editable.click();
  await editable.press('End');
  const suffix = '・保存再編集QA';
  await page.keyboard.insertText(suffix);
  await page.waitForFunction(value => wp.data.select('core/editor').getEditedPostContent().includes(value), target + suffix);
  await page.evaluate(async () => { await wp.data.dispatch('core/editor').savePost(); });
  await page.waitForFunction(() => {
    const editor = wp.data.select('core/editor');
    return !editor.isSavingPost() && editor.didPostSaveRequestSucceed();
  }, null, { timeout: 30000 });

  await openEditor();
  const after = await inspect();
  assert.deepEqual(after.invalid, [], 'invalid/recovery blocks after reopening');
  assert.deepEqual(after.counts, before.counts);
  assert.deepEqual(after.visibility, before.visibility, 'native viewport metadata persists after save/reopen');
  assert.ok(after.content.includes(target + suffix), 'edited paragraph persisted after reopening');
  await page.screenshot({ path: 'form-qa-results/native-parts-editor-reopened.png' });
  const frontend = await browser.newPage();
  try {
    assert.equal((await frontend.goto(front.href)).status(), 200);
    assert.ok(await frontend.locator('.block-editor_wrap').getByText(target + suffix, { exact: true }).isVisible());
  } finally {
    await frontend.close();
  }
  console.log(JSON.stringify({ nativePartsEditor: 'PASS', engine: 'chromium', counts: after.counts, invalid: after.invalid.length, edited: true, saved: true, reopened: true, frontend: true }));
} finally {
  const activePage = browser.contexts()[0]?.pages()[0];
  if (activePage) await activePage.screenshot({ path: 'form-qa-results/native-parts-editor-final-state.png' }).catch(() => {});
  await browser.close();
}
