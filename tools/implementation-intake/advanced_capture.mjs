#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

const [configFile, outputFile] = process.argv.slice(2);
if (!configFile || !outputFile) throw new Error('usage: advanced_capture.mjs config.json output.json');
const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
const browserTypes = { chromium, firefox, webkit };
const ensureDir = (file) => fs.mkdirSync(path.dirname(file), { recursive: true });

async function performAction(page, root, action) {
  const target = action.selector ? root.locator(action.selector).first() : root;
  if (action.type === 'click') return target.click();
  if (action.type === 'hover') return target.hover();
  if (action.type === 'focus') return target.focus();
  if (action.type === 'fill') return target.fill(String(action.value ?? ''));
  if (action.type === 'press') return target.press(String(action.key || 'Enter'));
  if (action.type === 'check') return target.check();
  if (action.type === 'uncheck') return target.uncheck();
  if (action.type === 'wait') return page.waitForTimeout(Math.max(0, Number(action.ms || 0)));
  throw new Error(`unsupported action type: ${action.type}`);
}

async function runAssertion(root, assertion) {
  const target = assertion.selector ? root.locator(assertion.selector) : root;
  if (assertion.type === 'visible') {
    const actual = await target.first().isVisible();
    if (actual !== (assertion.value ?? true)) throw new Error(`visible assertion failed: ${assertion.selector || '<root>'}`);
    return;
  }
  if (assertion.type === 'count') {
    const actual = await target.count();
    if (actual !== Number(assertion.value)) throw new Error(`count assertion failed: expected ${assertion.value}, got ${actual}`);
    return;
  }
  if (assertion.type === 'attribute') {
    const actual = await target.first().getAttribute(assertion.name);
    if (actual !== String(assertion.value)) throw new Error(`attribute assertion failed: ${assertion.name} expected ${assertion.value}, got ${actual}`);
    return;
  }
  if (assertion.type === 'text') {
    const actual = (await target.first().textContent())?.trim() || '';
    const pass = assertion.includes ? actual.includes(String(assertion.value)) : actual === String(assertion.value);
    if (!pass) throw new Error(`text assertion failed: expected ${assertion.value}, got ${actual}`);
    return;
  }
  throw new Error(`unsupported assertion type: ${assertion.type}`);
}

async function captureBox(root) {
  return root.evaluate((node) => {
    const r = node.getBoundingClientRect();
    return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height, viewportX: r.x, viewportY: r.y, visible: r.width > 0 && r.height > 0 && getComputedStyle(node).visibility !== 'hidden' };
  });
}

async function captureFontProvenance(root) {
  return root.evaluate((element) => {
    const loadedFamilies = [];
    if (document.fonts) for (const face of document.fonts) loadedFamilies.push(face.family);
    const fontFaceSources = [];
    const stylesheetDiagnostics = [];
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules;
        stylesheetDiagnostics.push({ href: sheet.href || null, accessible: true, ruleCount: rules.length });
        const visit = (list) => {
          for (const rule of list || []) {
            if (rule.constructor?.name === 'CSSFontFaceRule') fontFaceSources.push({ family: rule.style.getPropertyValue('font-family'), src: rule.style.getPropertyValue('src'), style: rule.style.getPropertyValue('font-style'), weight: rule.style.getPropertyValue('font-weight'), href: sheet.href || null });
            if (rule.cssRules?.length) visit(rule.cssRules);
          }
        };
        visit(rules);
      } catch (error) {
        stylesheetDiagnostics.push({ href: sheet.href || null, accessible: false, error: String(error?.name || error) });
      }
    }
    return { computedFamily: getComputedStyle(element).fontFamily, loadedFamilies: [...new Set(loadedFamilies)], fontFaceSources, stylesheetDiagnostics, fontsStatus: document.fonts?.status || null };
  });
}

async function captureContainerEvidence(root, selectors) {
  const results = {};
  for (const selector of selectors || []) {
    const target = root.locator(selector).first();
    if (!(await target.count())) continue;
    results[selector] = await target.evaluate((node) => {
      const chain = [];
      let cur = node;
      while (cur && chain.length < 12) {
        const style = getComputedStyle(cur);
        const r = cur.getBoundingClientRect();
        if ((style.containerType && style.containerType !== 'normal') || (style.containerName && style.containerName !== 'none')) chain.push({ tag: cur.tagName.toLowerCase(), id: cur.id || null, className: typeof cur.className === 'string' ? cur.className : null, containerType: style.containerType || null, containerName: style.containerName || null, width: r.width, height: r.height });
        cur = cur.parentElement;
      }
      return chain;
    });
  }
  return results;
}

