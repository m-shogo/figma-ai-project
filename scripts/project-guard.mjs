#!/usr/bin/env node
// Mechanical checks for projects/<slug>/ changes, taken from repeated Human feedback.
// See docs/agent-human-fb-weak-spots.md. Modes:
//   --commit-msg <file>   git commit-msg hook: staged diff + message
//   --range <a>..<b>      CI: every commit in the range
//   --stop cursor|claude  agent stop hook: completion checklist when theme files changed
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });
const ROOT = git('rev-parse', '--show-toplevel').trim();
process.chdir(ROOT);

const PROJECT_FILE = /^projects\/([a-z0-9][a-z0-9-]*)\/(.+)$/;
const SCRATCH = /(^|\/)(tmp-[^/]*|[^/]*preview[^/]*\.html|[^/]+\.(bak|orig|rej))$/i;
const WHITESPACE_CHURN_LINES = 40;

const WARN_PATTERNS = [
  [/white-space:\s*nowrap/, 'W10 `nowrap`: 文字が増えたら折り返せるか'],
  [/(^|[\s;{])(height|width|min-width|min-height):\s*\d{2,}px/, 'W10 固定寸法: 内容が増えたら伸びるか（素材寸法なら可）'],
  [/body\.(home|page-|single|archive)/, 'ページ身元セレクタ: 呼び出し側の明示パラメーターにできないか'],
  [/!important/, '`!important`: 正しい owner で勝てないか'],
  [/:nth-child\(\d+\)|:nth-last-child\(\d+\)/, '完了前 9: 個数を変えても成り立つか（0 / 1 / 見本 / 見本+1）'],
];

const CHECKLIST = [
  '完了と言う前に docs/agent-human-fb-weak-spots.md の「完了前」を回し、結果を Human に報告すること:',
  '- 現行 Figma の hover / open / disabled / overlay を実 runtime で操作したか（静止画1枚で終えない）',
  '- 件数 0 / 1 / 見本 / 見本+1 と、文字が増えた場合を確認したか',
  '- gap の端・共通 padding との二重余白を実測したか',
  '- 同じ family の兄弟（他ボタン・他 overlay・SP/PC）を見たか',
  '- 管理画面・DB でやる作業と、上げるテーマファイルを分けて伝えたか',
];

function loadGuardConfig(slug) {
  const file = path.join('projects', slug, 'guard.json');
  if (!existsSync(file)) return { frozen: [] };
  return JSON.parse(readFileSync(file, 'utf8'));
}

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*');
  return new RegExp('^' + escaped.replace(/\u0000/g, '.*') + '$');
}

function approvals(message) {
  const found = new Set();
  for (const match of message.matchAll(/^Human-Approved:\s*(.+)$/gim)) {
    for (const token of match[1].split(/[,\s]+/)) if (token) found.add(token.toLowerCase());
  }
  return found;
}

