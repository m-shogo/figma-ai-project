(() => {
  'use strict';

  const root = document.querySelector('[data-ref001-page]');
  if (!root) return;

  const TRANSITION_MS = 300;
  document.documentElement.dataset.ref001Js = 'ready';
  document.documentElement.dataset.ref001TransitionMs = String(TRANSITION_MS);

  // Fixture links intentionally remain unresolved until production/CMS wiring.
  document.querySelectorAll('a[data-link-status="UNRESOLVED"]').forEach((link) => {
    link.dataset.interactionAuthority = 'PRODUCT_PENDING';
    if (link.getAttribute('href') === '#') {
      link.dataset.interactionStatus = 'DESTINATION_PENDING';
      link.addEventListener('click', (event) => event.preventDefault());
    }
  });

  // Human Review explicitly promotes Student Voice 2/3 into interactive dummy
  // content. This is a PRODUCT_DECISION, not retroactive Figma authority.
  const voice = root.querySelector('[data-section="student-voice"]');
  if (voice) {
    voice.dataset.interactionAuthority = 'PRODUCT_DECISION';
    const items = [...voice.querySelectorAll('.ref-voice-item')];
    const syncVoiceState = (item, open) => {
      item.classList.toggle('ref-voice-item--open', open);
      item.classList.toggle('ref-voice-item--collapsed', !open);
      item.dataset.voiceState = open ? 'open' : 'collapsed';
      const disclosure = item.querySelector('.ref-voice-disclosure');
      const toggle = item.querySelector('.ref-voice-toggle');
      if (disclosure) disclosure.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (toggle) {
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        const mark = toggle.querySelector('.ref-voice-toggle__mark');
        const label = toggle.querySelector('span:last-child');
        if (mark) mark.textContent = open ? '−' : '＋';
        if (label) label.textContent = open ? '閉じる' : 'もっと見る';
      }
    };

    items.forEach((item, index) => {
      item.dataset.voiceItem = String(index + 1);
      const initialOpen = item.classList.contains('ref-voice-item--open');
      syncVoiceState(item, initialOpen);
      const toggle = item.querySelector('.ref-voice-toggle');
      if (!toggle) return;
      toggle.dataset.interactionAuthority = 'PRODUCT_DECISION';
      toggle.addEventListener('click', () => {
        syncVoiceState(item, !item.classList.contains('ref-voice-item--open'));
      });
    });
  }

  const loadSwiper = () => {
    if (window.Swiper) return Promise.resolve(window.Swiper);
    if (!document.querySelector('link[data-ref-swiper]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
      css.dataset.refSwiper = 'true';
      document.head.append(css);
    }
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-ref-swiper]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.Swiper), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
      script.defer = true;
      script.dataset.refSwiper = 'true';
      script.addEventListener('load', () => resolve(window.Swiper), { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.append(script);
    });
  };

  // Figma authored slide 1 only; Human Review explicitly requests a four-slide
  // working Swiper with dummy/reused content for interaction QA.
  const messages = root.querySelector('[data-section="messages"]');
  if (messages) {
    messages.dataset.interactionAuthority = 'PRODUCT_DECISION';
    messages.dataset.authoredSlides = '1';
    messages.dataset.runtimeSlides = '4';
    messages.dataset.interactionStatus = 'SWIPER_LOADING';

    const swiperEl = messages.querySelector('[data-ref-messages-swiper]');
    const current = messages.querySelector('[data-ref-message-current]');
    const bar = messages.querySelector('.ref-messages__bar');
    const prev = messages.querySelector('.ref-messages__prev');
    const next = messages.querySelector('.ref-messages__next');
    const update = (swiper) => {
      const index = (swiper.realIndex ?? swiper.activeIndex ?? 0) + 1;
      if (current) current.textContent = String(index);
      if (bar) bar.style.setProperty('--ref-message-progress', `${(index / 4) * 100}%`);
      messages.dataset.activeSlide = String(index);
    };

    if (swiperEl) {
      loadSwiper().then((SwiperCtor) => {
        if (typeof SwiperCtor !== 'function') throw new Error('Swiper constructor unavailable');
        const swiper = new SwiperCtor(swiperEl, {
          loop: true,
          speed: TRANSITION_MS,
          slidesPerView: 1,
          allowTouchMove: true,
          slideToClickedSlide: true,
          autoplay: { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true },
          navigation: { prevEl: prev, nextEl: next },
          on: {
            init(instance) { update(instance); },
            slideChange(instance) { update(instance); },
          },
        });
        window.__ref001MessagesSwiper = swiper;
        messages.dataset.interactionStatus = 'SWIPER_READY';
      }).catch(() => {
        // Keep arrows useful even if a third-party CDN is unavailable.
        messages.dataset.interactionStatus = 'SWIPER_FALLBACK';
        const slides = [...messages.querySelectorAll('.ref-messages__slide')];
        let active = 0;
        const show = (index) => {
          active = (index + slides.length) % slides.length;
          slides.forEach((slide, i) => { slide.hidden = i !== active; });
          update({ realIndex: active });
        };
        prev?.addEventListener('click', () => show(active - 1));
        next?.addEventListener('click', () => show(active + 1));
        show(0);
      });
    }
  }

  // Scroll-following Page Top. It appears only after meaningful scrolling and
  // uses a 300ms JS scroll to match the interaction transition contract.
  const pageTop = root.querySelector('.ref-footer__pagetop');
  if (pageTop) {
    const syncPageTop = () => pageTop.classList.toggle('is-visible', window.scrollY > 320);
    syncPageTop();
    window.addEventListener('scroll', syncPageTop, { passive: true });
    pageTop.addEventListener('click', () => {
      const start = window.scrollY;
      if (start <= 0) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo(0, 0);
        return;
      }
      const started = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - started) / TRANSITION_MS);
        const eased = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, Math.round(start * (1 - eased)));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
})();
