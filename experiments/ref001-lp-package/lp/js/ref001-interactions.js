(() => {
  'use strict';

  const root = document.querySelector('[data-ref001-page]');
  if (!root) return;

  const TRANSITION_MS = 300;
  const MESSAGE_COUNT = 4;

  document.documentElement.dataset.ref001Js = 'ready';
  document.documentElement.dataset.ref001TransitionMs = String(TRANSITION_MS);

  function guardUnresolvedLinks() {
    document.querySelectorAll('a[data-link-status="UNRESOLVED"]').forEach((link) => {
      link.dataset.interactionAuthority = 'PRODUCT_PENDING';
      if (link.getAttribute('href') !== '#') return;

      link.dataset.interactionStatus = 'DESTINATION_PENDING';
      link.addEventListener('click', (event) => event.preventDefault());
    });
  }

  function initStudentVoice() {
    const section = root.querySelector('[data-section="student-voice"]');
    if (!section) return;

    section.dataset.interactionAuthority = 'PRODUCT_DECISION';

    const syncState = (item, open) => {
      item.classList.toggle('ref-voice-item--open', open);
      item.classList.toggle('ref-voice-item--collapsed', !open);
      item.dataset.voiceState = open ? 'open' : 'collapsed';

      item.querySelector('.ref-voice-disclosure')?.setAttribute('aria-hidden', open ? 'false' : 'true');
      item.querySelector('.ref-voice-toggle')?.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    section.querySelectorAll('.ref-voice-item').forEach((item, index) => {
      item.dataset.voiceItem = String(index + 1);
      syncState(item, item.classList.contains('ref-voice-item--open'));

      const toggle = item.querySelector('.ref-voice-toggle');
      if (!toggle) return;

      toggle.dataset.interactionAuthority = 'PRODUCT_DECISION';
      toggle.addEventListener('click', () => syncState(item, true));
    });
  }

  function loadSwiper() {
    if (window.Swiper) return Promise.resolve(window.Swiper);

    if (!document.querySelector('link[data-ref-swiper]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
      stylesheet.dataset.refSwiper = 'true';
      document.head.append(stylesheet);
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
  }

  function initMessages() {
    const section = root.querySelector('[data-section="messages"]');
    if (!section) return;

    section.dataset.interactionAuthority = 'PRODUCT_DECISION';
    section.dataset.authoredSlides = '1';
    section.dataset.runtimeSlides = String(MESSAGE_COUNT);
    section.dataset.interactionStatus = 'SWIPER_LOADING';

    const swiperElement = section.querySelector('[data-ref-messages-swiper]');
    if (!swiperElement) return;

    const current = section.querySelector('[data-ref-message-current]');
    const progress = section.querySelector('.ref-messages__bar');
    const previous = section.querySelector('.ref-messages__prev');
    const next = section.querySelector('.ref-messages__next');

    const update = (swiper) => {
      const index = (swiper.realIndex ?? swiper.activeIndex ?? 0) + 1;
      if (current) current.textContent = String(index);
      if (progress) progress.style.setProperty('--ref-message-progress', `${(index / MESSAGE_COUNT) * 100}%`);
      section.dataset.activeSlide = String(index);
    };

    loadSwiper()
      .then((SwiperCtor) => {
        if (typeof SwiperCtor !== 'function') {
          throw new Error('Swiper constructor unavailable');
        }

        const qaBrowser = navigator.webdriver === true;
        const swiper = new SwiperCtor(swiperElement, {
          loop: true,
          speed: TRANSITION_MS,
          slidesPerView: 1,
          allowTouchMove: true,
          slideToClickedSlide: true,
          autoplay: qaBrowser
            ? false
            : { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true },
          navigation: { prevEl: previous, nextEl: next },
          on: {
            init: update,
            slideChange: update,
          },
        });

        window.__ref001MessagesSwiper = swiper;
        section.dataset.autoplay = qaBrowser ? 'QA_PAUSED' : 'ACTIVE';
        section.dataset.interactionStatus = 'SWIPER_READY';
      })
      .catch(() => {
        const slides = [...section.querySelectorAll('.ref-messages__slide')];
        if (!slides.length) return;

        section.dataset.interactionStatus = 'SWIPER_FALLBACK';
        let active = 0;

        const show = (index) => {
          active = (index + slides.length) % slides.length;
          slides.forEach((slide, slideIndex) => {
            slide.hidden = slideIndex !== active;
          });
          update({ realIndex: active });
        };

        previous?.addEventListener('click', () => show(active - 1));
        next?.addEventListener('click', () => show(active + 1));
        show(0);
      });
  }

  function initPageTop() {
    const button = document.querySelector('.ref-footer__pagetop');
    if (!button) return;

    const syncVisibility = () => {
      button.classList.toggle('is-visible', window.scrollY > 320);
    };

    const scrollToTop = () => {
      const start = window.scrollY;
      if (start <= 0) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo(0, 0);
        return;
      }

      const startedAt = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / TRANSITION_MS);
        const eased = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, Math.round(start * (1 - eased)));
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    syncVisibility();
    window.addEventListener('scroll', syncVisibility, { passive: true });
    button.addEventListener('click', scrollToTop);
  }

  guardUnresolvedLinks();
  initStudentVoice();
  initMessages();
  initPageTop();
})();
