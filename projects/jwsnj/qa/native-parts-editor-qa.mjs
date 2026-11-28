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
  // Actual canvas evidence, not an isolated .editor-styles-wrapper fixture.
  // Record authored values alongside computed styles before deciding whether
  // the stylesheet loader, token scope or cascade owns a mismatch.
  const collectHeadings = root => root.evaluate(el => {
    const doc = el.ownerDocument;
    const win = doc.defaultView;
    const labels = ['大見出しとテキストの検証', '中見出しとテキスト', '小見出しとテキスト'];
    const tokens = ['--to-rem-func', '--font-jwsnj-ja', '--color-primary', '--jwsnj-color-sec', '--color-text', '--wp-block-margin'];
    const vars = node => Object.fromEntries(tokens.map(token => [token, win.getComputedStyle(node).getPropertyValue(token).trim()]));
    const headings = labels.map(label => {
      const node = [...el.querySelectorAll('h2,h3,h4')].find(h => h.textContent.trim() === label);
      if (!node) return { label, missing: true };
      const style = win.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const parent = node.parentElement;
      return { label, tag: node.tagName, className: node.className, fontSize: style.fontSize,
        fontFamily: style.fontFamily, fontWeight: style.fontWeight, color: style.color,
        background: style.backgroundColor, backgroundImage: style.backgroundImage,
        borderBottom: style.borderBottomWidth, borderImage: style.borderImageSource,
        paddingLeft: style.paddingLeft, paddingBottom: style.paddingBottom,
        marginBottom: style.marginBottom, left: rect.left, width: rect.width, height: rect.height,
        parentWidth: parent.getBoundingClientRect().width,
        variables: vars(node) };
    });
    const sheets = [...doc.styleSheets].map(sheet => {
      const href = sheet.href || sheet.ownerNode?.id || 'inline';
      try {
        const found = [];
        const scan = (rules, parents = [], depth = 0) => {
          if (!rules || depth > 8) return;
          for (const rule of rules) {
            if (rule.selectorText && /:root|editor-styles-wrapper|wp-block-heading/.test(rule.selectorText)) {
              const relevant = tokens.filter(t => rule.style?.getPropertyValue(t));
              if (relevant.length && found.length < 20) found.push({ selector: [...parents, rule.selectorText].join(' > '), tokens: relevant });
            }
            if (rule.styleSheet) scan(rule.styleSheet.cssRules, parents, depth + 1);
            else if (rule.cssRules) scan(rule.cssRules, rule.selectorText ? [...parents, rule.selectorText] : parents, depth + 1);
          }
        };
        scan(sheet.cssRules);
        return { href, readable: true, tokenRules: found };
      } catch (error) {
        return { href, readable: false, reason: error.name };
      }
    });
    return {
      viewport: win.innerWidth,
      rootFont: win.getComputedStyle(doc.documentElement).fontSize,
      desktopMedia: win.matchMedia('(min-width: 48rem)').matches,
      scope: el.className,
      rootVars: vars(doc.documentElement), scopeVars: vars(el),
      headings, sheets
    };
  });
  // The editor iframe has a separate FontFaceSet from the admin shell.
  // A computed font-family alone cannot establish that the glyph font loaded.
  const collectFonts = root => root.evaluate(async el => {
    const doc = el.ownerDocument;
    const win = doc.defaultView;
    const glyphs = '\uf061\uf1c1\uf15c';
    const faces = await doc.fonts.load('400 14px "Font Awesome 6 Pro"', glyphs);
    const links = [...doc.querySelectorAll('link[rel="stylesheet"]')].map(link => link.href);
    const sheets = [...doc.styleSheets].map(sheet => sheet.href).filter(Boolean);
    const icons = [...el.querySelectorAll('.wp-block-button__link, #qa-parts-file-links a')].map(node => {
      const pseudo = win.getComputedStyle(node, '::after');
      return { text: node.textContent, content: pseudo.content, font: pseudo.fontFamily,
        weight: pseudo.fontWeight, mask: pseudo.maskImage };
    });
    return { faces: faces.map(face => ({ family: face.family, weight: face.weight, status: face.status })),
      links, sheets, icons, ready: doc.fonts.check('400 14px "Font Awesome 6 Pro"', glyphs) };
  });
  const assertFontAssets = evidence => {
    assert.ok(evidence.sheets.some(href => /\/css\/all\.min\.css(?:\?|$)/.test(href)), 'Font Awesome stylesheet missing in content document');
    assert.ok(evidence.faces.some(face => face.status === 'loaded' && face.family.includes('Font Awesome 6 Pro')), 'actual regular icon face missing');
    assert.ok(evidence.ready);
    // External Google requests are deliberately blocked in editor QA.
    // Verify the configured source is present, not a network/font success.
    assert.ok([...evidence.links, ...evidence.sheets].some(href => {
      const url = new URL(href);
      return url.hostname === 'fonts.googleapis.com' &&
        url.searchParams.getAll('family').some(family => family.startsWith('Zen Kaku Gothic New:'));
    }), 'Google font stylesheet declaration missing');
    assert.ok(evidence.icons.some(icon => icon.text.trim() === 'ボタン大' &&
      icon.content === '"\uf061"' && icon.font.includes('Font Awesome 6 Pro') && icon.weight === '400'),
    JSON.stringify(evidence.icons));
  };
  const assertPathIcons = async (scope, isEditor = false) => {
    const file = scope.locator('a[href="/qa-fixture/document.PDF?download=1#page=2"]');
    const attachment = scope.locator('a[href="/qa-fixture/image.WeBp#preview"]');
    await file.first().waitFor({ state: 'visible' });
    assert.equal(await file.count(), isEditor ? 1 : 2);
    const waitForMarker = async (link, marker) => {
      await link.locator('xpath=self::*[@data-jwsnj-file-icon="' + marker + '"]').waitFor({ state: 'attached' });
      return link.evaluate(el => {
        const icon = el.ownerDocument.defaultView.getComputedStyle(el, '::after');
        return { content: icon.content, mask: icon.maskImage };
      });
    };
    for (const link of isEditor ? [file.first()] : [file.first(), file.nth(1)]) {
      assert.deepEqual(await waitForMarker(link, 'pdf'), { content: '"\uf1c1"', mask: 'none' });
    }
    if (isEditor) {
      const button = scope.locator('[data-type="core/button"]').filter({ hasText: '長いボタンのテキスト' });
      assert.equal(await button.count(), 1);
      const marker = () => button.getAttribute('data-jwsnj-editor-link-icon');
      const icon = () => button.locator('.wp-block-button__link').evaluate(el => {
        const style = el.ownerDocument.defaultView.getComputedStyle(el, '::after');
        return { content: style.content, mask: style.maskImage };
      });
      const clientId = await button.getAttribute('data-block');
      const original = await page.evaluate(id => wp.data.select('core/block-editor').getBlockAttributes(id).url, clientId);
      assert.equal(original, '/qa-fixture/document.PDF?download=1#page=2');
      const waitKind = async kind => {
        await button.locator('xpath=self::*[@data-jwsnj-editor-link-icon="' + kind + '"]').waitFor({ state: 'attached' });
        assert.equal(await marker(), kind);
      };
      await waitKind('pdf');
      assert.deepEqual(await icon(), { content: '"\uf1c1"', mask: 'none' });
      // Update the genuine block state (not the DOM or serialized HTML).
      const setUrl = url => page.evaluate(({ id, url }) =>
        wp.data.dispatch('core/block-editor').updateBlockAttributes(id, { url }), { id: clientId, url });
      try {
        await setUrl('/qa-fixture/image.webp#preview');
        await waitKind('file');
        assert.deepEqual(await icon(), { content: '"\uf15b"', mask: 'none' });
        await setUrl('/qa-fixture/page?name=document.pdf');
        await button.locator('xpath=self::*[not(@data-jwsnj-editor-link-icon)]').waitFor({ state: 'attached' });
        assert.deepEqual(await icon(), { content: '"\uf061"', mask: 'none' });
      } finally {
        await setUrl(original);
      }
      await waitKind('pdf');
      assert.ok(!(await inspect()).content.includes('data-jwsnj-editor-link-icon'), 'editor wrapper marker must not serialize');
    }
    assert.deepEqual(await waitForMarker(attachment, 'file'), { content: '"\uf15c"', mask: 'none' });
    for (const href of ['/qa-fixture/page?name=document.pdf', '#document.pdf']) {
      const ordinary = scope.locator('a[href="' + href + '"]');
      const icon = await ordinary.evaluate(el => ({
        marker: el.getAttribute('data-jwsnj-file-icon'),
        mask: el.ownerDocument.defaultView.getComputedStyle(el, '::after').maskImage
      }));
      assert.equal(icon.marker, null);
      assert.match(icon.mask, /ico-blank\.svg/);
    }
    await scope.locator('a[href="/qa-fixture/image.WeBp#preview"]').scrollIntoViewIfNeeded();
  };
  assert.ok(!after.content.includes('data-jwsnj-file-icon') && !after.content.includes('data-jwsnj-editor-link-icon'), 'presentation markers must not be saved in block content');
  const editorEvidence = [];
  for (const width of [1380, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    const canvas = await frame.count()
      ? page.frameLocator('iframe[name="editor-canvas"]').locator('.editor-styles-wrapper').first()
      : page.locator('.editor-styles-wrapper').first();
    await canvas.waitFor({ state: 'visible' });
    await canvas.evaluate(el => el.ownerDocument.fonts.ready);
    const measured = await collectHeadings(canvas);
    assert.equal(measured.headings.length, 3);
    assert.ok(measured.headings.every(h => !h.missing && h.width > 0), JSON.stringify(measured.headings));
    const expectedSizes = measured.desktopMedia ? ['30px', '24px', '18px'] : ['24px', '22px', '18px'];
    const mismatches = measured.headings.flatMap((h, index) => {
      const differences = [];
      if (h.fontSize !== expectedSizes[index]) differences.push('fontSize');
      if (h.fontWeight !== '500') differences.push('fontWeight');
      if (index === 0 && h.borderBottom !== '3px') differences.push('borderBottom');
      if (index === 1 && h.background !== 'rgb(107, 210, 206)') differences.push('background');
      if (index === 2 && (!h.backgroundImage.includes('ico_blossom.svg') || h.paddingLeft !== '26px')) differences.push('blossom/padding');
      if (Object.values(h.variables).some(value => !value)) differences.push('tokens');
      if (!h.fontFamily.includes('Zen Kaku Gothic New')) differences.push('fontFamily');
      if (index !== 1 && h.color !== (index === 2 ? 'rgb(40, 172, 95)' : 'rgb(51, 51, 51)')) differences.push('color');
      if (index === 1 && h.color !== 'rgb(255, 255, 255)') differences.push('color');
      // These three ordinary sibling headings share the native canvas content
      // width; a theme max-width must not override only H3's editor alignment.
      const first = measured.headings[0];
      if (Math.abs(h.width - first.width) > 1 || Math.abs(h.left - first.left) > 1) differences.push('contentWidth/alignment');
      return differences.length ? [{ label: h.label, differences }] : [];
    });
    console.log(JSON.stringify({ nativeEditorCanvasEvidence: mismatches.length ? 'MISMATCH' : 'HEADING_METRICS_MATCH', shellWidth: width, mismatches, measured }));
    const fonts = await collectFonts(canvas);
    console.log(JSON.stringify({ nativeEditorFontAssets: 'MEASURED', shellWidth: width, fonts }));
    await canvas.locator('.wp-block-button__link').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'form-qa-results/native-parts-editor-fonts-' + width + '.png' });
    assertFontAssets(fonts);
    await assertPathIcons(canvas, true);
    await page.screenshot({ path: 'form-qa-results/native-editor-path-icons-' + width + '.png' });
    console.log(JSON.stringify({ nativeEditorPathIcons: 'PASS', shellWidth: width }));
    editorEvidence.push({ width, mismatchCount: mismatches.length });
    await canvas.locator('h2').filter({ hasText: '大見出しとテキストの検証' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'form-qa-results/native-parts-editor-heading-' + width + '.png' });
  }
  console.log(JSON.stringify({ nativeEditorCanvasEvidenceCollected: true, editorEvidence }));
  // #800 reproduced missing root tokens at both shell widths. Do not let
  // diagnostic collection alone satisfy the regression after the loader fix.
  assert.deepEqual(editorEvidence.map(item => item.mismatchCount), [0, 0],
    'actual editor canvas heading styles must match the approved token metrics');
  const frontend = await browser.newPage();
  try {
    assert.equal((await frontend.goto(front.href)).status(), 200);
    assert.ok(await frontend.locator('.block-editor_wrap').getByText(target + suffix, { exact: true }).isVisible());
    for (const width of [375, 1380]) {
      await frontend.setViewportSize({ width, height: 900 });
      const scope = frontend.locator('.block-editor_wrap').first();
      await scope.evaluate(el => el.ownerDocument.fonts.ready);
      const measured = await collectHeadings(scope);
      assert.ok(measured.headings.every(h => !h.missing));
      assert.deepEqual(measured.headings.map(h => h.fontSize), width >= 768 ? ['30px', '24px', '18px'] : ['24px', '22px', '18px']);
      assert.ok(measured.headings.every(h =>
        Math.abs(h.width - measured.headings[0].width) <= 1 &&
        Math.abs(h.left - measured.headings[0].left) <= 1
      ), JSON.stringify(measured.headings));
      assert.ok(!measured.sheets.some(sheet => /\/css\/editor-content\.css(?:\?|$)/.test(sheet.href)),
        'editor-only CSS must not leak onto the frontend');
      const fonts = await collectFonts(scope);
      console.log(JSON.stringify({ nativeFrontendFontAssets: 'MEASURED', width, fonts }));
      assertFontAssets(fonts);
      await assertPathIcons(scope);
      await frontend.screenshot({ path: 'form-qa-results/native-front-path-icons-' + width + '.png' });
      console.log(JSON.stringify({ nativeFrontendPathIcons: 'PASS', width }));
      await scope.locator('.wp-block-button__link').first().scrollIntoViewIfNeeded();
      await frontend.screenshot({ path: 'form-qa-results/native-parts-front-fonts-' + width + '.png' });
      console.log(JSON.stringify({ nativeFrontendHeadingEvidence: 'PASS', width, measured }));
      await scope.locator('h2').filter({ hasText: '大見出しとテキストの検証' }).scrollIntoViewIfNeeded();
      await frontend.screenshot({ path: 'form-qa-results/native-parts-front-heading-' + width + '.png' });
    }
  } finally {
    await frontend.close();
  }
  console.log(JSON.stringify({ nativePartsEditor: 'PASS', engine: 'chromium', counts: after.counts, invalid: after.invalid.length, edited: true, saved: true, reopened: true, frontend: true }));
  // Use the already seeded disposable gallery page, never a production post.
  // This exercises the registered Gutenberg blocks and the real editor canvas,
  // independently of the anonymous frontend gallery/lightbox tests.
  const galleryPages = await page.evaluate(() => wp.apiFetch({
    path: '/wp/v2/pages?search=JWSNJ%20Gallery%20QA&status=publish&per_page=20&_fields=id,title'
  }));
  const matches = galleryPages.filter(post => post.title.rendered === 'JWSNJ Gallery QA');
  assert.equal(matches.length, 1, 'expected one disposable gallery QA page');
  const galleryId = Number(matches[0].id);
  assert.ok(Number.isSafeInteger(galleryId) && galleryId > 0 && galleryId !== id);
  const galleryEditorUrl = new URL(editorUrl);
  galleryEditorUrl.searchParams.set('post', String(galleryId));
  const openGallery = async () => {
    await page.goto(galleryEditorUrl.href, { waitUntil: 'load' });
    await page.waitForFunction(galleryId => {
      const editor = wp.data.select('core/editor');
      const blocks = wp.data.select('core/block-editor').getBlocks();
      return Number(editor?.getCurrentPostId()) === galleryId &&
        blocks.some(block => block.name === 'core/gallery');
    }, galleryId, { timeout: 60000 });
    assert.equal(await page.evaluate(() => wp.data.select('core/editor').getEditedPostAttribute('title')), 'JWSNJ Gallery QA');
  };
  await page.setViewportSize({ width: 1380, height: 900 });
  await openGallery();
  const galleryBefore = await inspect();
  console.log(JSON.stringify({ galleryEditorBefore: 'MEASURED', counts: galleryBefore.counts, invalid: galleryBefore.invalid }));
  assert.deepEqual(galleryBefore.invalid, []);
  assert.equal(galleryBefore.counts['core/gallery'], 2);
  assert.equal(galleryBefore.counts['core/image'], 5);
  assert.equal(galleryBefore.counts['core/media-text'], 1);
  assert.ok(galleryBefore.content.includes('qa-large-navigation-reference') &&
    galleryBefore.content.includes('qa-navigation-end'), 'not the seeded gallery fixture');
  const galleryCanvas = async () => await frame.count()
    ? page.frameLocator('iframe[name="editor-canvas"]').locator('.editor-styles-wrapper').first()
    : page.locator('.editor-styles-wrapper').first();
  const captionLabel = '画像との間隔20px。中央揃え。';
  const captionSuffix = '・画像保存QA';
  const firstGallery = (await galleryCanvas()).locator('[data-type="core/gallery"]').first();
  const caption = firstGallery.locator('figcaption[contenteditable="true"]').filter({ hasText: captionLabel });
  await caption.waitFor({ state: 'visible' });
  assert.equal(await caption.count(), 1);
  await caption.click();
  await caption.press('End');
  await page.keyboard.insertText(captionSuffix);
  await page.waitForFunction(value => wp.data.select('core/editor').getEditedPostContent().includes(value), captionLabel + captionSuffix);
  await page.evaluate(async () => { await wp.data.dispatch('core/editor').savePost(); });
  await page.waitForFunction(() => {
    const editor = wp.data.select('core/editor');
    return !editor.isSavingPost() && editor.didPostSaveRequestSucceed();
  }, null, { timeout: 30000 });
  await openGallery();
  const galleryAfter = await inspect();
  assert.deepEqual(galleryAfter.invalid, []);
  assert.deepEqual(galleryAfter.counts, galleryBefore.counts);
  assert.ok(galleryAfter.content.includes(captionLabel + captionSuffix));
  // Capture the actual content document; editor shell width is not its viewport.
  // Record style differences explicitly. Editor-native control wrappers can
  // differ from front markup, so diagnose before changing theme CSS.
  for (const width of [1380, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    const canvas = await galleryCanvas();
    await canvas.waitFor({ state: 'visible' });
    await canvas.evaluate(el => el.ownerDocument.fonts.ready);
    const galleries = canvas.locator('[data-type="core/gallery"]');
    assert.equal(await galleries.count(), 2);
    const media = canvas.locator('[data-type="core/media-text"]');
    assert.equal(await media.count(), 1);
    const evidence = await canvas.evaluate(el => {
      const win = el.ownerDocument.defaultView;
      const measure = node => {
        if (!node) return null;
        const s = win.getComputedStyle(node);
        const r = node.getBoundingClientRect();
        return { tag: node.tagName, className: node.className, width: r.width, height: r.height,
          display: s.display, gap: s.gap, rowGap: s.rowGap, columnGap: s.columnGap, columns: s.gridTemplateColumns, inlineStyle: node.getAttribute('style'), fontSize: s.fontSize,
          fontFamily: s.fontFamily, lineHeight: s.lineHeight, color: s.color,
          radius: s.borderRadius, ratio: s.aspectRatio, fit: s.objectFit,
          overflow: s.overflow, textAlign: s.textAlign };
      };
      return {
        viewport: win.innerWidth, desktopMedia: win.matchMedia('(min-width: 48rem)').matches,
        galleries: [...el.querySelectorAll('[data-type="core/gallery"]')].map(g => ({
          block: measure(g), images: [...g.querySelectorAll('img')].map(measure),
          captions: [...g.querySelectorAll('figcaption')].map(measure)
        })),
        media: [...el.querySelectorAll('[data-type="core/media-text"]')].map(m => ({
          block: measure(m), image: measure(m.querySelector('img')),
          copy: measure(m.querySelector('.wp-block-media-text__content'))
        }))
      };
    });
    console.log(JSON.stringify({ galleryEditorCanvas: 'MEASURED_NOT_VISUAL_ACCEPTANCE', shellWidth: width, evidence }));
    assert.deepEqual(evidence.galleries.map(g => g.images.length), [2, 3]);
    assert.deepEqual(evidence.galleries.map(g => g.captions.length), [2, 3]);
    assert.ok(evidence.media[0]?.image && evidence.media[0]?.copy);
    for (const [index, gallery] of (await galleries.all()).entries()) {
      await gallery.scrollIntoViewIfNeeded();
      await gallery.screenshot({ path: 'form-qa-results/gallery-editor-' + width + '-' + index + '.png' });
    }
    await media.scrollIntoViewIfNeeded();
    await media.screenshot({ path: 'form-qa-results/media-text-editor-' + width + '.png' });
    // Inspect the actual canvas cascade, including generated per-block CSS.
    // Keep this evidence even if the strict layout assertions below fail.
    const gapCascade = await galleries.nth(1).evaluate(el => {
      const doc = el.ownerDocument;
      const win = doc.defaultView;
      const style = win.getComputedStyle(el);
      const names = ['gap', 'row-gap', 'column-gap', '--wp--style--gallery-gap-default',
        '--wp--style--unstable-gallery-gap'];
      const matches = [];
      const visit = (rules, source, conditions = []) => {
        for (const rule of rules) {
          if (rule.selectorText && rule.style) {
            try {
              if (!el.matches(rule.selectorText)) continue;
            } catch { continue; }
            const declarations = Object.fromEntries(names.flatMap(name => {
              const value = rule.style.getPropertyValue(name);
              return value ? [[name, value + (rule.style.getPropertyPriority(name) ? ' !important' : '')]] : [];
            }));
            if (Object.keys(declarations).length) matches.push({ source, conditions, selector: rule.selectorText, declarations });
          } else if (rule.cssRules) {
            if (rule.type === win.CSSRule.MEDIA_RULE && !win.matchMedia(rule.conditionText).matches) continue;
            if (rule.type === win.CSSRule.SUPPORTS_RULE && !win.CSS.supports(rule.conditionText)) continue;
            visit(rule.cssRules, source, [...conditions, rule.conditionText || rule.name || rule.constructor.name]);
          }
        }
      };
      for (const sheet of doc.styleSheets) {
        try { visit(sheet.cssRules, sheet.href || sheet.ownerNode?.id || 'inline'); } catch { /* inaccessible CSSOM */ }
      }
      return { viewport: win.innerWidth, computed: Object.fromEntries(names.map(name => [name, style.getPropertyValue(name)])), matches };
    });
    console.log(JSON.stringify({ galleryEditorGapCascade: 'MEASURED', shellWidth: width, gapCascade }));
    const near = (a, b) => Math.abs(a - b) <= 1;
    for (const [index, g] of evidence.galleries.entries()) {
      const expectedColumns = evidence.desktopMedia ? index + 2 : index + 1;
      const expectedColumnGap = !evidence.desktopMedia && index === 1 ? 15 : 40;
      assert.equal(g.block.columns.split(' ').length, expectedColumns, JSON.stringify(g));
      assert.ok(near(parseFloat(g.block.rowGap), 40) && near(parseFloat(g.block.columnGap), expectedColumnGap), JSON.stringify(g));
      const expectedImageWidth = (g.block.width - (expectedColumns - 1) * expectedColumnGap) / expectedColumns;
      assert.ok(g.images.every(img => near(img.width, expectedImageWidth) && near(img.height, img.width * 2 / 3)), JSON.stringify(g));
      assert.ok(g.captions.every(cap => cap.fontSize === (evidence.desktopMedia ? '14px' : '12px') && cap.textAlign === 'center'), JSON.stringify(g));
    }
    const m = evidence.media[0];
    const expectedMediaWidth = evidence.desktopMedia ? (m.block.width - 40) * 410 / 920 : m.block.width;
    const expectedCopyWidth = evidence.desktopMedia ? (m.block.width - 40) * 510 / 920 : m.block.width;
    assert.ok(near(m.image.width, expectedMediaWidth) && near(m.copy.width, expectedCopyWidth), JSON.stringify(m));
    // Exercise a real non-default native width; do not suppress editor-owned resizing.
    if (evidence.desktopMedia) {
      const clientId = await media.getAttribute('data-block');
      const readAttrs = () => page.evaluate(id => wp.data.select('core/block-editor').getBlockAttributes(id), clientId);
      const original = await readAttrs();
      assert.equal(original.mediaWidth, 50);
      const setWidth = value => page.evaluate(({ id, value }) => wp.data.dispatch('core/block-editor').updateBlockAttributes(id, { mediaWidth: value }), { id: clientId, value });
      try {
        await setWidth(60);
        await media.locator('xpath=self::*[contains(@style, "60%")]').waitFor({ state: 'attached' });
        const custom = await media.evaluate(el => {
          const win = el.ownerDocument.defaultView;
          return { width: el.getBoundingClientRect().width, image: el.querySelector('img').getBoundingClientRect().width,
            tracks: win.getComputedStyle(el).gridTemplateColumns };
        });
        assert.ok(near(custom.image, custom.width * 0.6), JSON.stringify(custom));
        assert.equal((await readAttrs()).mediaWidth, 60);
      } finally {
        await setWidth(original.mediaWidth);
      }
      await media.locator('xpath=self::*[contains(@style, "50%")]').waitFor({ state: 'attached' });
      assert.ok(near(await media.locator('img').evaluate(el => el.getBoundingClientRect().width), expectedMediaWidth));
    }
    // Inspect the native spacing support and exercise a real block attribute
    // rather than manufacturing an inline style on the DOM.
    const customGallery = galleries.nth(1);
    const galleryClientId = await customGallery.getAttribute('data-block');
    const nativeSpacing = await page.evaluate(id => ({
      support: wp.blocks.getBlockType('core/gallery').supports?.spacing?.blockGap,
      style: wp.data.select('core/block-editor').getBlockAttributes(id).style
    }), galleryClientId);
    console.log(JSON.stringify({ galleryEditorSpacingSupport: 'MEASURED', shellWidth: width, nativeSpacing }));
    if (nativeSpacing.support) {
      const setStyle = style => page.evaluate(({ id, style }) =>
        wp.data.dispatch('core/block-editor').updateBlockAttributes(id, { style }), { id: galleryClientId, style });
      const original = nativeSpacing.style;
      try {
        await setStyle({ ...original, spacing: { ...original?.spacing, blockGap: '24px' } });
        const result = await customGallery.evaluate(el => {
          const read = () => {
            const s = el.ownerDocument.defaultView.getComputedStyle(el);
            return { row: s.rowGap, column: s.columnGap, inline: el.getAttribute('style'),
              coreGap: s.getPropertyValue('--wp--style--unstable-gallery-gap') };
          };
          return new Promise(resolve => {
            let remaining = 120;
            const sample = () => {
              const result = read();
              if ((result.row === '24px' && result.column === '24px') || --remaining === 0) resolve(result);
              else el.ownerDocument.defaultView.requestAnimationFrame(sample);
            };
            sample();
          });
        });
        console.log(JSON.stringify({ galleryEditorCustomGap: 'MEASURED', shellWidth: width, result }));
        assert.equal(result.row, '24px', JSON.stringify(result));
        assert.equal(result.column, '24px', JSON.stringify(result));
      } finally {
        await setStyle(original ?? {});
      }
      const restored = await customGallery.evaluate(el => new Promise(resolve => {
        const win = el.ownerDocument.defaultView;
        const expectedColumn = win.matchMedia('(min-width: 48rem)').matches ? '40px' : '15px';
        let remaining = 120;
        const sample = () => {
          const s = win.getComputedStyle(el);
          const result = { row: s.rowGap, column: s.columnGap };
          if ((result.row === '40px' && result.column === expectedColumn) || --remaining === 0) resolve(result);
          else win.requestAnimationFrame(sample);
        };
        sample();
      }));
      assert.deepEqual(restored, { row: '40px', column: evidence.desktopMedia ? '40px' : '15px' });
      console.log(JSON.stringify({ galleryEditorGapRestored: 'PASS', shellWidth: width, restored }));
    }
    console.log(JSON.stringify({ galleryEditorLayout: 'PASS', shellWidth: width, canvasWidth: evidence.viewport }));

  }
  const galleryFront = await browser.newPage();
  try {
    const galleryUrl = new URL(front);
    galleryUrl.searchParams.set('page_id', String(galleryId));
    assert.equal((await galleryFront.goto(galleryUrl.href)).status(), 200);
    const scope = galleryFront.locator('.block-editor_wrap');
    const galleries = scope.locator('.wp-block-gallery.has-nested-images');
    assert.equal(await galleries.count(), 2);
    assert.ok(await galleries.first().getByText(captionLabel + captionSuffix, { exact: true }).isVisible());
    assert.equal(await galleries.locator('figure.wp-block-image img').count(), 5);
    assert.equal(await scope.locator('.wp-block-media-text').count(), 1);
  } finally {
    await galleryFront.close();
  }
  console.log(JSON.stringify({ galleryEditorPersistence: 'PASS', invalid: galleryAfter.invalid.length, edited: true, saved: true, reopened: true, frontend: true }));
  // Flexible Table Block uses its own registered editor, not core/table.
  // Reuse the previously seeded, explicitly disposable page only.
  const tablePages = await page.evaluate(() => wp.apiFetch({
    path: '/wp/v2/pages?search=JWSNJ%20Tables%20QA&status=publish&per_page=20&_fields=id,title'
  }));
  const tableMatches = tablePages.filter(post => post.title.rendered === 'JWSNJ Tables QA');
  assert.equal(tableMatches.length, 1);
  const tableId = Number(tableMatches[0].id);
  assert.ok(Number.isSafeInteger(tableId) && tableId > 0 && tableId !== id && tableId !== galleryId);
  const tableEditorUrl = new URL(editorUrl);
  tableEditorUrl.searchParams.set('post', String(tableId));
  const openTables = async () => {
    await page.goto(tableEditorUrl.href, { waitUntil: 'load' });
    await page.waitForFunction(tableId => {
      const editor = window.wp?.data?.select('core/editor');
      const blocks = window.wp?.data?.select('core/block-editor')?.getBlocks();
      return Number(editor?.getCurrentPostId()) === tableId &&
        blocks?.filter(b => b.name === 'flexible-table-block/table').length === 3;
    }, tableId, { timeout: 60000 });
    assert.equal(await page.evaluate(() => wp.data.select('core/editor').getEditedPostAttribute('title')), 'JWSNJ Tables QA');
  };
  await page.setViewportSize({ width: 1380, height: 900 });
  await openTables();
  const tableBefore = await inspect();
  assert.deepEqual(tableBefore.invalid, []);
  assert.deepEqual(tableBefore.counts, { 'core/heading': 3, 'flexible-table-block/table': 3 });
  assert.ok(tableBefore.content.includes('is-scroll-on-mobile') &&
    tableBefore.content.includes('is-stacked-on-mobile') &&
    tableBefore.content.includes('padding:18px') &&
    tableBefore.content.includes('LongEditableCellWithoutSpaces'), 'wrong table fixture');
  const editorTables = async () => (await galleryCanvas()).locator('[data-type="flexible-table-block/table"]');
  for (const width of [1380, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    const blocks = await editorTables();
    assert.equal(await blocks.count(), 3);
    for (const [index, block] of (await blocks.all()).entries()) {
      await block.scrollIntoViewIfNeeded();
      const evidence = await block.evaluate(el => {
        const win = el.ownerDocument.defaultView;
        const measure = node => {
          const r = node.getBoundingClientRect();
          const s = win.getComputedStyle(node);
          return { width: r.width, height: r.height, client: node.clientWidth, scroll: node.scrollWidth,
            display: s.display, overflow: s.overflowX, font: s.fontSize, weight: s.fontWeight,
            lineHeight: s.lineHeight, padding: [s.paddingBlockStart, s.paddingInlineStart],
            border: s.borderTopWidth, background: s.backgroundColor, align: s.textAlign };
        };
        const t = el.querySelector('table');
        if (!t) return { viewport: win.innerWidth, table: null };
        return { viewport: win.innerWidth, block: measure(el), table: measure(t),
          headers: [...t.querySelectorAll('thead th')].map(measure),
          merged: [...t.querySelectorAll('td[colspan="2"]')].map(measure),
          cells: [...t.querySelectorAll('tbody td')].map(measure),
          explicitPadding: t.querySelector('td[style*="padding:18px"]') ?
            measure(t.querySelector('td[style*="padding:18px"]')) : null };
      });
      console.log(JSON.stringify({ tableEditorCanvas: 'MEASURED_NOT_VISUAL_ACCEPTANCE', shellWidth: width, index, evidence }));
      assert.ok(evidence.table, 'registered table must render in actual editor');
      assert.equal(evidence.headers.length, 4);
      assert.equal(evidence.merged.length, 2);
      // Plugin 3.9 edit() intentionally omits the responsive output classes
      // that save() emits. Keep all cells editable; validate front scroll and
      // stacking in parts-tables-browser-qa, not by forcing its CSS here.
      const expectedPadding = evidence.viewport >= 768 ? ['15px', '30px'] : ['12px', '20px'];
      const near = (a, b) => Math.abs(a - b) <= 2;
      assert.ok(near(evidence.table.width, evidence.block.width), JSON.stringify(evidence));
      assert.ok(evidence.cells.length === 6);
      for (const [i, cell] of [...evidence.headers, ...evidence.cells].entries()) {
        assert.deepEqual([cell.font, cell.weight, cell.lineHeight, cell.border, cell.align],
          ['15px', '400', '24px', '1px', 'center'], JSON.stringify(cell));
        assert.deepEqual(cell.padding, index === 1 && i === 7 ? ['18px', '18px'] : expectedPadding, JSON.stringify(cell));
        assert.ok(cell.scroll <= cell.client + 1, JSON.stringify(cell));
      }
      assert.ok(evidence.headers.every(cell => cell.background === 'rgb(242, 242, 242)'), JSON.stringify(evidence.headers));
      if (index !== 1) {
        assert.ok(evidence.headers.every(cell => near(cell.width, evidence.headers[0].width)), JSON.stringify(evidence.headers));
      }
      assert.ok(evidence.merged.every(cell => near(cell.width, evidence.headers[1].width + evidence.headers[2].width)), JSON.stringify(evidence));
      await block.screenshot({ path: 'form-qa-results/table-editor-' + width + '-' + index + '.png' });
      console.log(JSON.stringify({ tableEditorLayout: 'PASS', shellWidth: width, index, viewport: evidence.viewport }));
    }
  }
  await page.setViewportSize({ width: 1380, height: 900 });
  const firstTable = (await editorTables()).first();
  const firstHeader = firstTable.locator('thead th').first();
  await firstHeader.click();
  const cellEditor = firstHeader.locator('[contenteditable="true"]').or(firstHeader.locator('xpath=self::*[@contenteditable="true"]'));
  await cellEditor.waitFor({ state: 'visible' });
  assert.equal(await cellEditor.count(), 1, 'expected the native cell rich text editor');
  const cellSuffix = '・セル保存QA';
  await cellEditor.click();
  await cellEditor.press('End');
  await page.keyboard.insertText(cellSuffix);
  await page.waitForFunction(value => wp.data.select('core/editor').getEditedPostContent().includes(value), 'ヘッダーセル' + cellSuffix);
  await page.evaluate(async () => { await wp.data.dispatch('core/editor').savePost(); });
  await page.waitForFunction(() => {
    const editor = wp.data.select('core/editor');
    return !editor.isSavingPost() && editor.didPostSaveRequestSucceed();
  }, null, { timeout: 30000 });
  await openTables();
  const tableAfter = await inspect();
  assert.deepEqual(tableAfter.invalid, []);
  assert.deepEqual(tableAfter.counts, tableBefore.counts);
  assert.ok(tableAfter.content.includes('ヘッダーセル' + cellSuffix));
  const tableFront = await browser.newPage();
  try {
    const url = new URL(front);
    url.searchParams.set('page_id', String(tableId));
    assert.equal((await tableFront.goto(url.href)).status(), 200);
    const tables = tableFront.locator('.block-editor_wrap figure.wp-block-flexible-table-block-table');
    assert.equal(await tables.count(), 3);
    assert.equal(await tables.first().locator('thead th').first().innerText(), 'ヘッダーセル' + cellSuffix);
    assert.equal(await tables.first().locator('td[colspan="2"]').count(), 2);
    assert.equal(await tables.nth(1).locator('td[style*="padding:18px"]').count(), 1);
    assert.equal(await tables.nth(2).locator('table.is-stacked-on-mobile').count(), 1);
  } finally {
    await tableFront.close();
  }
  console.log(JSON.stringify({ tableEditorPersistence: 'PASS', invalid: tableAfter.invalid.length, edited: true, saved: true, reopened: true, frontend: true }));
} finally {
  const activePage = browser.contexts()[0]?.pages()[0];
  if (activePage) await activePage.screenshot({ path: 'form-qa-results/native-parts-editor-final-state.png' }).catch(() => {});
  await browser.close();
}