async function captureAria(root) {
  if (typeof root.ariaSnapshot !== 'function') return { supported: false, yaml: null };
  return { supported: true, yaml: await root.ariaSnapshot() };
}

async function runBrowser(browserName) {
  const type = browserTypes[browserName];
  if (!type) throw new Error(`unsupported browser: ${browserName}`);
  const browser = await type.launch({ headless: true });
  const viewport = config.viewport || { width: 1280, height: 900, dpr: 1 };
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.dpr || 1, reducedMotion: 'reduce', locale: config.environment?.locale || 'ja-JP', timezoneId: config.environment?.timezone || 'Asia/Tokyo' });
  const traceEnabled = Boolean(config.trace?.onFailure);
  if (traceEnabled) await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__fastLoopLayoutShifts = [];
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__fastLoopLayoutShifts.push({ value: entry.value, hadRecentInput: entry.hadRecentInput, startTime: entry.startTime, sources: (entry.sources || []).slice(0, 16).map((source) => ({ previousRect: source.previousRect, currentRect: source.currentRect, node: source.node ? { tag: source.node.tagName?.toLowerCase() || null, id: source.node.id || null, className: typeof source.node.className === 'string' ? source.node.className : null } : null })) });
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {}
  });
  const result = { browser: browserName, browserVersion: browser.version(), passed: false, states: [], environment: {}, error: null, trace: null };
  try {
    await page.goto(config.implementation.url, { waitUntil: config.environment?.waitUntil || 'networkidle' });
    await page.addStyleTag({ content: `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important;caret-color:transparent!important}` });
    if (config.environment?.injectCss) await page.addStyleTag({ content: String(config.environment.injectCss) });
    if (config.environment?.readySelector) await page.locator(config.environment.readySelector).waitFor({ state: 'visible' });
    const root = page.locator(config.implementation.selector).nth(config.implementation.index || 0);
    await root.waitFor({ state: 'visible' });
    await root.scrollIntoViewIfNeeded();
    await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });
    for (const state of config.states || [{ id: 'default', actions: [], assertions: [] }]) {
      for (const action of state.actions || []) await performAction(page, root, action);
      for (const assertion of state.assertions || []) await runAssertion(root, assertion);
      const row = {
        id: state.id || 'unnamed',
        box: await captureBox(root),
        aria: config.semantic?.ariaSnapshot === false ? null : await captureAria(root),
        containerEvidence: await captureContainerEvidence(root, config.containerSelectors || []),
        fontProvenance: config.fontProvenance === false ? null : await captureFontProvenance(root),
        layoutShifts: await page.evaluate(() => window.__fastLoopLayoutShifts || []),
      };
      if (config.outputDir && state.capture !== false) {
        const shot = path.join(config.outputDir, `${browserName}-${row.id}.png`);
        ensureDir(shot);
        await root.screenshot({ path: shot, animations: 'disabled' });
        row.screenshot = shot;
      }
      result.states.push(row);
    }
    result.environment = await page.evaluate(() => ({ userAgent: navigator.userAgent, language: navigator.language, devicePixelRatio: devicePixelRatio, viewport: { width: innerWidth, height: innerHeight }, scroll: { x: scrollX, y: scrollY } }));
    result.passed = true;
    if (traceEnabled) await context.tracing.stop();
  } catch (error) {
    result.error = String(error?.stack || error);
    if (traceEnabled) {
      const tracePath = path.join(config.outputDir || path.dirname(outputFile), `${browserName}-trace.zip`);
      ensureDir(tracePath);
      await context.tracing.stop({ path: tracePath });
      result.trace = tracePath;
    }
    if (config.outputDir) {
      try {
        const shot = path.join(config.outputDir, `${browserName}-failure.png`);
        ensureDir(shot);
        await page.screenshot({ path: shot, fullPage: true });
        result.failureScreenshot = shot;
      } catch {}
    }
  } finally {
    await browser.close();
  }
  return result;
}

const results = [];
for (const name of config.browsers || ['chromium']) results.push(await runBrowser(name));
const report = { schemaVersion: 1, kind: 'fast-loop-advanced-capture', passed: results.every((row) => row.passed), results };
ensureDir(outputFile);
fs.writeFileSync(outputFile, JSON.stringify(report, null, 2) + '\n');
if (!report.passed) process.exitCode = 1;