// diffArgs selects the change set, e.g. ['--cached'] or ['<sha>^!'].
function inspect(diffArgs, message) {
  const errors = [];
  const warnings = [];
  const ok = approvals(message);
  const isStyleCommit = /^style(\(|:)/.test(message.trim());

  const nameStatus = git('diff', ...diffArgs, '--name-status', '-M').split('\n').filter(Boolean);
  const files = nameStatus
    .map((line) => {
      const parts = line.split('\t');
      return { status: parts[0], file: parts[parts.length - 1] };
    })
    // A pure move changes no content; nothing to judge.
    .filter(({ status }) => status !== 'R100');
  const projectFiles = files.filter(({ file }) => PROJECT_FILE.test(file) && !file.startsWith('projects/_template/'));
  if (projectFiles.length === 0) return { errors, warnings, themeTouched: false };

  const full = new Map();
  const ignoringSpace = new Map();
  const numstat = (extra) => git('diff', ...diffArgs, '--numstat', '--no-renames', ...extra).split('\n').filter(Boolean);
  for (const line of numstat([])) {
    const [a, d, file] = line.split('\t');
    full.set(file, (Number(a) || 0) + (Number(d) || 0));
  }
  for (const line of numstat(['-w', '--ignore-blank-lines'])) {
    const [a, d, file] = line.split('\t');
    ignoringSpace.set(file, (Number(a) || 0) + (Number(d) || 0));
  }

  const churned = [];
  let hasRealChange = false;
  for (const { file } of projectFiles) {
    const total = full.get(file) ?? 0;
    const real = ignoringSpace.get(file) ?? 0;
    if (real > 0) hasRealChange = true;
    if (total - real > WHITESPACE_CHURN_LINES) churned.push(`${file} (${total} 行中 ${total - real} 行が空白だけの変更)`);
  }
  if (churned.length && hasRealChange && !isStyleCommit) {
    errors.push(['整形（インデント・空白）と修正が同じコミットに入っている。整形は `style(<slug>): …` の別コミットにする:', ...churned].join('\n  '));
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  for (const { status, file } of projectFiles) {
    const [, slug, rest] = file.match(PROJECT_FILE);
    const config = loadGuardConfig(slug);

    if (status === 'A' && rest.startsWith('theme/') && SCRATCH.test(rest)) {
      errors.push(`一時ファイル・プレビューを Theme に入れない（projects/${slug}/.local/ へ）: ${file}`);
    }

    if (/^theme\/acf\/json\/[^/]+\.json$/.test(rest) && status !== 'D') {
      if (!ok.has('acf-json')) {
        errors.push(`ACF field group JSON の変更は Human の明示が必要（W9）。指示があるならコミットメッセージに \`Human-Approved: acf-json\`: ${file}`);
      }
      const blob = diffArgs[0] === '--cached' ? git('show', `:${file}`) : git('show', `${diffArgs[0].replace(/\^!$/, '')}:${file}`);
      const modified = blob.match(/"modified":\s*(\d+)/);
      if (modified && Number(modified[1]) > nowSeconds) {
        errors.push(`ACF JSON の modified が未来（同期表示が消えなくなる）: ${file}`);
      }
    }

    if (config.frozen.some((glob) => globToRegExp(glob).test(rest)) && !ok.has('frozen')) {
      errors.push(`凍結中のファイル（projects/${slug}/guard.json）。Human の指示があるならコミットメッセージに \`Human-Approved: frozen\`: ${file}`);
    }
  }

  const themeFiles = projectFiles.filter(({ file }) => /^projects\/[^/]+\/theme\/.+\.(css|scss|php|js)$/.test(file));
  if (themeFiles.length) {
    const patch = git('diff', ...diffArgs, '-U0', '-w', '--no-renames', '--', ...themeFiles.map(({ file }) => file));
    const hits = new Map();
    let current = '';
    for (const line of patch.split('\n')) {
      if (line.startsWith('+++ ')) current = line.slice(6);
      if (!line.startsWith('+') || line.startsWith('+++')) continue;
      for (const [pattern, note] of WARN_PATTERNS) {
        if (!pattern.test(line)) continue;
        if (!hits.has(note)) hits.set(note, []);
        hits.get(note).push(`${current}: ${line.slice(1).trim()}`);
      }
    }
    for (const [note, lines] of hits) {
      const more = lines.length > 3 ? `\n    ほか ${lines.length - 3} 件` : '';
      warnings.push(`${note}（${lines.length} 件）\n    ${lines.slice(0, 3).join('\n    ')}${more}`);
    }
  }

  return { errors, warnings, themeTouched: themeFiles.length > 0 };
}

function report({ errors, warnings }, label) {
  for (const warning of warnings) console.error(`WARN ${label}${warning}`);
  for (const error of errors) console.error(`FAIL ${label}${error}`);
}

function runCommitMsg(messageFile) {
  const message = readFileSync(messageFile, 'utf8');
  const result = inspect(['--cached'], message);
  report(result, '');
  if (result.errors.length) {
    console.error('\nproject-guard: コミットを止めました。直してからもう一度コミットしてください。');
    process.exit(1);
  }
}

function runRange(range) {
  const shas = git('rev-list', '--reverse', '--no-merges', range).split('\n').filter(Boolean);
  let failed = 0;
  for (const sha of shas) {
    const message = git('log', '-1', '--format=%B', sha);
    const result = inspect([`${sha}^!`], message);
    report(result, `${sha.slice(0, 8)} `);
    if (result.errors.length) failed++;
  }
  console.log(`project-guard: ${shas.length} commits checked, ${failed} failed`);
  if (failed) process.exit(1);
}

function changedThemeFilesSinceUpstream() {
  let base = 'HEAD';
  try {
    base = git('rev-parse', '--verify', '--quiet', '@{upstream}').trim() || 'HEAD';
  } catch {
    base = 'HEAD';
  }
  const tracked = git('diff', '--name-only', base).split('\n');
  const untracked = git('ls-files', '--others', '--exclude-standard').split('\n');
  return [...new Set([...tracked, ...untracked])]
    .filter((file) => /^projects\/[^/]+\/theme\//.test(file))
    .sort();
}

function runStop(client) {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    input = {};
  }
  const silent = () => {
    process.stdout.write('{}');
    process.exit(0);
  };
  if (client === 'cursor' && ((input.loop_count ?? 0) > 0 || (input.status && input.status !== 'completed'))) silent();
  if (client === 'claude' && input.stop_hook_active) silent();

  const files = changedThemeFilesSinceUpstream();
  if (files.length === 0) silent();

  // Remind once per distinct change set, not on every turn.
  const fingerprint = createHash('sha256').update(files.join('\n') + git('diff', 'HEAD', '--', ...files)).digest('hex');
  const stamp = path.join(git('rev-parse', '--git-dir').trim(), 'project-guard-stop');
  if (existsSync(stamp) && readFileSync(stamp, 'utf8') === fingerprint) silent();
  writeFileSync(stamp, fingerprint);

  const preview = files.slice(0, 8).map((file) => `- ${file}`);
  if (files.length > 8) preview.push(`- ほか ${files.length - 8} ファイル`);
  const message = [`Theme ファイルが未 push で変わっている:`, ...preview, '', ...CHECKLIST].join('\n');

  if (client === 'claude') {
    process.stdout.write(JSON.stringify({ decision: 'block', reason: message }));
  } else {
    process.stdout.write(JSON.stringify({ followup_message: message }));
  }
  process.exit(0);
}

const [mode, value] = process.argv.slice(2);
if (mode === '--commit-msg') runCommitMsg(value);
else if (mode === '--range') runRange(value);
else if (mode === '--stop') runStop(value);
else {
  console.error('usage: project-guard.mjs --commit-msg <file> | --range <a>..<b> | --stop cursor|claude');
  process.exit(2);
}
