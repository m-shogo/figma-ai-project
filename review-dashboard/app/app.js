(() => {
  'use strict';

  const VERDICT_LABELS = {
    almost_same: '✅ ほぼ同じ',
    slightly_different: '🟡 少し違う',
    clearly_different: '🔴 明らかに違う',
  };
  const CATEGORIES = [
    ['text', '文字'],
    ['image', '画像'],
    ['crop', '画像の切り取り'],
    ['position', '位置'],
    ['size', '大きさ'],
    ['spacing', '余白'],
    ['color', '色'],
    ['background', '背景'],
    ['impression', '全体の雰囲気'],
    ['motion', '動き'],
    ['other', 'その他'],
  ];

  const state = {
    manifest: null,
    viewport: 'pc',
    sectionId: 'full-page',
    mode: 'side-by-side',
    mobilePanel: 'web',
    feedback: {},
    blinkTimer: null,
    blinkOn: false,
  };

  const el = {};
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    bindElements();
    buildCategoryChips();
    bindStaticEvents();
    const manifestUrl = document.body.dataset.manifest || './manifest.json';
    try {
      const response = await fetch(manifestUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
      state.manifest = await response.json();
    } catch (error) {
      document.body.innerHTML = `<main style="padding:24px;font-family:sans-serif"><h1>Review manifestを読み込めませんでした</h1><pre>${escapeHtml(String(error))}</pre></main>`;
      return;
    }

    state.feedback = loadFeedback();
    hydrateHeader();
    buildSectionNav();
    renderMetrics();
    updateViewportButtons();
    applySectionAndViewport({ focusFeedback: false });
    updateMobilePanel();
    window.addEventListener('resize', debounce(() => {
      resizeLiveViewport();
      if (state.mode === 'overlay') renderOverlay();
    }, 120));
  }

  function bindElements() {
    Object.assign(el, {
      runLabel: $('#run-label'),
      referenceTitle: $('#reference-title'),
      runSelect: $('#run-select'),
      previewLink: $('#preview-link'),
      viewportSwitch: $('#viewport-switch'),
      modeSwitch: $('#mode-switch'),
      overlayStatus: $('#overlay-status'),
      sectionNav: $('#section-nav'),
      sectionMenuToggle: $('#section-menu-toggle'),
      webPanel: $('#web-panel'),
      figmaPanel: $('#figma-panel'),
      normalReview: $('#normal-review'),
      webStage: $('#web-stage'),
      webScaleBox: $('#web-scale-box'),
      webFrame: $('#web-frame'),
      figmaFrame: $('#figma-frame'),
      webViewportLabel: $('#web-viewport-label'),
      mobilePanelTabs: $('#mobile-panel-tabs'),
      overlayReview: $('#overlay-review'),
      overlayCrop: $('#overlay-crop'),
      overlayCanvas: $('#overlay-canvas'),
      overlayWeb: $('#overlay-web'),
      overlayFigma: $('#overlay-figma'),
      overlayOpacity: $('#overlay-opacity'),
      overlayHelp: $('#overlay-help'),
      blinkToggle: $('#blink-toggle'),
      verdictGroup: $('#verdict-group'),
      categoryChips: $('#category-chips'),
      comment: $('#feedback-comment'),
      copyCurrent: $('#copy-current'),
      copyAll: $('#copy-all'),
      saveStatus: $('#save-status'),
      metricsList: $('#metrics-list'),
      feedbackStatus: $('#human-feedback-status'),
      currentSectionLabel: $('#current-section-label'),
      toast: $('#toast'),
    });
  }

  function bindStaticEvents() {
    el.viewportSwitch.addEventListener('click', (event) => {
      const button = event.target.closest('[data-viewport]');
      if (!button) return;
      state.viewport = button.dataset.viewport;
      stopBlink();
      updateViewportButtons();
      applySectionAndViewport({ focusFeedback: false });
    });

    el.modeSwitch.addEventListener('click', (event) => {
      const button = event.target.closest('[data-mode]');
      if (!button || button.disabled) return;
      setMode(button.dataset.mode);
    });

    el.sectionMenuToggle.addEventListener('click', () => {
      const open = el.sectionNav.classList.toggle('is-open');
      el.sectionMenuToggle.setAttribute('aria-expanded', String(open));
    });

    el.mobilePanelTabs.addEventListener('click', (event) => {
      const button = event.target.closest('[data-mobile-panel]');
      if (!button) return;
      state.mobilePanel = button.dataset.mobilePanel;
      updateMobilePanel();
    });

    el.webFrame.addEventListener('load', () => {
      resizeLiveViewport();
      window.setTimeout(scrollWebToSection, 60);
    });

    el.verdictGroup.addEventListener('click', (event) => {
      const button = event.target.closest('[data-verdict]');
      if (!button) return;
      const current = currentFeedback();
      current.verdict = current.verdict === button.dataset.verdict ? '' : button.dataset.verdict;
      persistAndRenderFeedback();
    });

    el.categoryChips.addEventListener('change', () => {
      const current = currentFeedback();
      current.categories = $$('[data-category]:checked').map((input) => input.value);
      persistAndRenderFeedback();
    });

    el.comment.addEventListener('input', debounce(() => {
      currentFeedback().comment = el.comment.value;
      persistFeedback();
      flashSaveStatus();
    }, 180));

    el.copyCurrent.addEventListener('click', async () => {
      const markdown = feedbackMarkdown([currentFeedbackEntry()], true);
      await copyText(markdown);
      showToast('このSectionのFBをコピーしました');
    });
    el.copyAll.addEventListener('click', async () => {
      const entries = allFeedbackEntries().filter(hasFeedback);
      const markdown = feedbackMarkdown(entries, false);
      await copyText(markdown);
      showToast(entries.length ? `全FB ${entries.length}件をコピーしました` : 'FBはまだ入力されていません');
    });

    el.overlayOpacity.addEventListener('input', () => {
      el.overlayWeb.style.opacity = String(Number(el.overlayOpacity.value) / 100);
    });
    el.blinkToggle.addEventListener('click', () => {
      state.blinkOn ? stopBlink() : startBlink();
    });
  }

  function hydrateHeader() {
    const manifest = state.manifest;
    document.title = `${manifest.reference_id} Human Review`;
    el.referenceTitle.textContent = manifest.reference_id;
    el.runLabel.textContent = manifest.run_label;
    el.runSelect.innerHTML = `<option value="${escapeHtml(manifest.run_slug)}">${escapeHtml(manifest.run_label)}</option>`;
    el.runSelect.disabled = true;
    el.previewLink.href = manifest.generated?.preview_url || '../preview/';
    el.webFrame.src = manifest.generated?.preview_url || '../preview/';
    el.feedbackStatus.textContent = manifest.human_feedback_status || 'PENDING';
  }

  function buildSectionNav() {
    el.sectionNav.innerHTML = '';
    for (const section of state.manifest.sections) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.section = section.id;
      button.textContent = section.label;
      button.addEventListener('click', () => {
        state.sectionId = section.id;
        stopBlink();
        applySectionAndViewport({ focusFeedback: false });
        el.sectionNav.classList.remove('is-open');
        el.sectionMenuToggle.setAttribute('aria-expanded', 'false');
      });
      el.sectionNav.append(button);
    }
  }

  function buildCategoryChips() {
    el.categoryChips.innerHTML = CATEGORIES.map(([value, label]) => (
      `<label><input type="checkbox" data-category value="${value}"><span>${label}</span></label>`
    )).join('');
  }

  function updateViewportButtons() {
    $$('[data-viewport]').forEach((button) => button.classList.toggle('is-active', button.dataset.viewport === state.viewport));
  }

  function applySectionAndViewport() {
    const section = currentSection();
    const viewport = currentViewport();
    el.webViewportLabel.textContent = `${viewport.width}px`;
    el.currentSectionLabel.textContent = `${section.label} / ${state.viewport.toUpperCase()}`;
    $$('[data-section]').forEach((button) => button.classList.toggle('is-active', button.dataset.section === state.sectionId));
    updateFigmaEmbed();
    resizeLiveViewport();
    scrollWebToSection();
    renderFeedback();
    updateOverlayAvailability();
    if (state.mode === 'overlay') renderOverlay();
  }

  function updateFigmaEmbed() {
    const section = currentSection();
    const nodeId = state.viewport === 'pc' ? section.figma_pc_node : section.figma_sp_node;
    const figma = state.manifest.figma;
    const params = new URLSearchParams({
      'embed-host': figma.embed_host || 'figma-ai-project-review',
      'node-id': String(nodeId).replace(':', '-'),
      footer: 'false',
      'page-selector': 'false',
      'viewport-controls': 'true',
      theme: 'light',
    });
    el.figmaFrame.src = `https://embed.figma.com/design/${encodeURIComponent(figma.file_key)}/${encodeURIComponent(figma.file_name || 'design')}?${params.toString()}`;
  }

  function resizeLiveViewport() {
    if (!state.manifest || !el.webStage.clientWidth) return;
    const viewport = currentViewport();
    const availableWidth = Math.max(280, el.webStage.clientWidth - 18);
    const scale = Math.min(1, availableWidth / viewport.width);
    const iframeHeight = Math.max(520, el.webStage.clientHeight / scale);
    el.webFrame.style.width = `${viewport.width}px`;
    el.webFrame.style.height = `${iframeHeight}px`;
    el.webFrame.style.transform = `scale(${scale})`;
    el.webScaleBox.style.width = `${viewport.width * scale}px`;
    el.webScaleBox.style.height = `${iframeHeight * scale}px`;
  }

  function scrollWebToSection() {
    if (!state.manifest) return;
    try {
      const win = el.webFrame.contentWindow;
      const doc = el.webFrame.contentDocument;
      const section = currentSection();
      if (!win || !doc) return;
      if (!section.web_selector) {
        win.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }
      const nodes = doc.querySelectorAll(section.web_selector);
      const target = nodes[Math.max(0, Number(section.web_index || 0))];
      if (target) target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
    } catch (_) {
      // The generated preview is same-origin. If that contract changes, keep live preview usable
      // and simply fall back to manual scrolling rather than inventing brittle cross-origin sync.
    }
  }

  function updateMobilePanel() {
    $$('[data-mobile-panel]').forEach((button) => button.classList.toggle('is-active', button.dataset.mobilePanel === state.mobilePanel));
    el.webPanel.classList.toggle('is-mobile-active', state.mobilePanel === 'web');
    el.figmaPanel.classList.toggle('is-mobile-active', state.mobilePanel === 'figma');
  }

  function setMode(mode) {
    if (mode === 'overlay' && !overlayAvailable()) return;
    state.mode = mode;
    stopBlink();
    $$('[data-mode]').forEach((button) => button.classList.toggle('is-active', button.dataset.mode === mode));
    el.normalReview.hidden = mode === 'overlay';
    el.overlayReview.hidden = mode !== 'overlay';
    el.normalReview.classList.toggle('mode-web-only', mode === 'web-only');
    el.normalReview.classList.toggle('mode-figma-only', mode === 'figma-only');
    if (mode === 'overlay') renderOverlay();
  }

  function updateOverlayAvailability() {
    const button = $('[data-mode="overlay"]');
    const available = overlayAvailable();
    button.disabled = !available;
    button.title = available ? 'deterministic captureで重ねて比較' : 'Figma deterministic captureが未materializeのため現在は利用不可';
    el.overlayStatus.textContent = available ? 'Overlay ready' : 'Overlay: Figma deterministic capture待ち';
    if (!available && state.mode === 'overlay') setMode('side-by-side');
  }

  function overlayAvailable() {
    const captures = state.manifest?.generated?.captures?.[state.viewport];
    return Boolean(captures?.web && captures?.figma);
  }

  function renderOverlay() {
    if (!overlayAvailable()) return;
    const section = currentSection();
    const viewport = currentViewport();
    const captures = state.manifest.generated.captures[state.viewport];
    const geometry = section.geometry[state.viewport];
    const width = viewport.width;
    const maxDisplay = Math.max(280, el.overlayCrop.clientWidth - 34);
    const scale = Math.min(1, maxDisplay / width);
    const displayWidth = width * scale;
    const displayHeight = geometry.height * scale;
    const figmaOffset = (geometry.top + Number(viewport.figma_device_chrome_px || 0)) * scale;
    const webOffset = geometry.top * scale;

    el.overlayCanvas.style.width = `${displayWidth}px`;
    el.overlayCanvas.style.height = `${displayHeight}px`;
    for (const image of [el.overlayFigma, el.overlayWeb]) {
      image.style.width = `${displayWidth}px`;
      image.style.height = 'auto';
    }
    el.overlayFigma.src = captures.figma;
    el.overlayWeb.src = captures.web;
    el.overlayFigma.style.top = `${-figmaOffset}px`;
    el.overlayWeb.style.top = `${-webOffset}px`;
    el.overlayWeb.style.opacity = String(Number(el.overlayOpacity.value) / 100);
    el.overlayHelp.textContent = state.viewport === 'sp'
      ? `SP Figmaのdevice chrome ${viewport.figma_device_chrome_px}px はWeb比較座標から除外しています。`
      : '同一section座標でFigmaとWebのdeterministic captureを重ねています。';
  }

  function startBlink() {
    if (!overlayAvailable()) return;
    state.blinkOn = true;
    el.blinkToggle.textContent = 'Blink停止';
    let showWeb = true;
    state.blinkTimer = window.setInterval(() => {
      showWeb = !showWeb;
      el.overlayWeb.style.opacity = showWeb ? '1' : '0';
    }, 550);
  }

  function stopBlink() {
    if (state.blinkTimer) window.clearInterval(state.blinkTimer);
    state.blinkTimer = null;
    state.blinkOn = false;
    if (el.blinkToggle) el.blinkToggle.textContent = 'Blink';
    if (el.overlayWeb && el.overlayOpacity) el.overlayWeb.style.opacity = String(Number(el.overlayOpacity.value) / 100);
  }

  function currentSection() {
    return state.manifest.sections.find((section) => section.id === state.sectionId) || state.manifest.sections[0];
  }

  function currentViewport() {
    return state.manifest.viewports[state.viewport];
  }

  function storageKey() {
    return `figma-ai-human-review:${state.manifest.run_id}:v1`;
  }

  function feedbackKey(viewport = state.viewport, sectionId = state.sectionId) {
    return `${viewport}::${sectionId}`;
  }

  function loadFeedback() {
    if (!state.manifest) return {};
    try {
      const raw = localStorage.getItem(storageKey());
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function currentFeedback() {
    const key = feedbackKey();
    if (!state.feedback[key]) state.feedback[key] = { verdict: '', categories: [], comment: '' };
    return state.feedback[key];
  }

  function persistFeedback() {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(state.feedback));
    } catch (_) {
      el.saveStatus.textContent = 'ブラウザ保存を利用できません';
      el.saveStatus.style.color = '#a83c36';
    }
  }

  function persistAndRenderFeedback() {
    persistFeedback();
    renderFeedback();
    flashSaveStatus();
  }

  function renderFeedback() {
    const current = currentFeedback();
    $$('[data-verdict]').forEach((button) => button.classList.toggle('is-active', button.dataset.verdict === current.verdict));
    $$('[data-category]').forEach((input) => { input.checked = current.categories.includes(input.value); });
    if (document.activeElement !== el.comment) el.comment.value = current.comment || '';
  }

  function flashSaveStatus() {
    el.saveStatus.textContent = '保存しました';
    window.clearTimeout(flashSaveStatus.timer);
    flashSaveStatus.timer = window.setTimeout(() => { el.saveStatus.textContent = 'ブラウザ内に自動保存'; }, 1100);
  }

  function currentFeedbackEntry() {
    return {
      ...currentFeedback(),
      viewport: state.viewport,
      sectionId: state.sectionId,
      sectionLabel: currentSection().label,
    };
  }

  function allFeedbackEntries() {
    const entries = [];
    for (const viewport of ['pc', 'sp']) {
      for (const section of state.manifest.sections) {
        const value = state.feedback[feedbackKey(viewport, section.id)] || { verdict: '', categories: [], comment: '' };
        entries.push({ ...value, viewport, sectionId: section.id, sectionLabel: section.label });
      }
    }
    return entries;
  }

  function hasFeedback(entry) {
    return Boolean(entry.verdict || (entry.categories && entry.categories.length) || (entry.comment && entry.comment.trim()));
  }

  function feedbackMarkdown(entries, includeEmpty) {
    const manifest = state.manifest;
    const usable = includeEmpty ? entries : entries.filter(hasFeedback);
    const lines = [
      `# ${manifest.reference_id} Human Visual Review`,
      '',
      `Run: ${manifest.run_label} (${manifest.run_id})`,
      `Human feedback status at publish: ${manifest.human_feedback_status || 'PENDING'}`,
      '',
    ];
    if (!usable.length) {
      lines.push('まだフィードバックは入力されていません。', '');
      return lines.join('\n');
    }
    for (const entry of usable) {
      lines.push(`## ${entry.sectionLabel} / ${entry.viewport.toUpperCase()}`, '');
      lines.push('判定:', entry.verdict ? VERDICT_LABELS[entry.verdict] : '未選択', '');
      lines.push('カテゴリ:');
      if (entry.categories?.length) {
        for (const category of entry.categories) {
          const found = CATEGORIES.find(([value]) => value === category);
          lines.push(`- ${found ? found[1] : category}`);
        }
      } else {
        lines.push('- なし');
      }
      lines.push('', 'コメント:', entry.comment?.trim() || 'なし', '');
    }
    return lines.join('\n');
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  function renderMetrics() {
    const labels = {
      first_pass_fidelity: 'First Pass Fidelity',
      automated_final_fidelity: 'Automated Final Fidelity',
      post_freeze_repair_rounds: 'Repair rounds',
      pc_section_geometry_delta_px: 'PC geometry delta',
      sp_section_geometry_delta_px: 'SP geometry delta',
      runtime_failures: 'Runtime failures',
      human_editability: 'Human Editability',
      owner_blocking_questions: 'Owner questions',
      interaction_inventions: 'Interaction inventions',
      cms_inventions: 'CMS inventions',
    };
    el.metricsList.innerHTML = Object.entries(state.manifest.metrics || {}).map(([key, value]) => {
      const suffix = key.includes('delta_px') ? 'px' : key === 'human_editability' ? '/10' : key.includes('fidelity') ? '/80' : '';
      return `<div><dt>${escapeHtml(labels[key] || key)}</dt><dd>${escapeHtml(String(value))}${suffix}</dd></div>`;
    }).join('');
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { el.toast.hidden = true; }, 1800);
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  }
})();
