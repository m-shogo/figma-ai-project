(() => {
  'use strict';

  const VIEWPORT_ORDER = ['pc', 'sp'];
  const VERDICT_LABELS = {
    almost_same: '✅ ほぼ同じ',
    slightly_different: '🟡 少し違う',
    clearly_different: '🔴 明らかに違う',
  };
  const CATEGORY_LABELS = {
    text: '文字', image: '画像', crop: '画像の切り取り', position: '位置', size: '大きさ',
    spacing: '余白', color: '色', background: '背景', impression: '全体の雰囲気', motion: '動き', other: 'その他',
  };

  const assist = {
    manifest: null,
    settings: { autoAdvanceGreen: true, unreviewedOnly: false },
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      const manifestUrl = document.body.dataset.manifest || './manifest.json';
      const response = await fetch(manifestUrl, { cache: 'no-store' });
      if (!response.ok) return;
      assist.manifest = await response.json();
      assist.settings = loadSettings();
      await waitForDashboard();
      bindControls();
      applySettingsToControls();
      refreshAssistUi();
    } catch (_) {
      // The core review app must remain usable even if this convenience layer fails.
    }
  }

  function waitForDashboard() {
    return new Promise((resolve) => {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if ($$('#section-nav [data-section]').length === assist.manifest.sections.length || attempts > 80) {
          window.clearInterval(timer);
          resolve();
        }
      }, 50);
    });
  }

  function bindControls() {
    $('#next-unreviewed')?.addEventListener('click', () => navigateNextUnreviewed());
    $('#unreviewed-only')?.addEventListener('change', (event) => {
      assist.settings.unreviewedOnly = Boolean(event.target.checked);
      saveSettings();
      refreshAssistUi();
    });
    $('#auto-advance-green')?.addEventListener('change', (event) => {
      assist.settings.autoAdvanceGreen = Boolean(event.target.checked);
      saveSettings();
    });
    $('#bulk-green')?.addEventListener('click', bulkMarkCurrentViewportGreen);

    document.addEventListener('click', (event) => {
      const verdict = event.target.closest('[data-verdict]');
      if (verdict) {
        window.setTimeout(() => {
          refreshAssistUi();
          if (assist.settings.autoAdvanceGreen && verdict.dataset.verdict === 'almost_same') {
            const current = currentEntry();
            const stored = readFeedback()[entryKey(current.viewport, current.sectionId)];
            if (stored?.verdict === 'almost_same') navigateNextUnreviewed();
          }
        }, 0);
        return;
      }
      if (event.target.closest('[data-viewport], [data-section]')) {
        window.setTimeout(refreshAssistUi, 0);
      }
    });

    $('#category-chips')?.addEventListener('change', () => window.setTimeout(refreshAssistUi, 0));
    $('#feedback-comment')?.addEventListener('input', debounce(() => {
      syncCurrentDomToStorage();
      refreshAssistUi();
    }, 220));

    document.addEventListener('keydown', handleKeyboard);
  }

  function applySettingsToControls() {
    const auto = $('#auto-advance-green');
    const filter = $('#unreviewed-only');
    if (auto) auto.checked = assist.settings.autoAdvanceGreen;
    if (filter) filter.checked = assist.settings.unreviewedOnly;
  }

  function handleKeyboard(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.matches('textarea,input,select') || target.isContentEditable)) return;

    const verdictByKey = { '1': 'almost_same', '2': 'slightly_different', '3': 'clearly_different' };
    if (verdictByKey[event.key]) {
      event.preventDefault();
      $(`[data-verdict="${verdictByKey[event.key]}"]`)?.click();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigateRelative(1);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigateRelative(-1);
      return;
    }
    if (event.key.toLowerCase() === 'p') {
      event.preventDefault();
      $('[data-viewport="pc"]')?.click();
      return;
    }
    if (event.key.toLowerCase() === 's') {
      event.preventDefault();
      $('[data-viewport="sp"]')?.click();
      return;
    }
    if (event.key.toLowerCase() === 'n') {
      event.preventDefault();
      navigateNextUnreviewed();
      return;
    }
    if (event.key.toLowerCase() === 'u') {
      event.preventDefault();
      const filter = $('#unreviewed-only');
      if (filter) {
        filter.checked = !filter.checked;
        filter.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  function storageKey() {
    return `figma-ai-human-review:${assist.manifest.run_id}:v1`;
  }

  function settingsKey() {
    return `figma-ai-human-review:${assist.manifest.run_id}:assist:v1`;
  }

  function entryKey(viewport, sectionId) {
    return `${viewport}::${sectionId}`;
  }

  function readFeedback() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey()) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writeFeedback(feedback) {
    localStorage.setItem(storageKey(), JSON.stringify(feedback));
  }

  function loadSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(settingsKey()) || '{}');
      return {
        autoAdvanceGreen: parsed.autoAdvanceGreen !== false,
        unreviewedOnly: Boolean(parsed.unreviewedOnly),
      };
    } catch (_) {
      return { autoAdvanceGreen: true, unreviewedOnly: false };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(settingsKey(), JSON.stringify(assist.settings));
    } catch (_) {
      // Convenience preferences are non-critical.
    }
  }

  function sequence() {
    const result = [];
    for (const section of assist.manifest.sections) {
      for (const viewport of VIEWPORT_ORDER) {
        result.push({ viewport, sectionId: section.id, sectionLabel: section.label });
      }
    }
    return result;
  }

  function currentEntry() {
    const viewport = $('[data-viewport].is-active')?.dataset.viewport || 'pc';
    const sectionButton = $('#section-nav [data-section].is-active');
    const sectionId = sectionButton?.dataset.section || assist.manifest.sections[0].id;
    const section = assist.manifest.sections.find((item) => item.id === sectionId) || assist.manifest.sections[0];
    return { viewport, sectionId, sectionLabel: section.label };
  }

  function navigateTo(entry) {
    if (!entry) return;
    const current = currentEntry();
    if (current.viewport !== entry.viewport) $(`[data-viewport="${entry.viewport}"]`)?.click();
    if (current.sectionId !== entry.sectionId) $(`#section-nav [data-section="${cssEscape(entry.sectionId)}"]`)?.click();
    window.setTimeout(refreshAssistUi, 0);
  }

  function navigateRelative(delta) {
    const items = sequence();
    const current = currentEntry();
    const index = items.findIndex((item) => item.viewport === current.viewport && item.sectionId === current.sectionId);
    const targetIndex = Math.max(0, Math.min(items.length - 1, index + delta));
    if (targetIndex === index) {
      showAssistToast(delta > 0 ? '最後の確認項目です' : '最初の確認項目です');
      return;
    }
    navigateTo(items[targetIndex]);
  }

  function navigateNextUnreviewed() {
    const feedback = readFeedback();
    const items = sequence();
    const current = currentEntry();
    const currentIndex = items.findIndex((item) => item.viewport === current.viewport && item.sectionId === current.sectionId);
    for (let offset = 1; offset <= items.length; offset += 1) {
      const candidate = items[(currentIndex + offset) % items.length];
      if (!isReviewed(feedback[entryKey(candidate.viewport, candidate.sectionId)])) {
        navigateTo(candidate);
        return;
      }
    }
    showAssistToast('🎉 PC / SP 全26項目の判定が完了しました');
  }

  function isReviewed(value) {
    return Boolean(value?.verdict);
  }

  function isActionable(value) {
    if (!value) return false;
    return value.verdict === 'slightly_different' || value.verdict === 'clearly_different'
      || Boolean(value.comment?.trim()) || Boolean(value.categories?.length);
  }

  function isEmpty(value) {
    return !value || (!value.verdict && !value.comment?.trim() && !value.categories?.length);
  }

  function refreshAssistUi() {
    if (!assist.manifest) return;
    const feedback = readFeedback();
    const items = sequence();
    const reviewed = items.filter((item) => isReviewed(feedback[entryKey(item.viewport, item.sectionId)])).length;
    const actionable = items.filter((item) => isActionable(feedback[entryKey(item.viewport, item.sectionId)])).length;

    const label = $('#review-progress-label');
    const progress = $('#review-progress');
    if (label) label.textContent = `${reviewed} / ${items.length}確認済み`;
    if (progress) {
      progress.max = items.length;
      progress.value = reviewed;
    }
    const next = $('#next-unreviewed');
    if (next) next.disabled = reviewed === items.length;

    updateSectionStatuses(feedback);
    updateIssueLink(feedback, reviewed, items.length, actionable);
  }

  function updateSectionStatuses(feedback) {
    const current = currentEntry();
    $$('#section-nav [data-section]').forEach((button) => {
      const value = feedback[entryKey(current.viewport, button.dataset.section)];
      const reviewed = isReviewed(value);
      const actionable = isActionable(value);
      button.classList.toggle('has-review', reviewed);
      button.classList.toggle('has-difference', actionable);
      button.dataset.reviewState = actionable ? 'difference' : reviewed ? 'reviewed' : 'unreviewed';
      button.hidden = assist.settings.unreviewedOnly && reviewed && !button.classList.contains('is-active');
    });
  }

  function syncCurrentDomToStorage() {
    const current = currentEntry();
    const feedback = readFeedback();
    const key = entryKey(current.viewport, current.sectionId);
    const activeVerdict = $('[data-verdict].is-active')?.dataset.verdict || '';
    const categories = $$('[data-category]:checked').map((input) => input.value);
    const comment = $('#feedback-comment')?.value || '';
    feedback[key] = { ...(feedback[key] || {}), verdict: activeVerdict, categories, comment };
    try { writeFeedback(feedback); } catch (_) { /* core app handles persistence errors */ }
  }

  function bulkMarkCurrentViewportGreen() {
    const current = currentEntry();
    const feedback = readFeedback();
    const emptySections = assist.manifest.sections.filter((section) => isEmpty(feedback[entryKey(current.viewport, section.id)]));
    if (!emptySections.length) {
      showAssistToast(`${current.viewport.toUpperCase()}に未入力項目はありません`);
      return;
    }
    const ok = window.confirm(`${current.viewport.toUpperCase()}の未入力 ${emptySections.length}件だけを「✅ ほぼ同じ」にします。\n🟡/🔴・コメント・カテゴリ入力済みの項目は変更しません。`);
    if (!ok) return;
    for (const section of emptySections) {
      feedback[entryKey(current.viewport, section.id)] = {
        verdict: 'almost_same', categories: [], comment: '', review_source: 'bulk_viewport_green',
      };
    }
    writeFeedback(feedback);
    window.location.reload();
  }

  function updateIssueLink(feedback, reviewed, total, actionableCount) {
    const link = $('#create-issue');
    if (!link) return;
    const repository = assist.manifest.feedback?.issue_repository;
    if (!repository || !actionableCount) {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.textContent = actionableCount ? 'Issue設定なし' : '修正依頼なし';
      return;
    }
    const titlePrefix = assist.manifest.feedback?.issue_title_prefix || '[Human Review]';
    const title = `${titlePrefix} ${assist.manifest.reference_id} ${assist.manifest.run_label}`;
    const body = issueMarkdown(feedback, reviewed, total);
    const params = new URLSearchParams({ title, body });
    link.href = `https://github.com/${encodeRepo(repository)}/issues/new?${params.toString()}`;
    link.setAttribute('aria-disabled', 'false');
    link.textContent = `修正依頼を作る (${actionableCount}) ↗`;
  }

  function issueMarkdown(feedback, reviewed, total) {
    const lines = [
      `# ${assist.manifest.reference_id} Human Review 修正依頼`,
      '',
      `Run: ${assist.manifest.run_label} (${assist.manifest.run_id})`,
      `Review progress: ${reviewed}/${total}`,
      `Dashboard: ${window.location.href.split('#')[0]}`,
      '',
      '> Human Review Dashboardで入力した人間の目視フィードバックです。Figmaをsource of truthとして原因を確認し、修正後は同じReview URLへ再deployしてください。共有ルールへの昇格は別途generalization判断を行ってください。',
      '',
    ];
    for (const item of sequence()) {
      const value = feedback[entryKey(item.viewport, item.sectionId)];
      if (!isActionable(value)) continue;
      lines.push(`## ${item.sectionLabel} / ${item.viewport.toUpperCase()}`, '');
      lines.push(`- 判定: ${VERDICT_LABELS[value.verdict] || '未選択'}`);
      const categories = (value.categories || []).map((category) => CATEGORY_LABELS[category] || category);
      lines.push(`- カテゴリ: ${categories.length ? categories.join(' / ') : 'なし'}`);
      lines.push(`- コメント: ${value.comment?.trim() || 'なし'}`, '');
    }
    return lines.join('\n');
  }

  function encodeRepo(repository) {
    return String(repository).split('/').map(encodeURIComponent).join('/');
  }

  function showAssistToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showAssistToast.timer);
    showAssistToast.timer = window.setTimeout(() => { toast.hidden = true; }, 2200);
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }
})();
