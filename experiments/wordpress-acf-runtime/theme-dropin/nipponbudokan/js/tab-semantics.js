'use strict';

/**
 * Existing tab rendering/visibility remains owned by common.js.
 * This layer only projects that state into tab semantics and keyboard focus.
 */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.module_tab-wrapper').forEach(function (wrapper, wrapperIndex) {
    const tablist = wrapper.querySelector('.tab-buttons');
    const buttons = Array.from(wrapper.querySelectorAll('.tab-button'));
    const panels = Array.from(wrapper.querySelectorAll('.tab-panel'));

    if (!tablist || buttons.length === 0 || panels.length === 0) return;

    tablist.setAttribute('role', 'tablist');

    const sync = function () {
      buttons.forEach(function (button, index) {
        const panel = panels[index];
        if (!panel) return;

        const tabId = button.id || `tab-control-${wrapperIndex + 1}-${index + 1}`;
        const panelId = panel.id || `tab-panel-${wrapperIndex + 1}-${index + 1}`;
        const active = button.classList.contains('active');

        button.id = tabId;
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-controls', panelId);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
        button.tabIndex = active ? 0 : -1;

        panel.id = panelId;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabId);
        panel.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
    };

    buttons.forEach(function (button, index) {
      button.addEventListener('click', sync);
      button.addEventListener('keydown', function (event) {
        let targetIndex = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          targetIndex = (index + 1) % buttons.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          targetIndex = (index - 1 + buttons.length) % buttons.length;
        } else if (event.key === 'Home') {
          targetIndex = 0;
        } else if (event.key === 'End') {
          targetIndex = buttons.length - 1;
        }

        if (targetIndex === null) return;
        event.preventDefault();
        buttons[targetIndex].focus({ preventScroll: true });
        buttons[targetIndex].click();
      });
    });

    sync();
  });
});
