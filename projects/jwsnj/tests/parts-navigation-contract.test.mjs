// Parts-only Large Navigation shared presentation. TOP adoption is a separate gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const css = readFileSync(new URL('../theme/css/blocks/wp-block-navigation-style.css', import.meta.url), 'utf8');
const large = css.slice(css.indexOf('/* MARK: 大'), css.indexOf('/* MARK: 小 */'));
const shared = css.slice(css.indexOf('/* MARK: Large Navigation card'));
const template = readFileSync(new URL('../theme/acf/blocks/navigationLarge.php', import.meta.url), 'utf8');
const cardPath = new URL('../theme/template-parts/_navigation-large-card.php', import.meta.url).pathname;
test('large navigation keeps the Figma layout and a standalone shared card owner', () => {
  assert.match(template, /get_template_part\('template-parts\/_navigation-large-card'/);
  assert.match(template, /have_rows\('navigation-large'\)/);
  assert.match(template, /wp_get_attachment_image\(/);
  assert.match(large, /gap: calc\(40 \* var\(--to-rem-func\)\)/);
  assert.match(large, /repeat\(3, minmax\(0, 1fr\)\)/);
  for (const value of ['--_card-gap: calc(24 * var(--to-rem-func))', '--_card-copy-gap: calc(20 * var(--to-rem-func))', 'aspect-ratio: 3 / 2', 'border-radius: calc(5 * var(--to-rem-func))', 'font-size: calc(18 * var(--to-rem-func))', 'line-height: 1.4', 'overflow-wrap: anywhere', 'min-width: 0', 'width: calc(48 * var(--to-rem-func))', '--_card-arrow-size: calc(32 * var(--to-rem-func))']) assert.ok(shared.includes(value), value);
  assert.doesNotMatch(shared, /white-space:\s*nowrap|figma\.com\/api/);
});
test('shared card preserves native focus, transitions and decorative icon', () => {
  assert.match(shared, /&:focus-visible/);
  assert.match(shared, /@media \(any-hover: hover\) and \(prefers-reduced-motion: no-preference\)/);
  assert.match(shared, /transition: transform var\(--transition-duration\)/);
  assert.match(shared, /transition: opacity var\(--transition-duration\)/);
  assert.match(shared, /transition: background-color var\(--transition-duration\), color var\(--transition-duration\)/);
  assert.equal((shared.match(/prefers-reduced-motion: reduce/g) || []).length, 3);
  assert.match(shared, /content: '\\f061' \/ ''/);
  for (const value of ['box-sizing: border-box','letter-spacing: 0','text-box-trim: none','line-height: 1','pointer-events: none','font-weight: 400']) assert.ok(shared.includes(value), value);
});
test('actual PHP card preserves escaped content, heading levels, noninteractive visuals and safe links', () => {
  const stub = 'function esc_html($s){return htmlspecialchars($s,ENT_QUOTES);} function esc_url($s){return preg_match("/^javascript:/i",$s)?"":esc_html($s);} function wp_kses_post($s){return strip_tags($s,"<img>");} ';
  const render = (item,heading='h2') => execFileSync('php',['-r',stub+' $args=json_decode(base64_decode("'+Buffer.from(JSON.stringify({item,heading})).toString('base64')+'"),true); include '+JSON.stringify(cardPath)+';'],{encoding:'utf8'}).trim();
  assert.equal(render({}), '');
  const preview=render({title:'<title>',text:'<body>',image_html:'<img src="/fixture.webp" alt="">',url:'javascript:alert(1)'});
  assert.match(preview, /<a class="module_navigationCard">/);
  assert.match(preview, /class="module_navigationCard_arrow" aria-hidden="true"/);
  assert.match(preview, /<h2 class="module_navigationCard_title">&lt;title&gt;<\/h2>/);
  assert.match(preview, /&lt;body&gt;/);
  assert.doesNotMatch(preview, /href=|javascript:|target=/);
  assert.match(render({title:'Course',url:'/verified/',new_tab:true},'h3'), /<a class="module_navigationCard" href="\/verified\/" target="_blank" rel="noopener noreferrer">/);
  assert.match(render({title:'Course'},'h3'), /<h3 class="module_navigationCard_title">Course<\/h3>/);
  assert.doesNotMatch(render({image_html:'<img alt="">',url:'/verified/'}), /href=/);
  assert.match(render({image_html:'<img alt="Named">',image_alt:'Named',url:'/verified/'}), /href="\/verified\/"/);
});

const small = css.slice(css.indexOf('/* MARK: 小 */'), css.indexOf('/* MARK: Large Navigation card'));
const smallTemplate = readFileSync(new URL('../theme/acf/blocks/navigationSmall.php', import.meta.url), 'utf8');
test('small navigation long labels cannot force their flex row beyond its grid track', () => {
  assert.match(small, /\.navigation\s*\{\s*min-width:\s*0/);
  assert.match(small, /a\s*\{\s*min-width:\s*0/);
  assert.match(small, /\.content\s*\{\s*flex:\s*1 1 0%;\s*min-width:\s*0;\s*overflow-wrap:\s*anywhere/);
  assert.match(small, /width:\s*min\(calc\(120 \* var\(--to-rem-func\)\), 42%\)/);
  assert.match(css, /width:\s*min\(calc\(180 \* var\(--to-rem-func\)\), 48%\)/);
  assert.doesNotMatch(small, /white-space:\s*nowrap/);
});
test('small navigation handles absent URLs, images and empty rows without sample placeholders', () => {
  assert.match(smallTemplate, /\$url = esc_url\(\(string\) get_sub_field\('url'\)\)/);
  assert.match(smallTemplate, /\$has_link = \$url !== '' && \$has_text/);
  assert.match(smallTemplate, /if \(!\$image_thumb && !\$has_text\) \{\s*continue;/);
  assert.match(smallTemplate, /<a<\?php if \(\$has_link\) : \?> href="<\?php echo \$url; \?>".*target="_blank" rel="noopener".*class="is-disabled"/);
  assert.doesNotMatch(smallTemplate, /noimage\.webp|href=""/);
  assert.match(smallTemplate, /alt=""/);
});


test('small navigation grid tracks do not inherit min-content label width at desktop', () => {
  assert.match(css, /&\.--small\s*\{[^{}]*@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
});
