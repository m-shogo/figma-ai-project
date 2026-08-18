(() => {
  'use strict';

  const root = document.querySelector('[data-ref001-page]');
  if (!root) return;

  document.documentElement.dataset.ref001Js = 'ready';

  // Fixture links intentionally remain unresolved until production/CMS wiring.
  // Prevent placeholder `#` URLs from creating a fake navigation/jump-to-top.
  document.querySelectorAll('a[data-link-status="UNRESOLVED"]').forEach((link) => {
    link.dataset.interactionAuthority = 'PRODUCT_PENDING';
    if (link.getAttribute('href') === '#') {
      link.dataset.interactionStatus = 'DESTINATION_PENDING';
      link.addEventListener('click', (event) => event.preventDefault());
    }
  });

  // The final PC/SP Figma frames author three visible Student Voice states:
  // item 1 open, items 2/3 collapsed. They do NOT author expanded body copy for
  // items 2/3 and contain no Prototype reactions. Do not fabricate that content.
  const voice = root.querySelector('[data-section="student-voice"]');
  if (voice) {
    voice.dataset.interactionAuthority = 'STRONGLY_INFERRED';
    const items = [...voice.querySelectorAll('.ref-voice-item')];
    items.forEach((item, index) => {
      item.dataset.voiceItem = String(index + 1);
      item.dataset.voiceState = item.classList.contains('ref-voice-item--open') ? 'open' : 'collapsed';
    });
    voice.querySelectorAll('.ref-voice-more').forEach((control) => {
      control.dataset.interactionStatus = 'CONTENT_PENDING';
      control.setAttribute('aria-disabled', 'true');
    });
  }

  // Figma displays a 1/4 Messages indicator but only one authored slide exists
  // in the final PC/SP frames. Keep the visual truth, but do not manufacture
  // slides 2-4 or make decorative arrows pretend to be a working carousel.
  const messages = root.querySelector('[data-section="messages"]');
  if (messages) {
    messages.dataset.interactionAuthority = 'STRONGLY_INFERRED';
    messages.dataset.interactionStatus = 'SLIDE_DATA_PENDING';
    messages.dataset.authoredSlides = '1';
    messages.dataset.displayedTotal = '4';
  }

  /**
   * Progressive disclosure controller for future complete content.
   * It is intentionally dormant in the current REF-001 fixture: a disclosure
   * only activates when markup explicitly declares a complete target.
   *
   * Contract:
   *   trigger[data-ref-disclosure="target-id"]
   *   target#target-id[data-content-authority="COMPLETE"]
   */
  document.querySelectorAll('[data-ref-disclosure]').forEach((trigger) => {
    const targetId = trigger.getAttribute('data-ref-disclosure');
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target || target.dataset.contentAuthority !== 'COMPLETE') {
      trigger.dataset.interactionStatus = 'CONTENT_PENDING';
      trigger.setAttribute('aria-disabled', 'true');
      return;
    }

    trigger.dataset.interactionAuthority = 'AUTHORED_CONTENT';
    trigger.setAttribute('aria-controls', targetId);
    trigger.setAttribute('aria-expanded', target.hidden ? 'false' : 'true');
    trigger.addEventListener('click', () => {
      const nextOpen = target.hidden;
      target.hidden = !nextOpen;
      trigger.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
    });
  });
})();
