(() => {
  'use strict';

  const MAX_ANALYSIS_PIXELS = 3000000;
  const HOTSPOT_LIMIT = 5;
  const PROFILES = {
    loose: { label: 'Loose', threshold: 0.20, minNeighbors: 2 },
    standard: { label: 'Standard', threshold: 0.14, minNeighbors: 1 },
    strict: { label: 'Strict', threshold: 0.08, minNeighbors: 0 },
  };

  const state = {
    manifest: null,
    active: false,
    sensitivity: 'standard',
    renderToken: 0,
    cache: new Map(),
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const trigger = $('#visual-diff-toggle');
    const review = $('#visual-diff-review');
    if (!trigger || !review) return;

    try {
      const manifestUrl = document.body.dataset.manifest || './manifest.json';
      const response = await fetch(manifestUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
      state.manifest = await response.json();
    } catch (error) {
      trigger.disabled = true;
      trigger.title = `Visual Diff unavailable: ${String(error)}`;
      return;
    }

    trigger.addEventListener('click', () => {
      if (state.active) deactivateDiff();
      else activateDiff();
    });

    $('#diff-sensitivity')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-diff-sensitivity]');
      if (!button) return;
      state.sensitivity = button.dataset.diffSensitivity;
      updateSensitivityButtons();
      if (state.active) renderDiff();
    });

    $('#diff-hotspots')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-hotspot-analysis-y]');
      if (button) focusHotspot(button);
    });

    document.addEventListener('click', (event) => {
      if (event.target.closest('#mode-switch [data-mode]') && state.active) {
        deactivateDiff({ restoreCore: false });
        return;
      }
      if (event.target.closest('[data-viewport], #section-nav [data-section]')) {
        window.setTimeout(() => {
          updateAvailability();
          if (state.active) renderDiff();
        }, 0);
      }
    }, true);

    updateSensitivityButtons();
    updateAvailability();
  }

  function currentViewportKey() {
    return $('[data-viewport].is-active')?.dataset.viewport || 'pc';
  }

  function currentSection() {
    const id = $('#section-nav [data-section].is-active')?.dataset.section || state.manifest.sections[0].id;
    return state.manifest.sections.find((section) => section.id === id) || state.manifest.sections[0];
  }

  function currentCapture() {
    return state.manifest?.generated?.captures?.[currentViewportKey()] || null;
  }

  function available() {
    const capture = currentCapture();
    return Boolean(capture?.web && capture?.figma);
  }

  function updateAvailability() {
    const trigger = $('#visual-diff-toggle');
    if (!trigger) return;
    trigger.disabled = !available();
    trigger.title = available()
      ? 'FigmaとWebのdeterministic captureから知覚差分を表示'
      : 'Figma/Web deterministic captureが揃っていません';
    if (!available() && state.active) deactivateDiff();
  }

  function activateDiff() {
    if (!available()) return;
    state.active = true;
    $('#visual-diff-toggle')?.classList.add('is-active');
    $('#normal-review').hidden = true;
    $('#overlay-review').hidden = true;
    $('#visual-diff-review').hidden = false;
    $$('[data-mode]').forEach((button) => button.classList.remove('is-active'));
    renderDiff();
  }

  function deactivateDiff({ restoreCore = true } = {}) {
    state.active = false;
    state.renderToken += 1;
    $('#visual-diff-toggle')?.classList.remove('is-active');
    $('#visual-diff-review').hidden = true;
    if (restoreCore) {
      $('#normal-review').hidden = false;
      const sideBySide = $('[data-mode="side-by-side"]');
      sideBySide?.classList.add('is-active');
    }
  }

  function updateSensitivityButtons() {
    $$('[data-diff-sensitivity]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.diffSensitivity === state.sensitivity);
      button.setAttribute('aria-pressed', String(button.dataset.diffSensitivity === state.sensitivity));
    });
    const profile = PROFILES[state.sensitivity];
    const label = $('#diff-profile-label');
    if (label) label.textContent = `${profile.label} · threshold ${profile.threshold.toFixed(2)}`;
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

  async function renderDiff() {
    if (!state.active || !available()) return;
    const token = ++state.renderToken;
    const review = $('#visual-diff-review');
    const status = $('#diff-status');
    const canvas = $('#visual-diff-canvas');
    const empty = $('#visual-diff-empty');
    const hotspotPanel = $('#diff-hotspots');
    if (!review || !status || !canvas || !empty) return;

    review.classList.add('visual-diff-loading');
    status.textContent = '解析中…';
    empty.hidden = true;
    canvas.hidden = true;
    if (hotspotPanel) {
      hotspotPanel.hidden = true;
      hotspotPanel.innerHTML = '';
    }

    try {
      const viewportKey = currentViewportKey();
      const viewport = state.manifest.viewports[viewportKey];
      const section = currentSection();
      const geometry = section.geometry[viewportKey];
      const capture = currentCapture();
      const [webImage, figmaImage] = await Promise.all([loadImage(capture.web), loadImage(capture.figma)]);
      if (token !== state.renderToken || !state.active) return;

      const sourceWidth = Number(viewport.width);
      const sourceHeight = Number(geometry.height);
      const totalPixels = sourceWidth * sourceHeight;
      const analysisScale = Math.min(1, Math.sqrt(MAX_ANALYSIS_PIXELS / Math.max(1, totalPixels)));
      const width = Math.max(1, Math.round(sourceWidth * analysisScale));
      const height = Math.max(1, Math.round(sourceHeight * analysisScale));
      const webTop = Number(geometry.top || 0);
      const figmaTop = webTop + Number(viewport.figma_device_chrome_px || 0);

      const webCanvas = document.createElement('canvas');
      const figmaCanvas = document.createElement('canvas');
      webCanvas.width = figmaCanvas.width = width;
      webCanvas.height = figmaCanvas.height = height;
      const webCtx = webCanvas.getContext('2d', { willReadFrequently: true });
      const figmaCtx = figmaCanvas.getContext('2d', { willReadFrequently: true });
      webCtx.drawImage(webImage, 0, webTop, sourceWidth, sourceHeight, 0, 0, width, height);
      figmaCtx.drawImage(figmaImage, 0, figmaTop, sourceWidth, sourceHeight, 0, 0, width, height);

      const webData = webCtx.getImageData(0, 0, width, height).data;
      const figmaData = figmaCtx.getImageData(0, 0, width, height).data;
      const profile = PROFILES[state.sensitivity];
      const mask = new Uint8Array(width * height);
      const distances = new Float32Array(width * height);

      for (let pixel = 0, offset = 0; pixel < mask.length; pixel += 1, offset += 4) {
        const distance = perceptualDistance(
          webData[offset], webData[offset + 1], webData[offset + 2],
          figmaData[offset], figmaData[offset + 1], figmaData[offset + 2],
        );
        distances[pixel] = distance;
        if (distance >= profile.threshold) mask[pixel] = 1;
      }

      if (profile.minNeighbors > 0) suppressSparseNoise(mask, width, height, profile.minNeighbors);

      const output = new ImageData(width, height);
      let changed = 0;
      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;

      for (let pixel = 0, offset = 0; pixel < mask.length; pixel += 1, offset += 4) {
        if (mask[pixel]) {
          changed += 1;
          const x = pixel % width;
          const y = Math.floor(pixel / width);
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          const strength = Math.min(1, Math.max(0, (distances[pixel] - profile.threshold) / Math.max(0.001, 1 - profile.threshold)));
          output.data[offset] = 255;
          output.data[offset + 1] = Math.round(58 * (1 - strength));
          output.data[offset + 2] = Math.round(58 * (1 - strength));
          output.data[offset + 3] = 235;
        } else {
          const gray = Math.round((
            webData[offset] + webData[offset + 1] + webData[offset + 2]
            + figmaData[offset] + figmaData[offset + 1] + figmaData[offset + 2]
          ) / 6);
          output.data[offset] = gray;
          output.data[offset + 1] = gray;
          output.data[offset + 2] = gray;
          output.data[offset + 3] = 48;
        }
      }

      const hotspots = findHotspots(mask, width, height, analysisScale, HOTSPOT_LIMIT);
      canvas.width = width;
      canvas.height = height;
      const canvasContext = canvas.getContext('2d');
      canvasContext.putImageData(output, 0, 0);
      drawHotspotBoxes(canvasContext, hotspots);
      canvas.hidden = false;
      renderHotspots(hotspots, analysisScale);

      const ratio = mask.length ? changed / mask.length : 0;
      const bbox = changed ? {
        x: Math.round(minX / analysisScale),
        y: Math.round(minY / analysisScale),
        width: Math.round((maxX - minX + 1) / analysisScale),
        height: Math.round((maxY - minY + 1) / analysisScale),
      } : null;

      $('#diff-ratio').textContent = `差分 ${(ratio * 100).toFixed(2)}%`;
      $('#diff-bbox').textContent = bbox
        ? `範囲 x${bbox.x} y${bbox.y} ${bbox.width}×${bbox.height}`
        : '目立つ差分なし';
      $('#diff-scale').textContent = analysisScale < 0.999
        ? `解析 ${Math.round(analysisScale * 100)}%縮小`
        : '解析 1:1';
      status.textContent = `${section.label} / ${viewportKey.toUpperCase()} / ${profile.label}`;
      $('#visual-diff-help').innerHTML = helpText(profile, ratio, analysisScale, hotspots.length);
    } catch (error) {
      canvas.hidden = true;
      empty.hidden = false;
      empty.textContent = `Diffを生成できませんでした。${String(error)}`;
      status.textContent = 'Diff unavailable';
      if (hotspotPanel) hotspotPanel.hidden = true;
    } finally {
      if (token === state.renderToken) review.classList.remove('visual-diff-loading');
    }
  }

  function perceptualDistance(r1, g1, b1, r2, g2, b2) {
    const r = r1 - r2;
    const g = g1 - g2;
    const b = b1 - b2;
    const y = 0.29889531 * r + 0.58662247 * g + 0.11448223 * b;
    const i = 0.59597799 * r - 0.27417610 * g - 0.32180189 * b;
    const q = 0.21147017 * r - 0.52261711 * g + 0.31114694 * b;
    return Math.min(1, Math.sqrt(0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q) / 180);
  }

  function suppressSparseNoise(mask, width, height, minNeighbors) {
    if (width < 3 || height < 3) return;
    const source = mask.slice();
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        if (!source[index]) continue;
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            neighbors += source[(y + dy) * width + (x + dx)] ? 1 : 0;
          }
        }
        if (neighbors < minNeighbors) mask[index] = 0;
      }
    }
  }

  function findHotspots(mask, width, height, analysisScale, limit) {
    if (!mask.length || width < 1 || height < 1) return [];
    const tileSize = Math.max(8, Math.round(24 * analysisScale));
    const columns = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);
    const counts = new Uint32Array(columns * rows);

    for (let pixel = 0; pixel < mask.length; pixel += 1) {
      if (!mask[pixel]) continue;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      const tileX = Math.floor(x / tileSize);
      const tileY = Math.floor(y / tileSize);
      counts[tileY * columns + tileX] += 1;
    }

    const minTilePixels = Math.max(3, Math.round(tileSize * tileSize * 0.02));
    const minHotspotPixels = Math.max(8, Math.round(tileSize * tileSize * 0.06));
    const visited = new Uint8Array(counts.length);
    const queue = new Int32Array(counts.length);
    const hotspots = [];

    for (let start = 0; start < counts.length; start += 1) {
      if (visited[start] || counts[start] < minTilePixels) continue;
      let head = 0;
      let tail = 0;
      queue[tail++] = start;
      visited[start] = 1;
      let redPixels = 0;
      let minTileX = columns;
      let minTileY = rows;
      let maxTileX = -1;
      let maxTileY = -1;

      while (head < tail) {
        const index = queue[head++];
        const tileX = index % columns;
        const tileY = Math.floor(index / columns);
        redPixels += counts[index];
        if (tileX < minTileX) minTileX = tileX;
        if (tileY < minTileY) minTileY = tileY;
        if (tileX > maxTileX) maxTileX = tileX;
        if (tileY > maxTileY) maxTileY = tileY;

        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            const nextX = tileX + dx;
            const nextY = tileY + dy;
            if (nextX < 0 || nextX >= columns || nextY < 0 || nextY >= rows) continue;
            const next = nextY * columns + nextX;
            if (visited[next] || counts[next] < minTilePixels) continue;
            visited[next] = 1;
            queue[tail++] = next;
          }
        }
      }

      if (redPixels < minHotspotPixels) continue;
      const analysisX = minTileX * tileSize;
      const analysisY = minTileY * tileSize;
      const analysisWidth = Math.min(width, (maxTileX + 1) * tileSize) - analysisX;
      const analysisHeight = Math.min(height, (maxTileY + 1) * tileSize) - analysisY;
      hotspots.push({
        redPixels,
        analysisX,
        analysisY,
        analysisWidth,
        analysisHeight,
        x: Math.round(analysisX / analysisScale),
        y: Math.round(analysisY / analysisScale),
        width: Math.round(analysisWidth / analysisScale),
        height: Math.round(analysisHeight / analysisScale),
        sourcePixelEstimate: Math.round(redPixels / Math.max(0.0001, analysisScale * analysisScale)),
      });
    }

    return hotspots
      .sort((a, b) => b.redPixels - a.redPixels)
      .slice(0, limit)
      .map((hotspot, index) => ({ ...hotspot, rank: index + 1 }));
  }

  function drawHotspotBoxes(context, hotspots) {
    if (!hotspots.length) return;
    context.save();
    context.lineWidth = 2;
    context.strokeStyle = 'rgba(255, 214, 0, .95)';
    context.fillStyle = 'rgba(20, 20, 20, .92)';
    context.font = 'bold 11px sans-serif';
    for (const hotspot of hotspots) {
      const x = hotspot.analysisX + 1;
      const y = hotspot.analysisY + 1;
      const width = Math.max(1, hotspot.analysisWidth - 2);
      const height = Math.max(1, hotspot.analysisHeight - 2);
      context.strokeRect(x, y, width, height);
      const label = `#${hotspot.rank}`;
      const labelWidth = context.measureText(label).width + 8;
      context.fillRect(x, y, labelWidth, 18);
      context.fillStyle = '#fff';
      context.fillText(label, x + 4, y + 13);
      context.fillStyle = 'rgba(20, 20, 20, .92)';
    }
    context.restore();
  }

  function renderHotspots(hotspots, analysisScale) {
    const panel = $('#diff-hotspots');
    if (!panel) return;
    if (!hotspots.length) {
      panel.hidden = true;
      panel.innerHTML = '';
      return;
    }
    panel.hidden = false;
    panel.innerHTML = [
      '<strong>優先して見る差分</strong>',
      `<span>大きな赤い塊を上位${hotspots.length}件に整理。クリックでその位置へ移動します。</span>`,
      '<div class="visual-diff-hotspots__list">',
      ...hotspots.map((hotspot) => (
        `<button type="button" data-hotspot-analysis-y="${hotspot.analysisY}" title="x${hotspot.x} y${hotspot.y} ${hotspot.width}×${hotspot.height}">`
        + `<b>#${hotspot.rank}</b> x${hotspot.x} y${hotspot.y} · ${hotspot.width}×${hotspot.height} · 約${hotspot.sourcePixelEstimate.toLocaleString()}px`
        + '</button>'
      )),
      '</div>',
      analysisScale < 0.999 ? '<small>座標は元画像基準に換算しています。</small>' : '',
    ].join('');
  }

  function focusHotspot(button) {
    const canvas = $('#visual-diff-canvas');
    const crop = $('.visual-diff-crop');
    if (!canvas || !crop || canvas.hidden) return;
    const analysisY = Number(button.dataset.hotspotAnalysisY || 0);
    const displayScale = canvas.getBoundingClientRect().height / Math.max(1, canvas.height);
    const target = Math.max(0, analysisY * displayScale - crop.clientHeight * 0.25);
    crop.scrollTo({ top: target, behavior: 'smooth' });
  }

  function helpText(profile, ratio, analysisScale, hotspotCount) {
    const scaleNote = analysisScale < 0.999
      ? `Full-page等の大きな画像はブラウザ負荷を抑えるため${Math.round(analysisScale * 100)}%で解析しています。Section比較は原則1:1です。`
      : 'このSectionは1:1ピクセルで解析しています。';
    const signal = ratio > 0.20
      ? '<strong>赤い大きな塊を優先確認してください。</strong>'
      : ratio > 0.05
        ? '<strong>まとまった赤い輪郭・面が修正候補です。</strong>'
        : '文字輪郭だけの細かな赤はFigma/Chromeの描画差の可能性が高く、基本は追い込みすぎません。';
    const hotspotNote = hotspotCount
      ? `上位${hotspotCount}件のHotspotは確認順を決めるための補助で、原因の自動断定はしません。`
      : '大きなHotspotが無ければ、残差を機械スコアだけで追い込みません。';
    return `${signal} ${profile.label}は知覚色差threshold ${profile.threshold.toFixed(2)}。${profile.minNeighbors ? `孤立ノイズを近傍${profile.minNeighbors}px未満で抑制。` : '孤立ノイズも残す仕上げ確認用。'} ${hotspotNote} ${scaleNote} Diff率は自動PASS/FAILには使いません。`;
  }
})();
