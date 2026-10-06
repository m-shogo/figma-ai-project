(function () {
    const selector = '.news_item_title_line, .ea_title a, .te_upcoming_title a';

    function measureLines(element) {
        const node = element.firstChild;
        if (!node || node.nodeType !== Node.TEXT_NODE) {
            return [];
        }
        const text = node.nodeValue || '';
        const range = document.createRange();
        const lines = [];
        let start = 0;
        let top = null;

        for (let index = 0; index < text.length; index += 1) {
            range.setStart(node, index);
            range.setEnd(node, index + 1);
            const rect = range.getBoundingClientRect();
            if (!rect.width && !rect.height) {
                continue;
            }
            if (top === null) {
                top = rect.top;
            }
            if (rect.top - top > 1) {
                lines.push(text.slice(start, index));
                start = index;
                top = rect.top;
            }
        }
        lines.push(text.slice(start));
        return lines;
    }

    function ownerWidth(element) {
        const owner = element.closest('.news_item_link, .ea_body, .te_upcoming_body') || element.parentElement;
        return Math.round(owner.getBoundingClientRect().width);
    }

    function layout(element) {
        const width = ownerWidth(element);
        if (width < 1 || element.dataset.titleWidth === String(width)) {
            return;
        }

        const text = element.dataset.titleSource != null ? element.dataset.titleSource : element.textContent;
        element.dataset.titleSource = text;
        element.classList.remove('is-multiline');
        element.replaceChildren(document.createTextNode(text));

        const lines = measureLines(element).filter(function (line) {
            return line !== '';
        });
        element.dataset.titleWidth = String(width);
        if (lines.length < 2) {
            return;
        }

        element.classList.add('is-multiline');
        element.style.setProperty('--line-count', String(lines.length));
        const fragment = document.createDocumentFragment();
        lines.forEach(function (line, index) {
            if (index > 0) {
                fragment.append(document.createElement('br'));
            }
            const span = document.createElement('span');
            span.className = 'title_line';
            span.style.setProperty('--line', String(index));
            span.textContent = line;
            fragment.append(span);
        });
        element.replaceChildren(fragment);
    }

    function boot() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
        const elements = Array.from(document.querySelectorAll(selector));
        if (!elements.length) {
            return;
        }
        let framing = false;
        const refresh = function () {
            if (framing) {
                return;
            }
            framing = true;
            elements.forEach(layout);
            window.requestAnimationFrame(function () {
                framing = false;
            });
        };
        const observer = new ResizeObserver(refresh);
        elements.forEach(function (element) {
            const owner = element.closest('.news_item_link, .ea_body, .te_upcoming_body') || element.parentElement;
            observer.observe(owner);
        });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(refresh);
        } else {
            refresh();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}());
