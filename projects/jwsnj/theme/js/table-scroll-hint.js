'use strict';

// Figma SP 445:3237. Progressive enhancement of editor-selected scrollable tables.
(() => {
    const init = () => {
        const mobile = window.matchMedia('(width < 48rem)');
        const figures = document.querySelectorAll(
            '.block-editor_wrap :is(.wp-block-table, .wp-block-flexible-table-block-table).is-scroll-on-mobile'
        );
        const updates = [];
        const observer = typeof window.ResizeObserver === 'function'
            ? new window.ResizeObserver(() => updates.forEach(update => update()))
            : null;

        figures.forEach(figure => {
            const table = figure.querySelector(':scope > table');
            if (!table || table.classList.contains('is-stacked-on-mobile') ||
                figure.classList.contains('scroll-hint') ||
                figure.querySelector(':scope > .scroll-hint-icon-wrap')) return;

            let initialized = false;
            let ownedTabindex = false;
            let ownedLabel = false;
            const label = '横スクロール可能な表';

            const update = () => {
                const overflowing = mobile.matches && figure.clientWidth > 0 &&
                    figure.scrollWidth > figure.clientWidth + 1 &&
                    /^(auto|scroll)$/.test(window.getComputedStyle(figure).overflowX);

                if (overflowing) {
                    if (!figure.hasAttribute('tabindex')) {
                        figure.setAttribute('tabindex', '0');
                        ownedTabindex = true;
                    }
                    if (!figure.hasAttribute('aria-label') &&
                        !figure.hasAttribute('aria-labelledby') &&
                        !figure.querySelector(':scope > figcaption')) {
                        figure.setAttribute('aria-label', label);
                        ownedLabel = true;
                    }
                    if (!initialized && typeof window.ScrollHint === 'function') {
                        // The bundled library sets inline overflow/position; CSS and
                        // the table plugin must remain authoritative after resize.
                        const inline = figure.style.cssText;
                        try {
                            new window.ScrollHint(figure, {
                                suggestiveShadow: false,
                                enableOverflowScrolling: false,
                                i18n: { scrollable: 'スクロールできます' }
                            });
                        } finally {
                            figure.style.cssText = inline;
                        }
                        initialized = true;
                        figure.setAttribute('data-jwsnj-table-hint', '');
                        const hint = figure.querySelector(':scope > .scroll-hint-icon-wrap');
                        if (hint) hint.setAttribute('aria-hidden', 'true');
                    }
                } else {
                    if (ownedTabindex && figure.getAttribute('tabindex') === '0') {
                        figure.removeAttribute('tabindex');
                    }
                    if (ownedLabel && figure.getAttribute('aria-label') === label) {
                        figure.removeAttribute('aria-label');
                    }
                    ownedTabindex = false;
                    ownedLabel = false;
                }
            };

            updates.push(update);
            if (observer) {
                observer.observe(figure);
                observer.observe(table);
            }
            update();
        });
        if (updates.length) {
            window.addEventListener('resize', () => updates.forEach(update => update()));
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
