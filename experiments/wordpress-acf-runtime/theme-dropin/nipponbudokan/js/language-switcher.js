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

    function homePath() {
        return String((window.nbLanguage && window.nbLanguage.homePath) || '/').replace(/\/+$/, '');
    }

    function safeReturnPath(value) {
        if (typeof value !== 'string' || value.charAt(0) !== '/') {
            return '';
        }
        if (value.indexOf('//') === 0 || value.indexOf('\\') !== -1 || value.indexOf('://') !== -1) {
            return '';
        }
        var cut = value.split('#')[0];
        var decoded;
        try {
            decoded = decodeURIComponent(cut);
        } catch (error) {
            return '';
        }
        if (decoded.charAt(0) !== '/' || decoded.indexOf('//') === 0 || decoded.indexOf('\\') !== -1 || decoded.indexOf('://') !== -1) {
            return '';
        }
        var pathname = cut.split('?')[0];
        var home = homePath();
        var rest = pathname;
        if (home && (rest === home || rest.indexOf(home + '/') === 0)) {
            rest = rest.slice(home.length);
        }
        rest = rest.replace(/^\/+|\/+$/g, '');
        if (/^language_setting_/i.test(rest)) {
            return '';
        }
        var prefixes = (window.nbLanguage && window.nbLanguage.prefixes) || [];
        for (var i = 0; i < prefixes.length; i++) {
            if (String(prefixes[i]).toLowerCase() === rest.toLowerCase()) {
                return '/';
            }
        }
        return cut || '/';
    }

    function continueLanguage(href) {
        var configured = window.nbLanguage && window.nbLanguage.settingLang;
        var prefixes = (window.nbLanguage && window.nbLanguage.prefixes) || [];
        if (typeof configured === 'string' && prefixes.indexOf(configured) !== -1) {
            return configured;
        }
        var url;
        try {
            url = new URL(href, location.origin);
        } catch (error) {
            return '';
        }
        var home = homePath();
        var path = url.pathname;
        if (home && (path === home || path.indexOf(home + '/') === 0)) {
            path = path.slice(home.length);
        }
        path = path.replace(/^\/+|\/+$/g, '');
        for (var i = 0; i < prefixes.length; i++) {
            if (String(prefixes[i]).toLowerCase() === path.toLowerCase()) {
                return prefixes[i];
            }
        }
        return '';
    }

    function returnUrl(path) {
        if (path.charAt(0) !== '/') {
            path = '/' + path;
        }
        return homePath() + path;
    }

    document.querySelectorAll('a.ls_continue').forEach(function (link) {
        link.addEventListener('click', function (event) {
            var configured = window.nbLanguage && window.nbLanguage.returnPath;
            var from = safeReturnPath(typeof configured === 'string' && configured ? configured : (new URLSearchParams(location.search).get('from') || ''));
            var code = continueLanguage(link.getAttribute('href') || '');
            if (!from || !code) {
                return;
            }
            event.preventDefault();
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ srcLang: 'ja', tgtLang: code }));
            } catch (error) {
                window.location.assign(link.href);
                return;
            }
            try {
                sessionStorage.setItem('nb_charter_preview', code);
            } catch (error) {}
            window.location.assign(returnUrl(from));
        });
    });

})();
