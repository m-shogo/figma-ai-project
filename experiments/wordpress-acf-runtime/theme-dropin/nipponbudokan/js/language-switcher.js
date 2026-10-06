(function () {
    var STORAGE_KEY = '__GT_TRANSLATE_LANGS';
    var button = document.querySelector('.gh_lang');
    var panel = document.getElementById('gh_langPanel');

    function storedLanguage() {
        var held = window.nbLanguage && window.nbLanguage.hold;
        if (held && typeof held.tgtLang === 'string') {
            return held.tgtLang;
        }
        try {
            var stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (stored && typeof stored.tgtLang === 'string') {
                return stored.tgtLang;
            }
        } catch (error) {
            return 'ja';
        }
        return 'ja';
    }

    function markCurrent(code) {
        document.querySelectorAll('[data-nb-lang]').forEach(function (link) {
            if (link.getAttribute('data-nb-lang') === code) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    markCurrent(storedLanguage());

    document.addEventListener('DOMContentLoaded', function () {
        var held = window.nbLanguage && window.nbLanguage.hold;
        if (!held) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(held));
        } catch (error) {
            return;
        }
        markCurrent(held.tgtLang);
    });

    function setOpen(open) {
        if (!button || !panel) return;
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.hidden = !open;
    }

    if (button && panel) {
        button.addEventListener('click', function () {
            setOpen(panel.hidden);
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !panel.hidden) {
                setOpen(false);
                button.focus();
            }
        });
        document.addEventListener('pointerdown', function (event) {
            if (panel.hidden) return;
            var wrap = button.closest('.gh_langWrap');
            if (wrap && !wrap.contains(event.target)) {
                setOpen(false);
            }
        });
        ['gh_menu', 'gh_search'].forEach(function (id) {
            var control = document.getElementById(id);
            if (!control) return;
            control.addEventListener('click', function () {
                setOpen(false);
            });
        });
    }

})();
