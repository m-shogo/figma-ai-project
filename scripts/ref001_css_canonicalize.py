#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME = ROOT / "experiments/ref001-blind-clean-20260812/implementation/theme"
CSS_OUT = THEME / "assets/css/ref001.css"

SOURCE_FILES = [
    "style.css",
    "responsive-continuity.css",
    "visual-repair.css",
    "human-review-repair.css",
    "v2-visual-polish.css",
    "v2-reason-polish.css",
    "v2-education-polish.css",
    "v2-student-voice-polish.css",
    "v2-messages-polish.css",
    "v2-courses-polish.css",
    "v2-header-polish.css",
    "v2-links-polish.css",
    "v2-shared-cta-polish.css",
    "v2-cta-value-polish.css",
    "v2-continuity-fixes.css",
    "v2-hotspot-repair.css",
    "v2-footer-sns-position.css",
    "v2-speech-fluid-experiment.css",
    "v2-speech-variable-layout.css",
    "v2-intermediate-desktop.css",
    "v2-mobile-fluid.css",
    "v2-intermediate-mv.css",
    "v2-font-fidelity.css",
    "v2-typography-fidelity.css",
    "human-review-current.css",
    "human-review-current-layout.css",
    "human-review-desktop-lock.css",
]

THEME_STYLE = """/*
Theme Name: REF-001 Blind Clean Fixture
Description: Isolated WordPress-compatible fixture for REF-001.
Version: 1.0.0
*/
"""

