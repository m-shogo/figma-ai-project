// Dependency-free, advisory checks on added native CSS lines.
// This is not a CSS parser, a browser support matrix, or visual QA.
export function isAuthoredCssPath(file) {
  return /^projects\/[a-z0-9][a-z0-9-]*\/.+\.css$/i.test(file)
    && !/(?:^|\/)(?:reference|vendor|node_modules|dist|build|generated|\.local)(?:\/|$)/i.test(file)
    && !/\.min\.css$/i.test(file);
}

const rules = [
  ['CSS-MEDIA-VAR', /^\s*@media\b[^{};]*\bvar\s*\(/i, '通常のmedia query条件にruntime custom propertyは使えない。既存breakpoint契約を使う'],
  ['CSS-REVERSE-NEST', /(?:[>+~]\s*&|(?:^|\s)\.[\w-]+\s+&)\s*(?:[,{]|$)/, '逆向きの&は親の完全なselectorを参照する。実DOMと詳細度を確認する'],
  ['CSS-FOCUS', /(?:^|[;{\s])outline\s*:\s*(?:none|0(?:px)?)(?:\s*!important)?\s*(?:[;} ]|$)/i, 'outlineを消すなら同等以上のfocus-visibleとforced-colorsを確認する'],
  ['CSS-TRANSITION-ALL', /(?:^|[;{\s])transition(?:-property)?\s*:\s*[^;{}]*\ball\b/i, 'transition: allを避け、動かすpropertyを明示しreduced-motionを確認する'],
  ['CSS-FIXED-TEXT-HEIGHT', /(?:^|[;{\s])height\s*:\s*calc\(\s*\d+(?:\.\d+)?\s*\*\s*var\(--to-rem-func\)/i, '文字を含む箱なら固定heightではなくmin-heightと自然な伸縮。画像・装飾は別'],
  ['CSS-VIEWPORT-WIDTH', /(?:^|[;{\s])(?:width|inline-size)\s*:\s*100vw(?:\s*!important)?\s*(?:[;} ]|$)/i, '100vwのscrollbar込み横幅でoverflowしないか確認する'],
  ['CSS-SMOOTH-MOTION', /(?:^|[;{\s])scroll-behavior\s*:\s*smooth(?:\s*!important)?\s*(?:[;} ]|$)/i, 'reduced-motion時のscroll-behaviorと固定headerのscroll offsetを確認する'],
];

export function reviewCssLine(line) {
  if (/^\s*(?:\/\*|\*\/|\*\s|\/\/)/.test(line)) return [];
  // Single-line heuristics only. Remove simple block comments and quoted strings.
  const code = line.replace(/\/\*.*?\*\//g, '').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
  return rules.filter(([, pattern]) => pattern.test(code)).map(([id,,message]) => ({ id, message }));
}
