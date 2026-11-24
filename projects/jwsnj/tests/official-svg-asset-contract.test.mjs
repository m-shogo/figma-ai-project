// Official Figma SVG bytes for jwsnj Header/Footer. Issue #524.
// Run: node --test projects/jwsnj/tests/official-svg-asset-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);

function read(relativePath) {
  return readFileSync(new URL(relativePath, root));
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

const assets = {
  'src/images/common/footer/img_footer-left.svg': {
    sha256: '5241b65c7fea16db3c56d6a837406da8bda4e6d63f3d9b42802e364cceaf2135',
    width: '408',
    height: '99.9255',
    source: '221:335 img_footer-left',
  },
  'src/images/common/footer/img_footer-left-sp.svg': {
    sha256: 'aac2ebc6d022d5fb3752a3ecfa65cb7c82270cda68bc822a510e316c513d586b',
    width: '155',
    height: '81.8729',
    source: '506:1632 / 279:2637 img_footer-left',
  },
  'src/images/common/footer/img_footer-line.svg': {
    sha256: '394727bbc21346bce2cadb2bbc6d4ff13ea62d006a4d60dca9d0c1739b07961c',
    width: '309',
    height: '1',
    source: '221:335 line',
  },
  'src/images/common/footer/img_footer-line-sp.svg': {
    sha256: 'd8fd55fbbe824ecc34eb63e3e818052810fca5115f084c6a678807495b231cd1',
    width: '117.461',
    height: '1',
    source: '279:2687 line',
  },
  'src/images/common/footer/img_student-01.svg': {
    sha256: 'f507a688ff98a54a014ea48927702577390cdfe7e1e9a3c47bceb501b773685d',
    width: '49',
    height: '75.6629',
    source: '221:335 img_student-01',
  },
  'src/images/common/footer/img_student-01-sp.svg': {
    sha256: 'fcc1ce97b4d9d646940706f575aa536a5065fbc3d9f22ac9d73fd7a4c68d2a53',
    width: '37.8264',
    height: '59.7736',
    source: '279:2687 img_student-01',
  },
  'src/images/common/footer/img_puzzle-02.svg': {
    sha256: 'd566c00be7a5b297214bad6f177defc1d71791d07dfce647528880ba9f30b18d',
    width: '100',
    height: '75.6627',
    source: '221:335 img_pazzle-02',
  },
  'src/images/common/footer/img_puzzle-02-sp.svg': {
    sha256: '1b8fe3f4409cff22f688f20e1be60dabadd03e0aa53b2210024785e3682533ec',
    width: '79.6345',
    height: '59.7732',
    source: '279:2687 img_pazzle-02',
  },
  'src/images/common/footer/img_footer-bullet.svg': {
    sha256: 'f25dfc39567c523b449be7c0f28061b57564d81f2aee05ae23b9fdd270450a0d',
    width: '5.41839',
    height: '5.41839',
    source: '221:335 ellipse bullet',
  },
  'src/images/common/img_njws-logo.svg': {
    sha256: 'caea24ac82c1245dbe584dcead3dcf59a03fed21ef4b5070cd0efec6302a4935',
    width: '51',
    height: '48',
    source: '221:335 / 114:489 njws_logo',
  },
  'src/images/common/img_njws-logo-header.svg': {
    sha256: 'e2deaf953f45821b8f84a7332387cf3388b9d0e170d81310b79ce96904730aef',
    width: '60',
    height: '57',
    source: '221:334 / 114:46 njws_logo',
  },
  'src/images/common/ico_admission.svg': {
    sha256: '0dc7b2497b1c81f7b1757e0f33f67ed9c4e90496344b7d4847963a9add043ac7',
    width: '26',
    height: '26',
    source: '221:334 ico_admission',
  },
  'src/images/common/ico_parents.svg': {
    sha256: 'f3db2822dc514eb90d30b8d444772a23bf9efd61a0d56325102ecea9773a4e85',
    width: '26',
    height: '26',
    source: '221:334 ico_parents',
  },
  'src/images/common/ico_recruit.svg': {
    sha256: 'e87b850447fd9a9d7d2550a8fff1b6969f5f3476f2236c17b1d9a92fde12de36',
    width: '27',
    height: '27',
    source: '221:334 ico_recruit',
  },
  'src/images/common/ico_blossom.svg': {
    sha256: '4efe78a214aca7b5262605dfc1e6a2fee430893248258eeab7171761f2b6f6af',
    width: '12',
    height: '12',
    source: '506:2533 ico_blossom',
  },
  'src/images/common/ico-blank.svg': {
    sha256: 'd758bac11c1e768bf353c97f39937f8f5d00c404d2dae82e49929bf17aa4c84e',
    width: '13.0001',
    height: '12.0001',
    source: '344:985 ico-blank',
  },
  'src/images/common/ico_school.svg': {
    sha256: 'da5f484d5d93e940271830065f25858c874906215854b58476d17b846d4f55f7',
    width: '40',
    height: '37',
    source: '599:3205 ico_school',
  },
};

const header = read('theme/template-parts/_header.php').toString('utf8');
const footer = read('theme/template-parts/_footer.php').toString('utf8');

test('official SVG bytes match between src and theme and keep Figma root geometry', () => {
  for (const [relativePath, expected] of Object.entries(assets)) {
    const source = read(relativePath);
    const themePath = relativePath.replace('src/images/', 'theme/images/');
    const theme = read(themePath);
    assert.equal(sha256(source), expected.sha256, relativePath);
    assert.equal(sha256(theme), expected.sha256, themePath);
    const rootTag = source.toString('utf8').slice(0, 240);
    assert.match(rootTag, new RegExp(`width="${expected.width}"`));
    assert.match(rootTag, new RegExp(`height="${expected.height}"`));
    assert.equal(source.includes('figma.com'), false, expected.source);
  }
});

test('sample wordmark logo.svg is not the official njws mark', () => {
  const sample = sha256(read('src/images/common/logo.svg'));
  assert.notEqual(sample, assets['src/images/common/img_njws-logo.svg'].sha256);
  assert.notEqual(sample, assets['src/images/common/img_njws-logo-header.svg'].sha256);
  assert.equal(sha256(read('theme/images/common/logo.svg')), sample);
});

test('header and footer call the official mark and footer art, not temporary Figma URLs', () => {
  assert.match(header, /images\/common\/img_njws-logo-header\.svg/);
  assert.doesNotMatch(header, /images\/common\/logo\.svg/);
  assert.match(header, /class="gh_logo-name"/);
  assert.match(footer, /images\/common\/img_njws-logo\.svg/);
  assert.match(footer, /images\/common\/footer\/img_footer-left\.svg/);
  assert.match(footer, /images\/common\/footer\/img_footer-left-sp\.svg/);
  assert.match(footer, /images\/common\/footer\/img_student-01\.svg/);
  assert.match(footer, /images\/common\/footer\/img_puzzle-02\.svg/);
  assert.doesNotMatch(header + footer, /figma\.com\/api\/mcp\/asset/);
  assert.doesNotMatch(header, /ico_admission\.svg|ico_parents\.svg|ico_recruit\.svg/);
  assert.match(footer, /esc_html\(get_bloginfo\('name'\)\)/);
});