FUNCTIONS_PHP = r'''<?php

if (!defined('REF001_FIXTURE_MODE')) {
    define('REF001_FIXTURE_MODE', false);
}

function ref001_fixture_data(): array
{
    static $data;

    if ($data === null) {
        $data = require __DIR__ . '/inc/fixture-content.php';
    }

    return $data;
}

function ref001_get(string $key, $fallback = '')
{
    if (function_exists('get_field') && !REF001_FIXTURE_MODE) {
        $value = get_field($key);
        if ($value !== null && $value !== false && $value !== '') {
            return $value;
        }
    }

    $data = ref001_fixture_data();
    return array_key_exists($key, $data) ? $data[$key] : $fallback;
}

function ref001_e($value): void
{
    echo htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function ref001_section(string $name): void
{
    require __DIR__ . '/template-parts/sections/' . $name . '.php';
}

function ref001_course_domain(): array
{
    return require __DIR__ . '/inc/course-domain.php';
}

function ref001_figma_authority(): array
{
    static $authority;

    if ($authority === null) {
        $authority = require __DIR__ . '/inc/figma-authority.php';
    }

    return $authority;
}

function ref001_figma_frame_attrs(): string
{
    $authority = ref001_figma_authority();
    $pc = (string) ($authority['frames']['pc']['node'] ?? '');
    $sp = (string) ($authority['frames']['sp']['node'] ?? '');

    return sprintf(
        ' data-figma-pc="%s" data-figma-sp="%s"',
        htmlspecialchars($pc, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($sp, ENT_QUOTES, 'UTF-8')
    );
}

function ref001_figma_section_attrs(string $name): string
{
    static $occurrences = [];

    $index = $occurrences[$name] ?? 0;
    $occurrences[$name] = $index + 1;

    $entry = ref001_figma_authority()['sections'][$name] ?? null;
    if (!is_array($entry)) {
        return '';
    }

    $pc = $entry['pc'][$index] ?? null;
    $sp = $entry['sp'][$index] ?? null;
    if (!is_string($pc) || !is_string($sp)) {
        return '';
    }

    return sprintf(
        ' data-figma-pc="%s" data-figma-sp="%s"',
        htmlspecialchars($pc, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($sp, ENT_QUOTES, 'UTF-8')
    );
}

function ref001_assets(): array
{
    static $assets;

    if ($assets === null) {
        $assets = require __DIR__ . '/inc/asset-map.php';
    }

    return $assets;
}

function ref001_asset_url(string $path): string
{
    if (REF001_FIXTURE_MODE || !function_exists('get_stylesheet_directory_uri')) {
        return $path;
    }

    return rtrim(get_stylesheet_directory_uri(), '/') . '/' . ltrim($path, '/');
}

function ref001_icon_url(string $key): string
{
    $assets = ref001_assets();
    return ref001_asset_url($assets['icons'][$key] ?? '');
}

function ref001_link_url(string $key): string
{
    $assets = ref001_assets();
    return (string) ($assets['links'][$key] ?? '#');
}

function ref001_picture(string $slot, string $class = '', string $alt = '', bool $eager = false): void
{
    $entry = ref001_assets()['images'][$slot] ?? null;
    if (!is_array($entry) || empty($entry['pc']) || empty($entry['sp'])) {
        return;
    }

    $pc = ref001_asset_url((string) $entry['pc']);
    $sp = ref001_asset_url((string) $entry['sp']);
    $loading = $eager ? 'eager' : 'lazy';
    $figma = is_array($entry['figma'] ?? null) ? $entry['figma'] : [];

    $figmaPc = isset($figma['pc'])
        ? ' data-figma-pc="' . htmlspecialchars((string) $figma['pc'], ENT_QUOTES, 'UTF-8') . '"'
        : '';
    $figmaSp = isset($figma['sp'])
        ? ' data-figma-sp="' . htmlspecialchars((string) $figma['sp'], ENT_QUOTES, 'UTF-8') . '"'
        : '';

    printf(
        '<picture class="ref-picture %s" data-asset-slot="%s"%s%s>',
        htmlspecialchars($class, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($slot, ENT_QUOTES, 'UTF-8'),
        $figmaPc,
        $figmaSp
    );
    printf(
        '<source media="(max-width:767px)" srcset="%s">',
        htmlspecialchars($sp, ENT_QUOTES, 'UTF-8')
    );
    printf(
        '<img src="%s" alt="%s" loading="%s" decoding="async">',
        htmlspecialchars($pc, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($alt, ENT_QUOTES, 'UTF-8'),
        $loading
    );
    echo '</picture>';
}

function ref001_icon(string $key, string $class = ''): void
{
    $url = ref001_icon_url($key);
    if ($url === '') {
        return;
    }

    printf(
        '<img class="ref-svg-icon %s" src="%s" alt="" aria-hidden="true">',
        htmlspecialchars($class, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($url, ENT_QUOTES, 'UTF-8')
    );
}

function ref001_asset_version(string $relativePath): string
{
    if (!function_exists('get_stylesheet_directory')) {
        return '1.0.0';
    }

    $path = get_stylesheet_directory() . '/' . ltrim($relativePath, '/');
    return is_file($path) ? (string) filemtime($path) : '1.0.0';
}

function ref001_enqueue_assets(): void
{
    $base = rtrim(get_stylesheet_directory_uri(), '/');

    wp_enqueue_style(
        'ref001',
        $base . '/assets/css/ref001.css',
        [],
        ref001_asset_version('assets/css/ref001.css')
    );

    wp_enqueue_script(
        'ref001-interactions',
        $base . '/assets/js/ref001-interactions.js',
        [],
        ref001_asset_version('assets/js/ref001-interactions.js'),
        true
    );
}

if (function_exists('add_action')) {
    add_action('wp_enqueue_scripts', 'ref001_enqueue_assets');
}
'''

PREVIEW_PHP = r'''<?php

define('REF001_FIXTURE_MODE', true);
require __DIR__ . '/functions.php';
?><!doctype html>
<html lang="ja">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>REF-001 Preview</title>
    <link rel="stylesheet" href="assets/css/ref001.css">
</head>
<body>
<?php require __DIR__ . '/page-ref001-clean.php'; ?>
<script src="assets/js/ref001-interactions.js" defer></script>
</body>
</html>
'''

JS = r'''(() => {
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
'''

