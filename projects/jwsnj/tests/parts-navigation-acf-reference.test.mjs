import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = read('qa/fixtures/parts-catalog-owner-reference.html');
const variants = ['large', 'small'];
function reference(variant) {
  const name = 'navigation-' + variant;
  const match = source.match(new RegExp('<!-- wp:acf/' + name + ' (\\{[^\\n]+\\}) /-->'));
  assert.ok(match, name + ' exists in Human parts catalog');
  const block = JSON.parse(match[1]);
  const schema = JSON.parse(read('theme/acf/json/group_custom_block_navigation_' + variant + '.json'));
  const group = schema.fields.find(f => f.name === name);
  assert.equal(block.name, 'acf/' + name);
  assert.equal(schema.location[0][0].value, block.name);
  assert.equal(group.type, 'repeater');
  assert.equal(block.data['_' + name], group.key);
  assert.deepEqual(group.sub_fields.map(f => f.name), ['image', 'title', 'text', 'url', 'target']);
  assert.equal(group.sub_fields[0].return_format, 'id');
  assert.deepEqual(group.sub_fields[4].choices, { 'はい': 'はい' });
  const rows = Array.from({length: block.data[name]}, (_, i) => {
    const row = {};
    for (const f of group.sub_fields) {
      const key = name + '_' + i + '_' + f.name;
      assert.equal(block.data['_' + key], f.key, key);
      row[f.name] = block.data[key];
    }
    return row;
  });
  return rows;
}

test('Human catalog Large/Small ACF block comments still match all current field keys', () => {
  const large = reference('large'), small = reference('small');
  assert.equal(large.length, 2);
  assert.equal(small.length, 3);
  for (const rows of [large, small]) {
    assert.ok(rows.some(row => Array.isArray(row.target) && row.target.includes('はい')));
    assert.ok(rows.some(row => row.image && row.title && row.url));
  }
  assert.ok(small.some(row => !row.image && row.title));
});

test('actual existing ACF PHP renderers consume remapped catalog rows without changing schema', () => {
  // These are PHP API stubs, not ACF Pro or WordPress runtime acceptance.
  const theme = new URL('../theme/', import.meta.url).pathname;
  const php = "$rows = json_decode(base64_decode($argv[1]), true);\n$i = -1;\n$theme = $argv[2];\nfunction have_rows($name) { global $rows, $i; return $i + 1 < count($rows); }\nfunction the_row() { global $i; ++$i; }\nfunction get_sub_field($key) { global $rows, $i; return $rows[$i][$key] ?? ''; }\nfunction esc_html($s) { return htmlspecialchars((string) $s, ENT_QUOTES); }\nfunction esc_attr($s) { return esc_html($s); }\nfunction esc_url($s) { return preg_match('/^javascript:/i', $s) ? '' : esc_attr($s); }\nfunction wp_get_attachment_image_url($id, $size) { return $id === 101 ? '/fixture.webp' : false; }\nfunction get_post_meta($id, $key, $single) { return $id === 101 ? 'QA image' : ''; }\nfunction wp_get_attachment_image($id, $size, $icon = false, $attrs = []) { $url = wp_get_attachment_image_url($id, $size); return $url ? '<img src=\"' . $url . '\" alt=\"' . esc_attr($attrs['alt'] ?? '') . '\">' : ''; }\nfunction wp_kses_post($s) { return strip_tags($s, '<img>'); }\nfunction get_template_part($path, $name, $args) { global $theme; include $theme . $path . '.php'; }\ninclude $theme . 'acf/blocks/navigation' . ucfirst($argv[3]) . '.php';";
  for (const variant of variants) {
    const rows = reference(variant).map(row => ({...row, image: row.image ? 101 : '', url: '#qa-target'}));
    rows.push({image: 0, title: 'リンク未設定', text: '検証用本文', url: '', target: ['はい']});
    rows.push({image: 0, title: '<escaped>', text: '', url: 'javascript:alert(1)', target: ['はい']});
    rows.push({image: 0, title: '', text: '', url: '', target: ''});
    const html = execFileSync('php', ['-r', php, Buffer.from(JSON.stringify(rows)).toString('base64'), theme, variant], {encoding:'utf8'});
    assert.equal((html.match(/<li class="navigation">/g) || []).length, rows.length - 1);
    assert.equal((html.match(/href="#qa-target"/g) || []).length, rows.length - 3);
    assert.equal((html.match(/target="_blank"/g) || []).length, 1);
    assert.match(html, /&lt;escaped&gt;/);
    assert.match(html, /リンク未設定/);
    assert.doesNotMatch(html, /javascript:|href=""|2750|2747/);
    assert.ok(html.includes('/fixture.webp'));
    if (variant === 'small') assert.ok(html.includes('画像が無い場合'));
  }
});
