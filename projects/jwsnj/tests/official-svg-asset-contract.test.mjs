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
  'src/images/common/img_hero-figure.svg': {
    sha256: 'f4e5143d510b892790a272a9f3ab16b700723806151d71839112f131e5c5f14c',
    width: '20.0485',
    height: '74.6642',
    source: '390:803 and identical 384:1404',
  },
  'src/images/common/img_hero-figure-02.svg': {
    sha256: '688163a2d7fb414cd64124daef4e236bbc11f35cb54b9dbfff42dcef8ed01741',
    width: '21.6551',
    height: '84',
    source: '390:832 and identical 384:1433',
  },
  'src/images/common/img_hero-bubble.svg': {
    sha256: '955a83c94397a152eefd77f3c5573d7c54e39c636b39d36221717db02fffb9c9',
    width: '16',
    height: '14',
    source: '390:856 and identical 384:1457',
  },
  'src/images/common/img_flyout-shadow.svg': {
    sha256: '9e72677dcc10cd7be9e91e8e4282d0ec1994d5d3c803d7568fef3827b2522361',
    width: '222',
    height: '212',
    source: '604:3024 shadow union',
  },
  'src/images/common/img_flyout-union.svg': {
    sha256: 'fb3564fd71c1dd7eb47981b765a358234c5d43e7d1ce41fa855b9fc98ea9b2e8',
    width: '216',
    height: '206',
    source: '604:3025 white union',
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

test('hero decorations use the saved official figures and bubble', () => {
  const archive = read('theme/template-parts/_news-archive-visual.php').toString('utf8');
  const page = read('theme/template-parts/_fixed-page-visual.php').toString('utf8');
  for (const file of [archive, page]) {
    assert.match(file, /images\/common\/img_hero-figure\.svg/);
    assert.match(file, /images\/common\/img_hero-figure-02\.svg/);
    assert.doesNotMatch(file, /figma\.com\/api\/mcp\/asset/);
  }
  assert.match(archive, /images\/common\/img_hero-bubble\.svg/);
  assert.doesNotMatch(page, /img_hero-bubble\.svg|About us/);
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

const topSvgs = {
  'src/images/top/img_catch-480.svg': ['bf3238d9f431cf1e7adc6d3e8d10052651983ca3daf249921347bba8072520b1', '57.9853', '57.1783'],
  'src/images/top/img_catch-482.svg': ['022fc6328adb2454e9285602e85ab4763d27767f418a5250e7cb0d1e8bfd6f49', '57.9804', '57.183'],
  'src/images/top/img_catch-481.svg': ['ce53aa28a31515b6a0f77f326307b1feee70fe8310bf05a4af4f682c5af967c6', '58.4796', '65.4783'],
  'src/images/top/img_catch-483.svg': ['8bd458a97a67a9b253f77e451f2450623568406b9ae50ca66759681bfddf1658', '58.4844', '65.4796'],
  'src/images/top/img_catch-493.svg': ['94fc2a8953af96d4c7628022cae915fa6994dcaddf1a7b75b1344f5718c116dd', '28.9204', '21'],
  'src/images/top/img_catchphrase-sp.svg': ['3693b602a5b7208e870e824cf51912bbe26171751961e284e2d576d83bdad1d2', '192', '64'],
  'src/images/top/img_map.svg': ['b51eff2d9c92763a4416cdb5ca849c0b246e075eff582971af0d01a1d2faf699', '280', '534'],
  'src/images/top/img_map-pin-01.svg': ['71e289e929c102308786d4773d04f71ab450a4394844feead2bf517dbcedfc3c', '78.0012', '95.0011'],
  'src/images/top/img_map-pin-02.svg': ['905000a94fe77e5d83a4b0295b482c83c76601341e88f0501a0269be0c9e6408', '77.0049', '101.993'],
  'src/images/top/img_course-layer.svg': ['3ee87ec1517c11ac1091a3b3b95025ece8f8dd94231c120c8b53ced846aa4762', '145.204', '174.952'],
  'src/images/top/img_course-mark.svg': ['86c2ec900f449bfefdaef7659885aef8664b6b447796aff93e4fcbf97c5d3a2e', '34.8555', '40.6094'],
  'src/images/top/img_course-math.svg': ['1144425de1cdeff3e2b8cbc5ce48d3a3c153653d56b78cc2ece6b6fe944e66f7', '93.569', '128.117'],
  'src/images/top/ico_flow.svg': ['d109da664568d8f5c6b8579a412e770dfe5fca6c48e1d9350d654f00429f17ff', '56', '56'],
  'src/images/top/ico_fee.svg': ['cd9b5e4831b8b87b6b8f05047ab1ebba6f3cbfeb8567519669bb41834692de09', '56.0005', '50.9999'],
  'src/images/top/ico_visit.svg': ['6532d82e92971cf28da8358fa450478e6436d325769ea3332cfd8b6f02fe770b', '56', '52'],
  'src/images/top/img_instagram.svg': ['103e7e62611da78f0fec53ab8679b9b37fc02470592498285853eedfcf4e5122', '66', '155.005'],
  'src/images/top/img_about-underline.svg': ['8b60ba56e07726218d6c072a837a4ca353e155f2ac16d8065bc8dc78480526ad', '142', '6'],
};

const topPhotos = {
  'src/images/top/img_mv-01.webp': '0161bb2678b77b87de1976cdccf54d7403ef52ec0673e61c98d1c9da149b8d9b',
  'src/images/top/img_mv-02.webp': '234f8bd074104ff646d54b761a36fdfbc0cec48a9a18668e04cb8e182be96098',
  'src/images/top/img_mv-03.webp': 'b00b046165f1574978c0f4fb0ba4468a2f8c7e3c5d17ce3b7a050a5c06eebe49',
  'src/images/top/img_mv-03-fill.webp': 'eba27ad323a730260dad0149b3a62a25df6bd4c806fa229f826196ddc8eb0edd',
  'src/images/top/img_mv-04.webp': '2b55acb91d94f40a6cd1d95b2de60d06e8024a1c1b0173f3df8530c4e208962b',
  'src/images/top/img_mv-05.webp': 'fa8b4d303f04ba40544d30ab0922a0b5bd1dfab7fa6b9a57bab46a46c618d55d',
  'src/images/top/img_mv-06.webp': '5ffc1aa303d7b81158f4c659787b37ade2ba858bbbdd63b45d00399dd0912c1d',
  'src/images/top/img_about-overview.webp': 'ff4c1a711e8c7e64b127ed7105ce5e23c695bdbda52d4acccf1ff803859bb072',
  'src/images/top/img_about-education.webp': 'b6a90e9f3b08a72c560f7355aab0a6a8c1a6d2592c174cfb951ef35b453906d8',
  'src/images/top/img_about-bg.webp': 'bd1efe6e92d21ec8c62aaf23df04bfecf2303582205e20c53c3bd312a02fdc87',
  'src/images/top/img_about-bg-02.webp': '5880cf99166e22456a65a383b8a80ce1ed218f519d538a57e51d8b808245fdd4',
  'src/images/top/img_about-bg-03.webp': '4a52fb9293f429ab6107a4eddd44abeb1b0d44255eb4d0e50b82d2650bc73738',
  'src/images/top/img_course-preschool.webp': 'bc5bd237a804c84b6cfa7d342d90f0d1b7ac837177c9fae2c36cb21bd6cb0024',
  'src/images/top/img_course-elementary.webp': '44d3041a294766cdb2f80fc96dd0a1dcc851485cd7082faf38f88b6c744c1467',
  'src/images/top/img_course-junior.webp': 'cbb0e9e19f5f3157a8ad9518c525595a4ab39152c660043ef3575e9716559aea',
  'src/images/top/img_course-high.webp': '99a800cb526ddef89ece6747aa6f7e531d0ef45bc4c43d3ee7edd5fd5727d88d',
  'src/images/top/img_course-international.webp': 'd0aa6dc0f5d35e9bdb911555f2cccc18ee4b2a98aea20e52e17ba4c9ab2f7287',
  'src/images/top/img_banner.webp': '640d9527b85cdb5cd8d8d918840f864ef42bbaa81624b9de7d7ebc9467d0aac1',
  'src/images/top/img_banner-02.webp': 'e5975385dd17e6629e78f919d3cf63ee9be9647392ecf7a96657148d3cb78cf6',
  'src/images/top/img_banner-03.webp': 'a6ce5c27cdf574768a8e75275cffe6b2471d58a6fdf364b68a60a1f46f93e5dc',
  'src/images/top/img_applicants.webp': 'e58b16406c4158556b123f80981465b370949d5bd1e741f1b38358209cc91e9f',
};

test('TOP official SVG and WebP bytes match between src and theme', () => {
  for (const [relativePath, expected] of Object.entries(topSvgs)) {
    const source = read(relativePath);
    const theme = read(relativePath.replace('src/images/', 'theme/images/'));
    assert.equal(sha256(source), expected[0], relativePath);
    assert.equal(sha256(theme), expected[0], relativePath);
    const rootTag = source.toString('utf8').slice(0, 280);
    assert.match(rootTag, new RegExp(`width="${expected[1]}"`));
    assert.match(rootTag, new RegExp(`height="${expected[2]}"`));
    assert.equal(source.includes('figma.com'), false, relativePath);
  }
  for (const [relativePath, expectedHash] of Object.entries(topPhotos)) {
    const source = read(relativePath);
    const theme = read(relativePath.replace('src/images/', 'theme/images/'));
    assert.equal(sha256(source), expectedHash, relativePath);
    assert.equal(sha256(theme), expectedHash, relativePath);
    assert.equal(source.subarray(0, 4).toString('ascii'), 'RIFF', relativePath);
    assert.equal(source.subarray(8, 12).toString('ascii'), 'WEBP', relativePath);
  }
});

test('Font Awesome stylesheet has one front-end enqueue owner', () => {
  const head = read('theme/template-parts/_head_contents.php').toString('utf8');
  const front = read('theme/inc/front.php').toString('utf8');
  assert.doesNotMatch(head, /all\.min\.css|<\?php if \(false\):/);
  assert.equal([...front.matchAll(/^\s*wp_enqueue_style\('fontawesome-style',\s*get_theme_file_uri\('\/css\/all\.min\.css'\),[^\n]+/gm)].length, 1);
  assert.match(head, /NotoSansJP-Regular\.woff2/);
  assert.match(head, /fonts\.googleapis\.com/);
  assert.ok(read('theme/css/all.min.css').length > 0);
});
