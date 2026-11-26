import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const helper = new URL('../theme/inc/css-assets.php', import.meta.url).pathname;
const fixture = () => {
  const dir = mkdtempSync(join(tmpdir(), 'jwsnj-css-assets-'));
  const write = (file, contents, time = 1700000000) => {
    const path = join(dir, file);
    mkdirSync(join(path, '..'), {recursive:true});
    writeFileSync(path, contents);
    utimesSync(path, time, time);
  };
  const read = () => JSON.parse(execFileSync('php', ['-r',
    'require $argv[1]; echo json_encode(jwsnj_css_import_files($argv[2]));',
    helper, join(dir, 'style.css')], {encoding:'utf8'}));
  const enqueue = () => JSON.parse(execFileSync('php', ['-r',
    'function get_theme_file_path($p){return $GLOBALS["argv"][2].$p;} function get_theme_file_uri($p){return "https://example.invalid/theme".$p;} function wp_register_style(...$a){$GLOBALS["calls"][]=["register",...$a];} function wp_enqueue_style(...$a){$GLOBALS["calls"][]=["enqueue",...$a];} require $argv[1]; jwsnj_enqueue_css_entry("entry","/style.css",["fonts"]); echo json_encode($GLOBALS["calls"]);',
    helper, dir], {encoding:'utf8'}));
  return {dir,write,read,enqueue,cleanup:()=>rmSync(dir,{recursive:true,force:true})};
};

test('only the changed stylesheet version changes and dependency order is preserved', () => {
  const f = fixture();
  try {
    f.write('style.css', '@charset "utf-8";\n@import "./base/reset.css";\n/* @import "./ignored.css"; */\n@import "./module/table.css";');
    f.write('base/reset.css', 'body { margin: 0; }');
    f.write('module/table.css', 'table { width: 100%; }');
    const before = f.read();
    assert.deepEqual(before,[['base/reset.css','1700000000'],['module/table.css','1700000000']]);
    f.write('module/table.css', 'table { width: auto; }',1700000100);
    assert.deepEqual(f.read(),[before[0],['module/table.css','1700000100']]);
    assert.deepEqual(f.enqueue(),[
      ['register','entry-base-reset','https://example.invalid/theme/base/reset.css',['fonts'],'1700000000','all'],
      ['register','entry-module-table','https://example.invalid/theme/module/table.css',['entry-base-reset'],'1700000100','all'],
      ['register','entry',false,['entry-module-table'],null,'all'],
      ['enqueue','entry']
    ]);
  } finally { f.cleanup(); }
});

test('unsupported imports, missing children and duplicate handles fall back atomically', () => {
  const f = fixture();
  try {
    f.write('a-b/c.css','a {}');
    f.write('a/b-c.css','b {}');
    for (const css of [
      '@import "./missing.css";',
      '@import "./a-b/c.css" screen;',
      '@import "./a-b/c.css"; body { color: red; }',
      '@import "./a-b/c.css"; @import "./a/b-c.css";',
      '@import "./a-b/c.css"; @import "./a-b/c.css";'
    ]) {
      f.write('style.css',css);
      assert.equal(f.read(),null,css);
      assert.deepEqual(f.enqueue(),[['enqueue','entry','https://example.invalid/theme/style.css',['fonts'],1700000000,'all']],css);
    }
  } finally { f.cleanup(); }
});
