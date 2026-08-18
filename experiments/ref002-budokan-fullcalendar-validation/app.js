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

  const localDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

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
        slot.removeAttribute('data-asset-status');
        slot.dataset.assetStatus = 'ready';
        slot.classList.add('asset-ready');
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
    initDurablePartnerAssets();
    initCalendar();
  }, { once: true });
})();
