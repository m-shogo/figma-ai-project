#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [contractFile, screenshotFile, measurementFile] = process.argv.slice(2);
if (!contractFile || !screenshotFile || !measurementFile) {
  throw new Error('usage: section_capture.mjs contract.json actual.png actual.measurement.json');
}
const contract = JSON.parse(fs.readFileSync(contractFile, 'utf8'));
const viewport = contract.viewport;
const browser = await chromium.launch({ headless: true });
const browserVersion = browser.version();
const context = await browser.newContext({
  viewport: { width: viewport.width, height: viewport.height },
  deviceScaleFactor: viewport.dpr || 1,
  reducedMotion: 'reduce',
  locale: contract.environment?.locale || 'ja-JP',
  timezoneId: contract.environment?.timezone || 'Asia/Tokyo',
});
const page = await context.newPage();
await page.goto(contract.implementation.url, { waitUntil: contract.environment?.waitUntil || 'networkidle' });
await page.addStyleTag({ content: `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important;caret-color:transparent!important}` });
if (contract.environment?.injectCss) await page.addStyleTag({ content: String(contract.environment.injectCss) });
if (contract.environment?.readySelector) await page.locator(contract.environment.readySelector).waitFor();
const locator = page.locator(contract.implementation.selector).nth(contract.implementation.index || 0);
await locator.waitFor({ state: 'visible' });
await locator.scrollIntoViewIfNeeded();
await page.evaluate(async () => {
  if (document.fonts?.ready) await document.fonts.ready;
});

const imageDecodeTimeoutMs = Math.max(0, Number(contract.environment?.imageDecodeTimeoutMs ?? 750));
if (imageDecodeTimeoutMs > 0) {
  await locator.evaluate(async (element, timeoutMs) => {
    const waitForImage = async (img) => {
      if (!img.complete) {
        await Promise.race([
          new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          }),
          new Promise((resolve) => setTimeout(resolve, timeoutMs)),
        ]);
      }
      if (img.decode) {
        await Promise.race([
          img.decode().catch(() => undefined),
          new Promise((resolve) => setTimeout(resolve, timeoutMs)),
        ]);
      }
    };
    await Promise.all([...element.querySelectorAll('img')].map(waitForImage));
  }, imageDecodeTimeoutMs);
}

const stabilityTimeoutMs = Math.max(0, Number(contract.environment?.stabilityTimeoutMs ?? 900));
const stabilityTolerancePx = Math.max(0, Number(contract.environment?.stabilityTolerancePx ?? 0.25));
const stabilityFrames = Math.max(2, Number(contract.environment?.stabilityFrames ?? 3));
const stability = await locator.evaluate(async (element, config) => {
  const box = () => {
    const r = element.getBoundingClientRect();
    return {
      x: r.x + window.scrollX,
      y: r.y + window.scrollY,
      width: r.width,
      height: r.height,
      viewportX: r.x,
      viewportY: r.y,
    };
  };
  const step = (a, b) => Math.max(...['x', 'y', 'width', 'height'].map((key) => Math.abs((a[key] || 0) - (b[key] || 0))));
  const samples = [box()];
  let consecutive = 1;
  const started = performance.now();
  while (performance.now() - started < config.timeoutMs && consecutive < config.frames) {
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    const current = box();
    const delta = step(samples[samples.length - 1], current);
    samples.push(current);
    consecutive = delta <= config.tolerancePx ? consecutive + 1 : 1;
  }
  return {
    stable: consecutive >= config.frames,
    stableConsecutive: consecutive,
    requiredConsecutive: config.frames,
    tolerancePx: config.tolerancePx,
    elapsedMs: Math.round((performance.now() - started) * 100) / 100,
    samples: samples.slice(-8),
  };
}, { timeoutMs: stabilityTimeoutMs, tolerancePx: stabilityTolerancePx, frames: stabilityFrames });

