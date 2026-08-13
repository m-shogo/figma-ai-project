(() => {
  'use strict';

  const THRESHOLD = 0.14;
  const state = { manifest: null, active: false, token: 0, cache: new Map() };
  const $ = (selector) => document.querySelector(selector);

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      const response = await fetch(document.body.dataset.manifest || './manifest.json', { cache: 'no-store' });
      if (!response.ok) return;
      state.manifest = await response.json();
    } catch (_) {
      return;
    }

    if (!hasAnyBaseline()) return;
    installUi();
    bindEvents();
    updateAvailability();
  }

  function installUi() {
    const visualDiff = $('#visual-diff-toggle');
    if (!visualDiff || $('#baseline-diff-toggle')) return;

    const button = document.createElement('button');
    button.id = 'baseline-diff-toggle';
    button.className = 'compact-button';
    button.type = 'button';
    button.textContent = '↩ Baseline Diff';
    button.title = '前回Human Reviewで承認したWebと現在のWebを比較';
    visualDiff.insertAdjacentElement('afterend', button);

    const panel = document.createElement('section');
    panel.id = 'baseline-diff-review';
    panel.hidden = true;
    panel.innerHTML = `
      <header class="baseline-diff__header">
        <div><strong>APPROVED BASELINE REGRESSION</strong><span id="baseline-diff-status">Baseline / Current Web</span></div>
        <div class="baseline-diff__meta">
          <span>Standard · ${THRESHOLD.toFixed(2)}</span>
          <span id="baseline-diff-ratio">差分 —</span>
          <span id="baseline-diff-approved">承認版 —</span>
        </div>
      </header>
      <div class="baseline-diff__crop">
        <canvas id="baseline-diff-canvas"></canvas>
        <div id="baseline-diff-empty">Baselineを解析中…</div>
      </div>
      <p class="baseline-diff__help">ここは「Figmaに似ているか」ではなく「前回OKだったWebを壊していないか」の確認です。細かな文字描画差だけなら追い込みません。</p>`;

    const feedback = $('.feedback-card');
    feedback?.insertAdjacentElement('beforebegin', panel);

    const style = document.createElement('style');
    style.textContent = `
      #baseline-diff-toggle.is-active{background:#25354a!important;color:#fff!important;border-color:#25354a!important}
      #baseline-diff-review{background:#fff;border:1px solid var(--line);border-radius:10px;overflow:hidden}
      .baseline-diff__header{display:flex;justify-content:space-between;gap:16px;padding:14px 16px;border-bottom:1px solid var(--line)}
      .baseline-diff__header strong{display:block;font-size:12px;letter-spacing:.04em}.baseline-diff__header span{font-size:11px;color:var(--muted)}
      .baseline-diff__meta{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.baseline-diff__meta span{border:1px solid var(--line);border-radius:999px;padding:5px 8px;background:var(--surface-muted);font-size:10px;font-weight:800;color:var(--text)}
      .baseline-diff__crop{min-height:260px;max-height:72vh;overflow:auto;padding:16px;background:repeating-conic-gradient(#f6f6f6 0 25%,#ececec 0 50%) 50%/18px 18px}
      #baseline-diff-canvas{display:block;max-width:100%;height:auto;margin:0 auto;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.08)}
      #baseline-diff-empty{display:none;place-items:center;min-height:260px;color:var(--muted);font-size:12px}.baseline-diff__help{margin:0;padding:10px 16px 13px;border-top:1px solid var(--line);color:var(--muted);font-size:11px;line-height:1.65}
      @media(max-width:760px){.baseline-diff__header{display:block}.baseline-diff__meta{justify-content:flex-start;margin-top:10px}.baseline-diff__crop{padding:8px;max-height:64vh}}
    `;
    document.head.appendChild(style);
  }

  function bindEvents() {
    $('#baseline-diff-toggle')?.addEventListener('click', () => state.active ? deactivate() : activate());

    document.addEventListener('click', (event) => {
      if (!state.active) return;
      if (event.target.closest('#visual-diff-toggle, #mode-switch [data-mode]')) {
        deactivate({ restore: false });
        return;
      }
      if (event.target.closest('[data-viewport], #section-nav [data-section]')) {
        setTimeout(() => {
          updateAvailability();
          if (state.active) render();
        }, 0);
      }
    }, true);
  }

  function hasAnyBaseline() {
    return Object.values(state.manifest?.generated?.captures || {}).some((capture) => Boolean(capture?.baseline));
  }

  function viewportKey() {
    return $('[data-viewport].is-active')?.dataset.viewport || 'pc';
  }

  function section() {
    const id = $('#section-nav [data-section].is-active')?.dataset.section || state.manifest.sections[0].id;
    return state.manifest.sections.find((item) => item.id === id) || state.manifest.sections[0];
  }

  function capture() {
    return state.manifest?.generated?.captures?.[viewportKey()] || null;
  }

  function updateAvailability() {
    const button = $('#baseline-diff-toggle');
    if (!button) return;
    const available = Boolean(capture()?.web && capture()?.baseline);
    button.disabled = !available;
    if (!available && state.active) deactivate();
  }

  function activate() {
    if (!capture()?.baseline) return;
    const visualDiff = $('#visual-diff-toggle');
    if (visualDiff?.classList.contains('is-active')) visualDiff.click();
    state.active = true;
    $('#baseline-diff-toggle')?.classList.add('is-active');
    $('#normal-review').hidden = true;
    $('#overlay-review').hidden = true;
    $('#visual-diff-review').hidden = true;
    $('#baseline-diff-review').hidden = false;
    document.querySelectorAll('#mode-switch [data-mode]').forEach((button) => button.classList.remove('is-active'));
    render();
  }

  function deactivate({ restore = true } = {}) {
    state.active = false;
    state.token += 1;
    $('#baseline-diff-toggle')?.classList.remove('is-active');
    $('#baseline-diff-review').hidden = true;
    if (restore) {
      $('#normal-review').hidden = false;
      $('[data-mode="side-by-side"]')?.classList.add('is-active');
    }
  }

  async function loadImage(src) {
    if (state.cache.has(src)) return state.cache.get(src);
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`image load failed: ${src}`));
      image.src = src;
    });
    state.cache.set(src, promise);
    return promise;
  }

  async function render() {
    if (!state.active) return;
    const token = ++state.token;
    const currentCapture = capture();
    const currentSection = section();
    const viewport = state.manifest.viewports[viewportKey()];
    const geometry = currentSection.geometry[viewportKey()];
    const canvas = $('#baseline-diff-canvas');
    const empty = $('#baseline-diff-empty');

    try {
      const [current, baseline] = await Promise.all([loadImage(currentCapture.web), loadImage(currentCapture.baseline)]);
      if (token !== state.token || !state.active) return;

      const sourceWidth = Number(viewport.width);
      const sourceHeight = Number(geometry.height);
      const top = Number(geometry.top || 0);
      const maxPixels = 3000000;
      const scale = Math.min(1, Math.sqrt(maxPixels / Math.max(1, sourceWidth * sourceHeight)));
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const currentCanvas = document.createElement('canvas');
      const baselineCanvas = document.createElement('canvas');
      currentCanvas.width = baselineCanvas.width = width;
      currentCanvas.height = baselineCanvas.height = height;
      const currentCtx = currentCanvas.getContext('2d', { willReadFrequently: true });
      const baselineCtx = baselineCanvas.getContext('2d', { willReadFrequently: true });
      currentCtx.drawImage(current, 0, top, sourceWidth, sourceHeight, 0, 0, width, height);
      baselineCtx.drawImage(baseline, 0, top, sourceWidth, sourceHeight, 0, 0, width, height);
      const a = currentCtx.getImageData(0, 0, width, height).data;
      const b = baselineCtx.getImageData(0, 0, width, height).data;
      const mask = new Uint8Array(width * height);

      for (let pixel = 0, offset = 0; pixel < mask.length; pixel += 1, offset += 4) {
        if (distance(a[offset], a[offset + 1], a[offset + 2], b[offset], b[offset + 1], b[offset + 2]) >= THRESHOLD) mask[pixel] = 1;
      }
      suppressSparse(mask, width, height);

      const output = new ImageData(width, height);
      let changed = 0;
      for (let pixel = 0, offset = 0; pixel < mask.length; pixel += 1, offset += 4) {
        if (mask[pixel]) {
          changed += 1;
          output.data[offset] = 255; output.data[offset + 1] = 32; output.data[offset + 2] = 32; output.data[offset + 3] = 235;
        } else {
          const gray = Math.round((a[offset] + a[offset + 1] + a[offset + 2] + b[offset] + b[offset + 1] + b[offset + 2]) / 6);
          output.data[offset] = gray; output.data[offset + 1] = gray; output.data[offset + 2] = gray; output.data[offset + 3] = 42;
        }
      }

      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').putImageData(output, 0, 0);
      canvas.style.display = 'block'; empty.style.display = 'none';
      const ratio = mask.length ? changed / mask.length : 0;
      $('#baseline-diff-ratio').textContent = `差分 ${(ratio * 100).toFixed(2)}%`;
      $('#baseline-diff-status').textContent = `${currentSection.label} / ${viewportKey().toUpperCase()} / Baseline→Current`;
      $('#baseline-diff-approved').textContent = `承認版 ${state.manifest.generated?.baseline?.approved_source_commit?.slice(0, 8) || 'unknown'}`;
    } catch (error) {
      canvas.style.display = 'none';
      empty.style.display = 'grid';
      empty.textContent = `Baseline Diffを生成できませんでした。${String(error)}`;
    }
  }

  function distance(r1, g1, b1, r2, g2, b2) {
    const r = r1 - r2, g = g1 - g2, b = b1 - b2;
    const y = 0.29889531 * r + 0.58662247 * g + 0.11448223 * b;
    const i = 0.59597799 * r - 0.27417610 * g - 0.32180189 * b;
    const q = 0.21147017 * r - 0.52261711 * g + 0.31114694 * b;
    return Math.min(1, Math.sqrt(0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q) / 180);
  }

  function suppressSparse(mask, width, height) {
    if (width < 3 || height < 3) return;
    const source = mask.slice();
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        if (!source[index]) continue;
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
          if (dx || dy) neighbors += source[(y + dy) * width + (x + dx)] ? 1 : 0;
        }
        if (neighbors < 1) mask[index] = 0;
      }
    }
  }
})();
