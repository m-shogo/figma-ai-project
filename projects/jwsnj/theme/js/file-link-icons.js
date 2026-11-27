// Presentation only: the existing PHP filter owns target/rel.
(() => {
  const scope = '.block-editor_wrap, .editor-styles-wrapper';
  const attachments = new Set(['doc', 'docx', 'docm', 'xls', 'xlsx', 'xlsm', 'png', 'jpg', 'jpeg', 'gif', 'webp']);
  const attribute = 'data-jwsnj-file-icon';

  const classify = raw => {
    const href = raw?.trim();
    // Fragment-only and query-only URLs never describe a separate file.
    if (!href || /^[?#]/.test(href)) return '';
    try {
      const url = new URL(href, document.baseURI);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
      const extension = url.pathname.match(/\.([a-z0-9]+)$/i)?.[1].toLowerCase();
      return extension === 'pdf' ? 'pdf' : attachments.has(extension) ? 'file' : '';
    } catch {
      return '';
    }
  };

  // The editor wrapper adapter uses the same pathname classifier.
  window.jwsnjClassifyFileIcon = classify;

  const sync = anchor => {
    const href = anchor.getAttribute('href');
    // Plain anchors keep their existing CSS fallback.
    const icon = anchor.closest(scope) && /[?#]/.test(href || '') ? classify(href) : '';
    if (icon) {
      if (anchor.getAttribute(attribute) !== icon) anchor.setAttribute(attribute, icon);
    } else if (anchor.hasAttribute(attribute)) {
      anchor.removeAttribute(attribute);
    }
  };

  const scan = node => {
    if (node.nodeType !== 1) return;
    if (node.matches('a')) sync(node);
    node.querySelectorAll('a[href], a[' + attribute + ']').forEach(sync);
  };

  const start = () => {
    scan(document.documentElement);
    // Gutenberg can replace rich-text nodes or update href in place. Watch
    // only href/added nodes; never mutate URLs, saved block attributes or text.
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes') {
          if (record.target.matches('a')) sync(record.target);
        } else {
          for (const node of record.addedNodes) scan(node);
        }
      }
    });
    observer.observe(document.documentElement, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['href']
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