fs.mkdirSync(path.dirname(screenshotFile), { recursive: true });
await locator.screenshot({ path: screenshotFile, animations: 'disabled' });

const measurement = await locator.evaluate((element, probeSelectors) => {
  const box = (node) => {
    const r = node.getBoundingClientRect();
    return {
      x: r.x + window.scrollX,
      y: r.y + window.scrollY,
      width: r.width,
      height: r.height,
      viewportX: r.x,
      viewportY: r.y,
    };
  };
  const styleOf = (node) => {
    const s = getComputedStyle(node);
    return {
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      color: s.color,
      backgroundColor: s.backgroundColor,
      backgroundImage: s.backgroundImage,
      gap: s.gap,
      rowGap: s.rowGap,
      columnGap: s.columnGap,
      paddingTop: s.paddingTop,
      paddingRight: s.paddingRight,
      paddingBottom: s.paddingBottom,
      paddingLeft: s.paddingLeft,
      marginTop: s.marginTop,
      marginRight: s.marginRight,
      marginBottom: s.marginBottom,
      marginLeft: s.marginLeft,
      borderTopWidth: s.borderTopWidth,
      borderRightWidth: s.borderRightWidth,
      borderBottomWidth: s.borderBottomWidth,
      borderLeftWidth: s.borderLeftWidth,
      borderRadius: s.borderRadius,
      boxShadow: s.boxShadow,
      filter: s.filter,
      transform: s.transform,
      position: s.position,
      overflow: s.overflow,
      zIndex: s.zIndex,
    };
  };
  const typographyFingerprint = (node) => {
    const s = getComputedStyle(node);
    const range = document.createRange();
    range.selectNodeContents(node);
    const lineRects = [...range.getClientRects()].slice(0, 120).map((rect) => ({
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
      width: rect.width,
      height: rect.height,
      viewportX: rect.x,
      viewportY: rect.y,
    }));
    const text = (node.textContent || '').trim().slice(0, 512);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let glyphMetrics = {};
    if (ctx && text) {
      ctx.font = s.font;
      const m = ctx.measureText(text);
      glyphMetrics = {
        width: m.width,
        actualBoundingBoxLeft: m.actualBoundingBoxLeft,
        actualBoundingBoxRight: m.actualBoundingBoxRight,
        actualBoundingBoxAscent: m.actualBoundingBoxAscent,
        actualBoundingBoxDescent: m.actualBoundingBoxDescent,
      };
    }
    return {
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      lineRects,
      glyphMetrics,
    };
  };
  const declarationRecord = (style) => {
    const declarations = {};
    const priorities = {};
    for (let index = 0; index < style.length; index += 1) {
      const prop = style.item(index);
      if (!prop) continue;
      declarations[prop] = style.getPropertyValue(prop);
      const priority = style.getPropertyPriority(prop);
      if (priority) priorities[prop] = priority;
    }
    return { declarations, priorities };
  };
  const stylesheetDiagnostics = [];
  const readableSheets = [];
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules;
      readableSheets.push({ sheet, rules });
      stylesheetDiagnostics.push({ href: sheet.href || null, accessible: true, ruleCount: rules.length });
    } catch (error) {
      stylesheetDiagnostics.push({ href: sheet.href || null, accessible: false, ruleCount: null, error: String(error?.name || error) });
    }
  }
  const nestedRuleIsActive = (rule) => {
    const type = rule?.constructor?.name || '';
    if (type === 'CSSMediaRule') return window.matchMedia(rule.conditionText).matches;
    if (type === 'CSSSupportsRule') {
      try { return CSS.supports(rule.conditionText); } catch { return true; }
    }
    return true;
  };
  const matchingRules = (node) => {
    const found = [];
    let sourceOrder = 0;
    const visit = (rules, href) => {
      for (const rule of rules || []) {
        if (found.length >= 80) return;
        if (rule.selectorText && rule.style) {
          sourceOrder += 1;
          try {
            if (node.matches(rule.selectorText)) {
              const record = declarationRecord(rule.style);
              found.push({ selector: rule.selectorText, href: href || null, sourceOrder, ...record });
            }
          } catch {}
        }
        if (rule.cssRules?.length && nestedRuleIsActive(rule)) visit(rule.cssRules, href);
      }
    };
    for (const entry of readableSheets) {
      visit(entry.rules, entry.sheet.href);
      if (found.length >= 80) break;
    }
    if (node instanceof HTMLElement && node.style?.length) {
      const record = declarationRecord(node.style);
      found.unshift({ selector: '<inline-style>', href: null, inline: true, sourceOrder: Number.MAX_SAFE_INTEGER, ...record });
    }
    return found;
  };
  const semanticKind = (node) => {
    const tag = node.tagName?.toLowerCase() || '';
    const role = node.getAttribute?.('role') || '';
    if (tag === 'img' || tag === 'picture') return 'image';
    if (tag === 'svg') return 'vector';
    if (['button', 'a', 'input', 'select', 'textarea'].includes(tag) || ['button', 'link', 'checkbox', 'radio', 'switch'].includes(role)) return 'control';
    if (/^h[1-6]$/.test(tag) || ['p', 'li', 'dt', 'dd', 'label', 'figcaption', 'blockquote'].includes(tag)) return 'text';
    return null;
  };

  const images = [...element.querySelectorAll('img')].map((img) => ({
    box: box(img),
    objectFit: getComputedStyle(img).objectFit,
    objectPosition: getComputedStyle(img).objectPosition,
    src: img.currentSrc || img.src,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    assetSlot: img.getAttribute('data-asset-slot') || null,
  }));
  const semanticRegions = [];
  for (const node of element.querySelectorAll('*')) {
    if (semanticRegions.length >= 160) break;
    const kind = semanticKind(node);
    if (!kind) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    semanticRegions.push({
      kind,
      tag: node.tagName.toLowerCase(),
      role: node.getAttribute('role') || null,
      box: box(node),
      textLength: kind === 'text' || kind === 'control' ? (node.textContent || '').trim().length : 0,
      asset: kind === 'image' ? (node.currentSrc || node.src || null) : null,
    });
  }
  const probes = {};
  for (const selector of probeSelectors || []) {
    const node = element.querySelector(selector);
    if (node) probes[selector] = {
      box: box(node),
      style: styleOf(node),
      text: node.textContent?.trim() || '',
      typographyFingerprint: typographyFingerprint(node),
      matchedRules: matchingRules(node),
    };
  }
  const matchedRules = matchingRules(element);
  const matchedRuleSummary = {
    rootCount: matchedRules.length,
    probeCounts: Object.fromEntries(Object.entries(probes).map(([selector, value]) => [selector, value.matchedRules?.length || 0])),
    totalObserved: matchedRules.length + Object.values(probes).reduce((sum, value) => sum + (value.matchedRules?.length || 0), 0),
  };
  return {
    box: box(element),
    style: styleOf(element),
    text: element.textContent?.trim() || '',
    typographyFingerprint: typographyFingerprint(element),
    matchedRules,
    matchedRuleSummary,
    stylesheetDiagnostics,
    images,
    semanticRegions,
    probes,
    environment: {
      devicePixelRatio: window.devicePixelRatio,
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: { width: innerWidth, height: innerHeight },
      scroll: { x: window.scrollX, y: window.scrollY },
      documentFontsStatus: document.fonts?.status || null,
    },
  };
}, contract.probes || []);

measurement.captureStability = stability;
measurement.environment.browserVersion = browserVersion;
measurement.environment.headless = true;
fs.mkdirSync(path.dirname(measurementFile), { recursive: true });
fs.writeFileSync(measurementFile, JSON.stringify(measurement, null, 2) + '\n');
await browser.close();
