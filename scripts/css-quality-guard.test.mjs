import test from 'node:test';
import assert from 'node:assert/strict';
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
    ['transition: all 0.3s;','CSS-TRANSITION-ALL'],
    ['height: calc(57 * var(--to-rem-func));','CSS-FIXED-TEXT-HEIGHT'],
    ['width: 100vw;','CSS-VIEWPORT-WIDTH'],
    ['scroll-behavior: smooth;','CSS-SMOOTH-MOTION'],
  ]) assert.ok(ids(line).includes(id), line);
});
test('valid owner-local CSS, comments and ordinary responsive sizes stay quiet', () => {
  for (const line of ['@media (min-width: 48rem) {','&:has(~ .cards) {','&:focus-visible { outline: 2px solid currentColor; }','transition: opacity .3s, transform .3s;','min-height: calc(57 * var(--to-rem-func));','height: auto;','width: 100%;','/* outline: none; */','content: "outline: none;";','scroll-behavior: auto;']) assert.deepEqual(ids(line), [], line);
});
