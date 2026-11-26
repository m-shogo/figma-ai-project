import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { isAuthoredCssPath, reviewCssLine } from './css-quality-guard.mjs';
const ids = line => reviewCssLine(line).map(x => x.id);
test('portable CSS path policy excludes reference, generated and minified files', () => {
  for (const p of ['projects/jwsnj/theme/css/project/top.css','projects/new-app/src/Button.module.css','projects/lp/styles/main.css']) assert.ok(isAuthoredCssPath(p));
  for (const p of ['projects/jwsnj/reference/theme.css','projects/demo/vendor/style.css','projects/demo/dist/app.css','projects/demo/node_modules/a/x.css','projects/demo/theme/swiper.min.css','projects/demo/src/a.scss','docs/demo.css']) assert.equal(isAuthoredCssPath(p), false);
});
test('high-risk new CSS constructs get advisory codes', () => {
  for (const [line,id] of [
    ['@media (min-width: var(--bp)) {','CSS-MEDIA-VAR'],
    ['.parent:has(.cards) > & {','CSS-REVERSE-NEST'],
    ['outline: none;','CSS-FOCUS'],
    ['&-need {','CSS-NEST-CONCAT'],
    ['transition: .3s ease;','CSS-IMPLICIT-TRANSITION-ALL'],
    ['transition: var(--transition-duration);','CSS-IMPLICIT-TRANSITION-ALL'],
    ['transition: all 0.3s;','CSS-TRANSITION-ALL'],
    ['height: calc(57 * var(--to-rem-func));','CSS-FIXED-TEXT-HEIGHT'],
    ['width: 100vw;','CSS-VIEWPORT-WIDTH'],
    ['scroll-behavior: smooth;','CSS-SMOOTH-MOTION'],
  ]) assert.ok(ids(line).includes(id), line);
});
test('valid owner-local CSS, comments and ordinary responsive sizes stay quiet', () => {
  for (const line of ['@media (min-width: 48rem) {','&:has(~ .cards) {','&:focus-visible { outline: 2px solid currentColor; }','transition: opacity .3s, transform .3s;','transition: .3s opacity;','&.is-open {','.label-need {','min-height: calc(57 * var(--to-rem-func));','height: auto;','width: 100%;','/* outline: none; */','content: "outline: none;";','scroll-behavior: auto;']) assert.deepEqual(ids(line), [], line);
});

test('actual staged-diff guard warns in non-WP CSS and honors project exclusions', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'portable-css-guard-'));
  try {
    execFileSync('git', ['init','-q'], { cwd });
    const files = {
      'projects/example/guard.json': JSON.stringify({frozen:[],cssQualityIgnore:['src/copied.css']}),
      'projects/example/src/button.css': '.button { transition: .3s; }\n',
      'projects/example/src/copied.css': '.copied { transition: .3s; }\n',
      'projects/example/vendor/library.css': '.vendor { outline: none; }\n',
      'message.txt': 'test: staged CSS fixture\n',
    };
    for (const [file,contents] of Object.entries(files)) {
      const p = join(cwd,file);
      mkdirSync(dirname(p),{recursive:true});
      writeFileSync(p,contents);
    }
    execFileSync('git',['add','projects'],{cwd});
    const run=spawnSync(process.execPath,[fileURLToPath(new URL('./project-guard.mjs',import.meta.url)),'--commit-msg',join(cwd,'message.txt')],{cwd,encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    assert.match(run.stderr,/CSS-IMPLICIT-TRANSITION-ALL/);
    assert.match(run.stderr,/projects\/example\/src\/button\.css/);
    assert.doesNotMatch(run.stderr,/copied\.css|vendor\/library\.css/);
  } finally {
    rmSync(cwd,{recursive:true,force:true});
  }
});
