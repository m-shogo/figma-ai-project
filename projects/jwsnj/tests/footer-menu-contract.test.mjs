// Footer contract checks: only the approved WordPress Footer sitemap menu renders.
// Run: node --test projects/jwsnj/tests/footer-menu-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const footer = readFileSync(new URL('../theme/template-parts/_footer.php', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../theme/inc/menu.php', import.meta.url), 'utf8');
const css = readFileSync(new URL('../theme/css/layout/global_footer.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('../theme/js/common.js', import.meta.url), 'utf8');

test('footer has one accessible sitemap landmark using footer-nav', () => {
  assert.equal((footer.match(/wp_nav_menu\s*\(/g) || []).length, 1);
  assert.match(footer, /<nav\s+class="gf_menu"\s+aria-label="フッターナビゲーション">/);
  assert.doesNotMatch(footer, /'menu'\s*=>/); // WordPress admin location mapping owns selection.
  assert.match(footer, /'theme_location'\s*=>\s*'footer-nav'/);
  assert.match(footer, /'fallback_cb'\s*=>\s*false/);
  assert.match(footer, /'walker'\s*=>\s*new Custom_Footer_Walker_Nav_Menu\(\)/);
  assert.match(footer, /<\/nav>/);
  assert.match(menu, /'footer-nav'\s*=>/);
});

test('footer does not duplicate header-specific sub-navigation', () => {
  assert.doesNotMatch(footer, /gf_subMenu|gf_links-02|Custom_Footer_Sub_Walker_Nav_Menu/);
  assert.doesNotMatch(footer, /'theme_location'\s*=>\s*'sub-nav'/);
  assert.doesNotMatch(css, /\.gf_subMenu|\.gf_links-02/);
});

test('footer preserves safe WordPress site identity and page top', () => {
  assert.match(footer, /esc_url\(home_url\('\/'\)\)/);
  assert.match(footer, /esc_html\(get_bloginfo\('name'\)\)/);
  assert.match(footer, /id="js_gf_pageTop"/);
  assert.match(footer, /esc_html\(wp_date\('Y'\)\)/);
});


test('footer page-top link retains a readable name and visible keyboard focus', () => {
  // CSS hides the inner span, so the anchor itself must supply the accessible name.
  assert.match(footer, /<a href="#" aria-label="ページトップへ戻る"><span>ページトップへ戻る<\/span><\/a>/);
  const pageTop = css.slice(css.indexOf('.gf_pageTop {'), css.indexOf('@media (calc(768'));
  assert.match(pageTop, /&:focus-visible\s*\{/);
  assert.match(pageTop, /outline:\s*2px solid var\(--color-text\)/);
  assert.match(pageTop, /span\s*\{\s*display:\s*none;/);
});


test('footer copyright and page-top use one in-flow row and native anchor scrolling', () => {
  assert.match(footer, /<div class="gf_bottom">\s*<p class="gf_copyright">[\s\S]*?<\/p>\s*<p id="js_gf_pageTop"/);
  assert.match(css, /\.gf_bottom\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*minmax\(0, 1fr\) calc\(60 \* var\(--to-rem-func\)\)/);
  const control = css.slice(css.indexOf('.gf_pageTop {'), css.indexOf('@media (calc(768'));
  assert.match(control, /min-height:\s*calc\(60 \* var\(--to-rem-func\)\)/);
  assert.match(control, /background-color:\s*#4dce83/);
  assert.match(control, /content:\s*'\\f341'/);
  assert.match(control, /&:hover\s*\{\s*background-color:\s*var\(--color-primary\)/);
  assert.doesNotMatch(control, /position:\s*fixed|border-radius:\s*50%/);
  assert.doesNotMatch(source, /const pageTop =|pageTop\(\);|#js_gf_pageTop/);
  assert.match(source, /href === '#' \|\| href === '' \? 'html' : href/);
  const copyright = css.slice(css.indexOf('.gf_copyright {'), css.indexOf('.gf_pageTop {'));
  assert.match(copyright, /font-family:\s*var\(--font-jwsnj-en-condensed\)/);
  assert.match(copyright, /overflow-wrap:\s*anywhere/);
  assert.match(copyright, /text-align:\s*left/);
});

test('Footer accordion buttons have visible focus without affecting layout', () => {
  const block = css.slice(css.indexOf('.gfl_button-02,'), css.indexOf('.gfl_wrapper-02,'));
  assert.match(block, /&:focus-visible\s*\{\s*outline: 2px solid var\(--color-primary\)/);
  assert.doesNotMatch(block, /white-space:\s*nowrap/);
});


test('Footer accordion transitions respect reduced-motion preference', () => {
  const block = css.slice(css.indexOf('/* Accessibility: do not animate accordion'), css.indexOf('/* MARK: hover */'));
  assert.match(block, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(block, /\.gfl_wrapper-02/);
  assert.match(block, /transition-duration: 0s/);
});


test('common anchor navigation tolerates missing CMS anchors and reduced motion', () => {
  const section = source.slice(source.indexOf('function scrollToAnker(hash) {'), source.indexOf('  // SP用メニュー＆PCメガメニュー設定'));
  assert.match(section, /if \(!target\.length\) return;/);
  assert.match(section, /window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/);
  assert.match(section, /scroller\.scrollTop\(position\)/);
  assert.match(section, /Math\.max\(0, offset\.top - header\)/);
  assert.match(section, /if \(!offset \|\| !Number\.isFinite\(offset\.top\)\) return;/);
  assert.match(section, /scroller\.animate\(\{ scrollTop: position \}, 300\)/);
});


test('Footer WordPress disclosure controls point to a unique direct submenu wrapper', () => {
  const walker = menu.slice(menu.indexOf('class Custom_Footer_Walker_Nav_Menu'), menu.indexOf('class Custom_Footer_Sub_Walker_Nav_Menu'));
  assert.match(walker, /\$submenu_id = 'gfl-submenu-' \. absint\(\$item->ID\)/);
  assert.match(walker, /aria-controls="' \. esc_attr\(\$submenu_id\)/);
  assert.match(walker, /<div id="' \. esc_attr\(\$submenu_id\)/);
});


test('Footer does not retain empty CODIA class rules', () => {
  assert.doesNotMatch(css, /^[ \t]*\.[A-Za-z][\w-]*\s*\{\s*\}[ \t]*$/m);
});


test('Footer uses Figma-approved PC/SP bilingual brand statement without substituted imagery', () => {
  assert.match(footer, /class="gf_brandStatement"/);
  assert.match(footer, /LEARN IN JAPANESE\.<br>CONNECT WITH JAPAN\./);
  assert.match(footer, /土曜日、日本とつながる学びの時間/);
  assert.doesNotMatch(footer, /figma\.com\/api\/mcp\/asset/);
  assert.match(css, /\.gf_brandStatement-en\s*\{[\s\S]*?font-family: 'Roboto Condensed'/);
  assert.match(css, /\.gf_brandStatement-ja\s*\{[\s\S]*?font-family: 'Zen Kaku Gothic New'/);
  assert.match(css, /font-size: calc\(46 \* var\(--to-rem-func\)\)/);
  assert.match(css, /font-size: calc\(15 \* var\(--to-rem-func\)\)/);
});

test('Footer brand copy and WordPress sitemap labels remain wrappable at narrow widths', () => {
  for (const selector of ['.gf_brandStatement-en', '.gf_brandStatement-ja']) {
    const start = css.indexOf(selector + ' {');
    assert.ok(start >= 0, selector + ' must exist');
    const rule = css.slice(start, css.indexOf('}', start));
    assert.match(rule, /min-width:\s*0;/);
    assert.match(rule, /max-width:\s*100%;/);
    assert.match(rule, /overflow-wrap:\s*anywhere;/);
  }
  const links = css.slice(css.indexOf('.gfl_link-02,'), css.indexOf('.gfl_button-02,'));
  assert.match(links, /min-width:\s*0;/);
  assert.match(links, /overflow-wrap:\s*anywhere;/);
  assert.doesNotMatch(links, /white-space:\s*nowrap/);
});

test('desktop sitemap top-level links use the official Figma bullet without changing the menu owner', () => {
  const pcStart = css.indexOf('@media (calc(768 * (1 / 16 * 1rem)) <= width)');
  assert.ok(pcStart >= 0);
  const pc = css.slice(pcStart);
  const marker = pc.match(/\.gfl_link-02\s*\{[^}]*background-image:[^}]*\}/);
  assert.ok(marker, 'PC top-level link owns its decorative SVG');
  const rule = marker[0];
  assert.match(rule, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(rule, /font-size:\s*calc\(13 \* var\(--to-rem-func\)\)/);
  assert.match(rule, /font-weight:\s*500/);
  assert.match(rule, /line-height:\s*1\.4/);
  assert.match(rule, /letter-spacing:\s*0\.05em/);
  assert.match(rule, /padding-inline-start:\s*calc\(17\.41839 \* var\(--to-rem-func\)\)/);
  assert.match(rule, /background-image:\s*url\('\.\.\/\.\.\/images\/common\/footer\/img_footer-bullet\.svg'\)/);
  assert.match(rule, /background-size:\s*calc\(5\.41839 \* var\(--to-rem-func\)\) auto/);
  assert.match(rule, /background-repeat:\s*no-repeat/);
  assert.doesNotMatch(css.slice(0, pcStart), /img_footer-bullet\.svg/);
  assert.doesNotMatch(rule, /white-space:\s*nowrap/);
  assert.ok(readFileSync(new URL('../theme/images/common/footer/img_footer-bullet.svg', import.meta.url)).length > 0);
});

test('desktop footer aligns site identity and one adaptive three-column sitemap without changing menu order or depth', () => {
  assert.match(footer, /<div class="gf_details global_inner">\s*<div class="gf_information">[\s\S]*?<div class="gf_links-wrap">/);
  const pc = css.slice(css.indexOf('@media (calc(768 * (1 / 16 * 1rem)) <= width)'));
  assert.match(pc, /\.gf_links-01\s*\{\s*display:\s*block;\s*columns:\s*3;/);
  assert.match(pc, /column-gap:\s*clamp\(calc\(24 \* var\(--to-rem-func\)\), 5\.8vw, calc\(80 \* var\(--to-rem-func\)\)\)/);
  assert.match(pc, /> \.gfl_item-02\s*\{\s*break-inside:\s*avoid;\s*margin-block-end:\s*calc\(16 \* var\(--to-rem-func\)\)/);
  assert.doesNotMatch(pc, /min-width:\s*calc\(240 \* var\(--to-rem-func\)\)/);
  assert.match(css, /\.gf_information\s*\{[^{}]*@media \(calc\(1080[^{}]+\{\s*flex:\s*0 1 calc\(308 \* var\(--to-rem-func\)\)/);
  assert.match(css, /\.gf_links-wrap\s*\{[^{}]*@media \(calc\(1080[^{}]+\{\s*flex:\s*0 1 calc\(541 \* var\(--to-rem-func\)\)/);
  assert.match(css, /\.gf_details\s*\{\s*display:\s*grid/);
  assert.doesNotMatch(css, /white-space:\s*nowrap/);
});
test('footer top-level external links use the Figma window-restore glyph and existing primary hover color', () => {
  const pc = css.slice(css.indexOf('/* Figma PC sitemap 114:523'));
  assert.match(pc, /&\[target='_blank'\]:where\(:not\([^)]+\)\)::after\s*\{\s*content:\s*var\(--icon-blank\)/);
  assert.match(pc, /font-size:\s*calc\(12 \* var\(--to-rem-func\)\)/);
  assert.match(pc, /margin-inline-start:\s*calc\(4 \* var\(--to-rem-func\)\)/);
  assert.match(css.slice(css.indexOf('/* MARK: hover */')), /color:\s*var\(--color-primary\)/);
});

test('Footer brand places copy first on SP and keeps fixed-distance artwork on wide PC', () => {
  const brand = css.slice(css.indexOf('.gf_brandStatement {'), css.indexOf('  .gf_logo {'));
  assert.match(brand, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(brand, /\.gf_brandStatement-copy\s*\{\s*grid-column:\s*1 \/ -1;\s*grid-row:\s*1;/);
  assert.match(brand, /\.gf_brandStatement-left\.is-sp\s*\{\s*grid-column:\s*1;\s*grid-row:\s*2;\s*justify-self:\s*start;/);
  assert.match(brand, /\.gf_brandStatement-right\.is-sp\s*\{\s*grid-column:\s*2;\s*grid-row:\s*2;\s*justify-self:\s*end;/);
  assert.match(brand, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, calc\(484 \* var\(--to-rem-func\)\)\) minmax\(0, 1fr\)/);
  assert.match(brand, /gap:\s*calc\(40 \* var\(--to-rem-func\)\)/);
  assert.match(brand, /\.gf_brandStatement-left\.is-pc\s*\{\s*display:\s*none;\s*@media \(calc\(1080[^{}]+\{\s*display:\s*block;\s*grid-column:\s*1;\s*grid-row:\s*1;\s*justify-self:\s*end;/);
  assert.match(brand, /\.gf_brandStatement-right\.is-pc\s*\{\s*display:\s*none;\s*@media \(calc\(1080[^{}]+\{\s*display:\s*block;\s*grid-column:\s*3;\s*grid-row:\s*1;\s*justify-self:\s*start;/);
  assert.equal((brand.match(/width: min\(calc\(408 \* var\(--to-rem-func\)\), 100%\)/g) || []).length, 2);
  assert.match(brand, /@media \(calc\(1380 \* \(1 \/ 16 \* 1rem\)\) < width\)/);
  assert.match(brand, /width:\s*calc\(\(100% - 1380 \* var\(--to-rem-func\)\) \/ 2 \+ 1px\)/);
  assert.match(brand, /top:\s*calc\(50% \+ 19\.16 \* var\(--to-rem-func\)\)/);
  assert.doesNotMatch(css, /padding-top:\s*calc\(50 \* var\(--to-rem-func\)\)/);
  assert.doesNotMatch(brand, /white-space:\s*nowrap/);
});

test('Footer brand and details use owner-local desktop geometry without changing scope', () => {
  for (const [owner, declaration] of [
    ['gf_brandStatement-copy', 'grid-column: 2;'],
    ['gf_brandStatement-en', 'font-size: calc(46 * var(--to-rem-func));'],
    ['gf_brandStatement-ja', 'font-size: calc(15 * var(--to-rem-func));'],
    ['gf_details', 'display: flex;'],
  ]) {
    const start = css.indexOf('.' + owner + ' {');
    const end = css.indexOf('\n  }', start);
    const rule = css.slice(start, end);
    assert.match(rule, /@media \(calc\(1080 \* \(1 \/ 16 \* 1rem\)\) <= width\)/);
    assert.ok(rule.includes(declaration), owner);
  }
});


test('footer disclosure animates only the rotating vertical stroke', () => {
  assert.match(css, /&::after\s*\{\s*transform: rotate\(-90deg\);\s*transition: transform var\(--transition-duration\)/);
  assert.doesNotMatch(css, /transition:\s*var\(--transition-duration\)/);
});

test('secondary menu file links use the actual path extension, not query or hostname', () => {
  const php = new URL('../theme/inc/menu.php', import.meta.url).pathname;
  const stub = 'function add_action(...$args){} function add_filter(...$args){} function wp_parse_url($url,$part){return parse_url($url,$part);} class Walker_Nav_Menu {} require $argv[1]; $cases=json_decode($argv[2],true); echo json_encode(array_map(fn($v)=>should_open_menu_link_in_new_tab((object)$v),$cases));';
  const cases = [
    {url:'https://example.invalid/file.PDF?download=1#page=2'},
    {url:'/files/report.docx'},
    {url:'/photos/image.webp'},
    {url:'/normal?file=report.pdf'},
    {url:'/normal#report.pdf'},
    {url:'https://pdf.example.invalid/normal'},
    {url:'https://example.pdf/normal'},
    {url:'/report.pdf-preview'},
    {url:'/docs.pdf/overview'},
    {url:'/normal',target:'_blank'},
    {url:''}
  ];
  const result = JSON.parse(execFileSync('php',['-r',stub,php,JSON.stringify(cases)],{encoding:'utf8'}));
  assert.deepEqual(result,[true,true,true,false,false,false,false,false,false,true,true]);
});

test('Footer identity uses the Figma 18px name while keeping WordPress ownership', () => {
  const logo = css.slice(css.indexOf('  .gf_logo {'), css.indexOf('  /* Figma PC 114:484'));
  assert.match(logo, /font-family: var\(--font-jwsnj-ja\);\s*font-size: calc\(18 \* var\(--to-rem-func\)\);\s*font-weight: 500;\s*line-height: 1\.5;\s*letter-spacing: 0\.05em;/);
  assert.match(footer, /get_bloginfo\('name'\)/);
});
