// Figma parts PC 357:938 / SP 442:2908: Gutenberg details accordion
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-details-style.css', import.meta.url), 'utf8');

test('accordion title has Figma 18px medium typography with natural wrapping and 75px min hit area', () => {
  assert.match(css, /border-radius:\s*calc\(3 \* var\(--to-rem-func\)\)/);
  assert.match(css, /min-height:\s*calc\(75 \* var\(--to-rem-func\)\)/);
  assert.match(css, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(css, /font-weight:\s*500/);
  assert.match(css, /font-size:\s*calc\(18 \* var\(--to-rem-func\)\)/);
  assert.match(css, /letter-spacing:\s*0\.05em/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /&:focus-visible/);
});

test('open accordion body uses 32px inset, grey separator and Q/A accent', () => {
  assert.match(css, /padding:\s*calc\(32 \* var\(--to-rem-func\)\)/);
  assert.match(css, /border-top:\s*calc\(1 \* var\(--to-rem-func\)\) solid var\(--jwsnj-color-separator\)/);
  assert.match(css, /line-height:\s*1\.6/);
  assert.match(css, /content:\s*'Q';\s*color:\s*var\(--color-accent\)/);
  assert.match(css, /content:\s*'A';\s*color:\s*var\(--color-accent\)/);
  assert.match(css, /\&\[open\]\s*\{/);
  assert.match(css, /rotate:\s*0deg/);
  assert.doesNotMatch(css, /white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});

// PC/SP closed title insets are both 24px; reserve only the 68px icon rail.
test('accordion preserves Figma closed-title width and allows Q/A body shrinkage', () => {
  assert.match(css, /--_padding-inline: calc\(24 \* var\(--to-rem-func\)\)/);
  assert.doesNotMatch(css, /--_padding-inline: calc\(32|--_summary-gap/);
  assert.match(css, /padding-inline: var\(--_padding-inline\) var\(--_button-width\)/);
  assert.match(css, /\.wp-block-details__inner\s*\{[^}]*min-width: 0/);
});

test('reduced motion disables icon transitions while preserving open state', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.wp-block-details__button,\s*\.wp-block-details__button-icon::before,\s*\.wp-block-details__button-icon::after\s*\{\s*transition: none/);
});

test('open accordion uses 32px title inset while Q/A markers center in a 16px rail', () => {
  assert.match(css, /&\[open\]\s*\{\s*> summary\.wp-block-details__summary\s*\{\s*padding-inline-start:\s*calc\(32 \* var\(--to-rem-func\)\)/);
  assert.match(css, / > \.wp-block-details__button > \.wp-block-details__button-icon::after\s*\{\s*rotate:\s*0deg/);
  const qa = css.slice(css.indexOf('&._qa,'), css.indexOf('@media (prefers-reduced-motion'));
  assert.match(qa, /> summary\.wp-block-details__summary,\s*> \.wp-block-details__content\s*\{\s*display:\s*flex;\s*gap:\s*calc\(16 \* var\(--to-rem-func\)\);\s*align-items:\s*center/);
  assert.match(qa, /width:\s*calc\(16 \* var\(--to-rem-func\)\);\s*font-family:\s*var\(--font-sansSerif-en\)/);
  assert.match(qa, /font-size:\s*calc\(24 \* var\(--to-rem-func\)\);\s*font-weight:\s*500;\s*letter-spacing:\s*0\.05em/);
  assert.match(qa, /> summary\.wp-block-details__summary\s*\{\s*&::before\s*\{\s*content:\s*'Q'/);
  assert.match(qa, /> \.wp-block-details__content\s*\{\s*&::before\s*\{\s*content:\s*'A'/);
  assert.doesNotMatch(qa, /font-jwsnj-en-condensed|align-items:\s*flex-start/);
});

// Execute the real isolated PHP callback; no WordPress runtime is claimed.
const phpSource = readFileSync(new URL('../theme/inc/field.php', import.meta.url), 'utf8');
const callback = phpSource.slice(phpSource.indexOf('function custom_render_details_block('), phpSource.indexOf("add_filter('render_block', 'custom_render_details_block'"));
function renderDetails(html, name = 'core/details') {
  return execFileSync('php', ['-r', callback + '\n$input = json_decode(stream_get_contents(STDIN), true); echo custom_render_details_block($input[0], array("blockName" => $input[1]));'], {
    input: JSON.stringify([html, name]), encoding: 'utf8'
  });
}

test('PHP details callback decorates only its own summary and preserves inner rendered blocks', () => {
  const child = renderDetails('<details class="wp-block-details" open><summary>Child</summary><p>Child body</p></details>');
  const rawChild = '<details><summary>Custom HTML</summary><p>Unmodified</p></details>';
  const body = '<p>Before</p>' + child + rawChild + '<p>After</p>';
  const parent = '<details class="wp-block-details _qa" name="group" open id="parent"><summary>Parent <strong>title</strong></summary>' + body + '</details>';
  const rendered = renderDetails(parent);
  assert.ok(rendered.startsWith('<details class="wp-block-details _qa" name="group" open id="parent"><summary class="wp-block-details__summary">'));
  assert.ok(rendered.includes('<span class="wp-block-details__title">Parent <strong>title</strong></span>'));
  assert.ok(rendered.includes('<div class="wp-block-details__inner">' + body + '</div></div></details>'));
  assert.equal((rendered.match(/class="wp-block-details__summary"/g) || []).length, 2);
  assert.equal(renderDetails(rendered), rendered);
  assert.match(rendered, /wp-block-details__button" aria-hidden="true"/);
});

test('PHP details callback preserves other blocks and unsupported outer markup', () => {
  const plain = '<details><summary>Title</summary><p>Body</p></details>';
  assert.equal(renderDetails(plain, 'core/html'), plain);
  for (const html of [
    '<details><summary class="custom">Title</summary><p>Body</p></details>',
    '<details><summary>Title</summary><p>Missing closing tag</p>',
    '<div>' + plain + '</div>'
  ]) assert.equal(renderDetails(html), html);
  const spaced = ' \n<details data-note="a > b"><summary >Title</summary>\n<p>Body</p></details>\n';
  assert.ok(renderDetails(spaced).startsWith(' \n<details data-note="a > b"><summary class="wp-block-details__summary">'));
  assert.ok(renderDetails(spaced).endsWith('</details>\n'));
});


test('accordion has no dead sample pseudo-elements and remains content-height driven', () => {
  const icon = css.slice(css.indexOf('.wp-block-details__button-icon {'), css.indexOf('.wp-block-details__content {'));
  assert.doesNotMatch(icon, /&::before\s*\{\s*\}/);
  assert.doesNotMatch(css, /\/\*\s*&::before\s*\{/);
  const summary = css.slice(css.indexOf('summary.wp-block-details__summary {'), css.indexOf('.wp-block-details__title {'));
  assert.match(summary, /min-height:\s*calc\(75 \* var\(--to-rem-func\)\)/);
  assert.doesNotMatch(summary, /(?<!min-)height:\s*calc\(/);
});

test('course FAQ opt-in reuses native details and Q/A owner, with stable title inset on toggle',()=>{
  assert.match(css,/&\._qa,\s*&\.is-style-jwsnj-course-faq\s*\{/);
  const course=css.slice(css.indexOf('/* Course detail PC 612:3182'));
  assert.match(course,/&\.is-style-jwsnj-course-faq\s*\{\s*> summary\.wp-block-details__summary\s*\{\s*padding-inline-start:\s*calc\(24 \* var\(--to-rem-func\)\)/);
  assert.match(course,/@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)\s*\{\s*padding-inline-start:\s*calc\(32 \* var\(--to-rem-func\)\)/);
  assert.doesNotMatch(course,/\[open\]|white-space:\s*nowrap|(?:^|[;{}\n])\s*height\s*:/);
  const editor=readFileSync(new URL('../theme/inc/editor.php',import.meta.url),'utf8');
  assert.match(editor,/register_block_style\('core\/details', array\(\s*'name' => 'jwsnj-course-faq'/);
  for(const state of ['', ' open']){
    const html=renderDetails('<details class="wp-block-details is-style-jwsnj-course-faq"'+state+'><summary>Long question</summary><p>Answer</p></details>');
    assert.ok(html.startsWith('<details class="wp-block-details is-style-jwsnj-course-faq"'+state+'>'));
    assert.match(html,/<summary class="wp-block-details__summary">/);
    assert.match(html,/wp-block-details__button" aria-hidden="true"/);
    assert.match(html,/<div class="wp-block-details__inner"><p>Answer<\/p><\/div>/);
  }
});


test('course FAQ section reuses native Details and keeps the Figma stack spacing opt-in', () => {
  const group = readFileSync(new URL('../theme/css/blocks/wp-block-group-style.css', import.meta.url), 'utf8');
  const section = group.slice(group.indexOf('/* Course FAQ section PC 612:3259'));
  assert.match(section, /\.wp-block-group\.is-style-jwsnj-course-faq-section/);
  assert.match(section, /max-width:\s*calc\(961 \* var\(--to-rem-func\)\)/);
  assert.match(section, /gap:\s*calc\(24 \* var\(--to-rem-func\)\)/);
  assert.match(section, /justify-content:\s*center/);
  assert.match(section, /margin-bottom:\s*calc\(24 \* var\(--to-rem-func\)\)/);
  assert.match(section, /> \.wp-block-details\.is-style-jwsnj-course-faq,\s*> \.wp-block-group__inner-container > \.wp-block-details\.is-style-jwsnj-course-faq\s*\{\s*margin:\s*0/);
  assert.doesNotMatch(section, /white-space:\s*nowrap|(?:^|[;{}\n])\s*height\s*:/);
  const editor = readFileSync(new URL('../theme/inc/editor.php', import.meta.url), 'utf8');
  assert.match(editor, /register_block_style\('core\/group', array\(\s*'name' => 'jwsnj-course-faq-section'/);
  const file = new URL('../theme/patterns/course-faq.php', import.meta.url);
  const pattern = readFileSync(file, 'utf8');
  assert.match(pattern, /Slug:\s*jwsnj\/course-faq/);
  assert.match(pattern, /<h2 class="wp-block-heading">よくあるご質問<\/h2>/);
  assert.match(pattern, /<p>FAQ<\/p>/);
  assert.equal((pattern.match(/<!-- wp:details /g) || []).length, 1);
  assert.equal((pattern.match(/<!-- \/wp:details -->/g) || []).length, 1);
  assert.match(pattern, /<summary>日本語に不安がある場合も、入学を相談できますか？<\/summary>/);
  assert.match(pattern, /事前にお問い合わせください。/);
  assert.doesNotMatch(pattern, /展開するとテキスト|宿題というのは|<a\b|https?:\/\/|wp_insert_post|update_field|register_post_type|<details[^>]*\sopen(?:[=\s>])/);
  const raw = pattern.match(/<details[\s\S]*?<\/details>/)[0].replace(/<!--[\s\S]*?-->/g, '');
  const rendered = renderDetails(raw);
  assert.match(rendered, /<summary class="wp-block-details__summary">/);
  assert.match(rendered, /wp-block-details__button" aria-hidden="true"/);
  assert.match(rendered, /wp-block-details__inner/);
  execFileSync('php', ['-l', file.pathname]);
});
