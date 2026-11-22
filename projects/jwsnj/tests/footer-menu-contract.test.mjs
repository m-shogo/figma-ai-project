// Footer contract checks: only the approved WordPress Footer sitemap menu renders.
// Run: node --test projects/jwsnj/tests/footer-menu-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const footer = readFileSync(new URL('../theme/template-parts/_footer.php', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../theme/inc/menu.php', import.meta.url), 'utf8');

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
});

test('footer preserves safe WordPress site identity and page top', () => {
  assert.match(footer, /esc_url\(home_url\('\/'\)\)/);
  assert.match(footer, /esc_html\(get_bloginfo\('name'\)\)/);
  assert.match(footer, /id="js_gf_pageTop"/);
  assert.match(footer, /esc_html\(wp_date\('Y'\)\)/);
});
