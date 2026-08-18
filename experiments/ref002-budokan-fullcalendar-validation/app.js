(() => {
  const fixtureEvents = [
    ['2023-08-01', 'イベント名', 'neutral'],
    ['2023-08-02', 'イベント名', 'neutral'],
    ['2023-08-03', 'イベント名', 'neutral'],
    ['2023-08-10', 'イベント名', 'neutral'],
    ['2023-08-12', 'イベント名', 'neutral'],
    ['2023-08-13', 'イベント名', 'yellow'],
    ['2023-08-14', 'イベント名', 'neutral'],
    ['2023-08-16', 'イベント名', 'neutral'],
    ['2023-08-18', 'イベント名', 'blue'],
    ['2023-08-19', 'イベント名', 'neutral'],
    ['2023-08-20', 'イベント名', 'yellow'],
    ['2023-08-21', 'イベント名', 'neutral'],
    ['2023-08-22', 'イベント名', 'neutral'],
    ['2023-08-23', 'イベント名', 'blue'],
    ['2023-08-25', 'イベント名', 'neutral'],
    ['2023-08-26', 'イベント名', 'neutral'],
    ['2023-08-27', 'イベント名', 'yellow'],
    ['2023-08-29', 'イベント名', 'neutral']
  ].map(([start, title, kind]) => ({ start, title, allDay: true, extendedProps: { kind } }));

  const partnerAssetPaths = Array.from(
    { length: 12 },
    (_, index) => `./assets/partner/partner-${String(index + 1).padStart(3, '0')}.png`
  );

  const rasterAssetSlots = [
    { key: 'hero', selector: '.hero-image', pc: './assets/figma-raster/hero/hero-pc.png', sp: './assets/figma-raster/hero/hero-sp.png' },
    { key: 'event-01', selector: '.event-photo--one', pc: './assets/figma-raster/events/event-01.png' },
    { key: 'event-02', selector: '.event-photo--two', pc: './assets/figma-raster/events/event-02.png' },
    { key: 'event-03', selector: '.event-photo--three', pc: './assets/figma-raster/events/event-03.png' },
    { key: 'event-04', selector: '.event-photo--four', pc: './assets/figma-raster/events/event-04.png' },
    { key: 'purpose-01', selector: '.purpose-photo--budo', pc: './assets/figma-raster/purpose/purpose-01.png' },
    { key: 'purpose-02', selector: '.purpose-photo--calligraphy', pc: './assets/figma-raster/purpose/purpose-02.png' },
    { key: 'purpose-03', selector: '.purpose-photo--budokan', pc: './assets/figma-raster/purpose/purpose-03.png' },
    { key: 'about-bg', selector: '.about-visual', pc: './assets/figma-raster/about/about-bg-pc.png', sp: './assets/figma-raster/about/about-bg-sp.png' },
    { key: 'about-01', selector: '.about-card-photo--1', pc: './assets/figma-raster/about/about-01.png' },
    { key: 'about-02', selector: '.about-card-photo--2', pc: './assets/figma-raster/about/about-02.png' },
    { key: 'about-03', selector: '.about-card-photo--3', pc: './assets/figma-raster/about/about-03.png' },
    { key: 'about-04', selector: '.about-card-photo--4', pc: './assets/figma-raster/about/about-04.png' },
    { key: 'about-05', selector: '.about-card-photo--5', pc: './assets/figma-raster/about/about-05.png' },
    { key: 'about-06', selector: '.about-card-photo--6', pc: './assets/figma-raster/about/about-06.png' },
    { key: 'instagram-01', selector: '.instagram-thumb:nth-child(1)', pc: './assets/figma-raster/instagram/instagram-01.png' },
    { key: 'instagram-02', selector: '.instagram-thumb:nth-child(2)', pc: './assets/figma-raster/instagram/instagram-02.png' },
    { key: 'instagram-03', selector: '.instagram-thumb:nth-child(3)', pc: './assets/figma-raster/instagram/instagram-03.png' },
    { key: 'instagram-04', selector: '.instagram-thumb:nth-child(4)', pc: './assets/figma-raster/instagram/instagram-04.png' },
    { key: 'instagram-05', selector: '.instagram-thumb:nth-child(5)', pc: './assets/figma-raster/instagram/instagram-05.png' },
    { key: 'banner', selector: '.banner-section', pc: './assets/figma-raster/banner/banner-pc.png', sp: './assets/figma-raster/banner/banner-sp.png' },
    { key: 'footer-map', selector: '.footer-map', pc: './assets/figma-raster/footer/footer-map.png' }
  ];

  // Figma footer logo group 839:4711 is 283.25×55. The original SVG is
  // slightly larger than this connector can transfer as one text response, so
  // it is reconstructed from its authored vector children in the same parent
  // coordinate space. Percentage geometry keeps the exact composition when the
  // existing 200×39 SP logo box scales it down.
  const footerLogoAssets = [
    { src: './assets/footer/budokan-logo-crest.svg', className: 'footer-logo-art__crest', left: 0, top: 0, width: 20.007773, height: 100 },
    { src: './assets/footer/budokan-wordmark-1.svg', className: 'footer-logo-art__wordmark-1', left: 26.213592, top: 34.924927, width: 73.786408, height: 59.263514 },
    { src: './assets/footer/budokan-wordmark-2.svg', className: 'footer-logo-art__wordmark-2', left: 27.279359, top: 5, width: 71.625451, height: 83.199407 },
    { src: './assets/footer/budokan-wordmark-3.svg', className: 'footer-logo-art__wordmark-3', left: 26.496369, top: 5.960083, width: 25.235088, height: 17.445391 }
  ];

  const localDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  function markAssetReady(slot, key) {
    slot.removeAttribute('data-asset-status');
    slot.dataset.assetStatus = 'ready';
    slot.dataset.assetKey = key;
    slot.classList.remove('asset-pending');
    slot.classList.add('asset-ready');
  }

  function initDurableRasterAssets() {
    const isSp = window.matchMedia('(max-width: 767px)').matches;
    let ready = 0;
    let failed = 0;

    rasterAssetSlots.forEach((entry) => {
      const slot = document.querySelector(entry.selector);
      if (!slot) {
        failed += 1;
        document.documentElement.dataset.rasterAssetStatus = 'slot-missing';
        return;
      }
      const src = isSp && entry.sp ? entry.sp : entry.pc;
      const image = new Image();
      image.decoding = 'sync';
      image.addEventListener('load', () => {
        slot.style.backgroundImage = `url("${src}")`;
        slot.style.backgroundRepeat = 'no-repeat';
        slot.style.backgroundPosition = 'center';
        slot.style.backgroundSize = 'cover';
        markAssetReady(slot, entry.key);
        ready += 1;
        document.documentElement.dataset.rasterAssetReady = String(ready);
        if (ready === rasterAssetSlots.length && failed === 0) {
          document.documentElement.dataset.rasterAssetStatus = 'ready';
        }
      }, { once: true });
      image.addEventListener('error', () => {
        failed += 1;
        slot.dataset.assetStatus = 'error';
        slot.dataset.assetKey = entry.key;
        document.documentElement.dataset.rasterAssetErrors = String(failed);
        document.documentElement.dataset.rasterAssetStatus = 'error';
      }, { once: true });
      image.src = src;
    });
  }

  function initDurablePartnerAssets() {
    const slots = [...document.querySelectorAll('.partner-logo[data-asset-status="pending"]')];
    if (slots.length !== partnerAssetPaths.length) {
      document.documentElement.dataset.partnerAssetStatus = 'slot-mismatch';
      return;
    }

    let loaded = 0;
    slots.forEach((slot, index) => {
      const image = document.createElement('img');
      image.src = partnerAssetPaths[index];
      image.alt = '';
      image.width = 40;
      image.height = 40;
      image.decoding = 'sync';

      image.addEventListener('load', () => {
        markAssetReady(slot, `partner-${String(index + 1).padStart(3, '0')}`);
        loaded += 1;
        document.documentElement.dataset.partnerAssetReady = String(loaded);
        if (loaded === partnerAssetPaths.length) {
          document.documentElement.dataset.partnerAssetStatus = 'ready';
        }
      }, { once: true });

      image.addEventListener('error', () => {
        slot.dataset.assetStatus = 'error';
        document.documentElement.dataset.partnerAssetStatus = 'error';
      }, { once: true });

      slot.replaceChildren(image);
    });
  }

  function initDurableFooterLogo() {
    const slot = document.querySelector('.footer-logo[data-asset-status="pending"]');
    if (!slot) {
      document.documentElement.dataset.footerLogoAssetStatus = 'slot-missing';
      return;
    }

    const art = document.createElement('span');
    art.className = 'footer-logo-art';
    art.setAttribute('aria-hidden', 'true');
    art.style.cssText = 'position:relative;display:block;width:100%;height:100%;';
    let loaded = 0;
    let failed = false;

    footerLogoAssets.forEach(({ src, className, left, top, width, height }) => {
      const image = document.createElement('img');
      image.src = src;
      image.alt = '';
      image.className = className;
      image.decoding = 'sync';
      image.style.cssText = `position:absolute;display:block;max-width:none;left:${left}%;top:${top}%;width:${width}%;height:${height}%;`;
      image.addEventListener('load', () => {
        loaded += 1;
        document.documentElement.dataset.footerLogoAssetReady = String(loaded);
        if (!failed && loaded === footerLogoAssets.length) {
          slot.style.display = 'block';
          slot.style.fontSize = '0';
          slot.style.letterSpacing = '0';
          markAssetReady(slot, 'footer-logo');
          document.documentElement.dataset.footerLogoAssetStatus = 'ready';
        }
      }, { once: true });
      image.addEventListener('error', () => {
        failed = true;
        slot.dataset.assetStatus = 'error';
        document.documentElement.dataset.footerLogoAssetStatus = 'error';
      }, { once: true });
      art.append(image);
    });

    slot.replaceChildren(art);
  }

  function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl || !window.FullCalendar) {
      document.documentElement.dataset.calendarStatus = 'missing-runtime';
      return;
    }

    const monthLabel = document.querySelector('.calendar-month');
    const viewButtons = [...document.querySelectorAll('[data-ref002-calendar-view]')];

    const syncViewTabs = (viewType) => {
      viewButtons.forEach((candidate) => {
        candidate.setAttribute('aria-selected', String(candidate.dataset.ref002CalendarView === viewType));
      });
      document.documentElement.dataset.calendarUiView = viewType;
    };

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      initialDate: '2023-08-01',
      locale: 'ja',
      firstDay: 1,
      fixedWeekCount: false,
      showNonCurrentDates: false,
      headerToolbar: false,
      height: 'auto',
      dayMaxEvents: 1,
      displayEventTime: false,
      events: fixtureEvents,
      dayHeaderFormat: { weekday: 'short' },
      dayHeaderContent(info) {
        return { html: `<span data-ref002-weekday-label>${info.text}</span>` };
      },
      dayHeaderDidMount(info) {
        info.el.dataset.ref002Weekday = String(info.date.getDay());
      },
      dayCellTopContent(info) {
        return { html: `<span data-ref002-date-number>${info.date.getDate()}</span>` };
      },
      dayCellDidMount(info) {
        info.el.dataset.ref002Date = localDateKey(info.date);
        info.el.dataset.ref002DayOfWeek = String(info.date.getDay());
      },
      eventDidMount(info) {
        const kind = info.event.extendedProps.kind || 'neutral';
        info.el.classList.add('ref002-calendar-event', `event-${kind}`);
        info.el.dataset.ref002Event = 'true';
        info.el.dataset.ref002EventKind = kind;
      },
      viewDidMount(info) {
        info.el.dataset.ref002View = info.view.type;
        syncViewTabs(info.view.type);
      },
      datesSet(info) {
        const date = info.view.currentStart || calendar.getDate();
        monthLabel.textContent = `${date.getMonth() + 1}月`;
        document.documentElement.dataset.calendarView = info.view.type;
        document.documentElement.dataset.calendarMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        syncViewTabs(info.view.type);
      }
    });

    calendar.render();

    document.querySelector('.calendar-prev').addEventListener('click', () => calendar.prev());
    document.querySelector('.calendar-next').addEventListener('click', () => calendar.next());

    viewButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const requestedView = button.dataset.ref002CalendarView;
        syncViewTabs(requestedView);
        calendar.changeView(requestedView);
        syncViewTabs(calendar.view.type);
        requestAnimationFrame(() => syncViewTabs(calendar.view.type));
      });
    });

    window.__ref002Calendar = calendar;
    document.documentElement.classList.add('calendar-ready');
    document.documentElement.dataset.calendarStatus = 'ready';
  }

  window.addEventListener('DOMContentLoaded', () => {
    initDurableRasterAssets();
    initDurablePartnerAssets();
    initDurableFooterLogo();
    initCalendar();
  }, { once: true });
})();