COMMENT_RE = re.compile(r"/\*.*?\*/", re.S)
MEDIA_RE = re.compile(r"@media\s*([^\{]+)\{", re.I)
MIN_RE = re.compile(r"min-width\s*:\s*(\d+)px", re.I)
MAX_RE = re.compile(r"max-width\s*:\s*(\d+)px", re.I)


def strip_comments(css: str) -> str:
    return COMMENT_RE.sub("", css)


def matching_brace(text: str, open_index: int) -> int:
    depth = 1
    quote = None
    escape = False
    i = open_index + 1

    while i < len(text):
        char = text[i]

        if quote:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                quote = None
            i += 1
            continue

        if char in {"'", '"'}:
            quote = char
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1

    raise ValueError("Unbalanced CSS block")


def matches_width(condition: str, width: int) -> bool:
    mins = [int(value) for value in MIN_RE.findall(condition)]
    maxes = [int(value) for value in MAX_RE.findall(condition)]

    if not mins and not maxes:
        raise ValueError(f"Unsupported non-width media query: {condition.strip()}")

    if mins and width < max(mins):
        return False
    if maxes and width > min(maxes):
        return False
    return True


def normalize_media(css: str) -> str:
    output: list[str] = []
    position = 0

    while True:
        match = MEDIA_RE.search(css, position)
        if not match:
            output.append(css[position:])
            break

        output.append(css[position:match.start()])
        open_index = match.end() - 1
        close_index = matching_brace(css, open_index)
        condition = match.group(1).strip()
        body = normalize_media(css[open_index + 1:close_index])

        sp = matches_width(condition, 375)
        pc = matches_width(condition, 1380)

        if sp and pc:
            output.append(body)
        elif sp:
            output.append("\n@media (max-width:767px){\n" + body.strip() + "\n}\n")
        elif pc:
            output.append("\n@media (min-width:768px){\n" + body.strip() + "\n}\n")
        # If neither canonical viewport matches, the block is an obsolete
        # intermediate-only rule and intentionally disappears.

        position = close_index + 1

    return "".join(output)


def clean_css(css: str) -> str:
    css = strip_comments(css)
    css = normalize_media(css)
    css = re.sub(r"\n{3,}", "\n\n", css)
    return css.strip()


def build_css() -> str:
    chunks: list[str] = []

    for name in SOURCE_FILES:
        path = THEME / name
        if not path.is_file():
            raise FileNotFoundError(path)
        chunks.append(clean_css(path.read_text(encoding="utf-8")))

    combined = "\n\n".join(chunk for chunk in chunks if chunk)

    # De-duplicate identical Google Fonts imports while preserving first use.
    seen_imports: set[str] = set()
    lines: list[str] = []
    for line in combined.splitlines():
        stripped = line.strip()
        if stripped.startswith("@import url("):
            if stripped in seen_imports:
                continue
            seen_imports.add(stripped)
        lines.append(line.rstrip())

    combined = "\n".join(lines).strip() + "\n"

    header = """/* REF-001 canonical stylesheet.
 * Responsive contract:
 *   <= 767px : SP composition
 *   >= 768px : PC composition on a 1280px minimum canvas
 * No tablet/intermediate layout exists for this project.
 */
"""
    return header + combined


def main() -> None:
    CSS_OUT.parent.mkdir(parents=True, exist_ok=True)
    CSS_OUT.write_text(build_css(), encoding="utf-8")

    # Keep style.css only as WordPress theme metadata. Runtime CSS lives in one file.
    (THEME / "style.css").write_text(THEME_STYLE, encoding="utf-8")
    (THEME / "functions.php").write_text(FUNCTIONS_PHP, encoding="utf-8")
    (THEME / "preview.php").write_text(PREVIEW_PHP, encoding="utf-8")
    (THEME / "assets/js/ref001-interactions.js").write_text(JS, encoding="utf-8")

    for name in SOURCE_FILES:
        if name == "style.css":
            continue
        path = THEME / name
        if path.exists():
            path.unlink()

    print(f"wrote {CSS_OUT.relative_to(ROOT)}")
    print("removed legacy layered CSS files")


if __name__ == "__main__":
    main()
