import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-news-single-rhythm-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

async function measure(page) {
  return page.evaluate(() => {
    const title = document.querySelector('.module_titleSingle');
    const titleHead = document.querySelector('.module_titleSingle .head');
    const featured = document.querySelector('.single_featured');
    const image = document.querySelector('.single_featured img');
    const shell = featured?.closest('.global_inner._content');
    if (!title || !titleHead || !featured || !image || !shell) return null;

    const titleRect = title.getBoundingClientRect();
    const headRect = titleHead.getBoundingClientRect();
    const featuredRect = featured.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const titleStyle = getComputedStyle(title);
    const shellStyle = getComputedStyle(shell);
    const shellContentLeft = shellRect.left + parseFloat(shellStyle.paddingLeft);
    const shellContentRight = shellRect.right - parseFloat(shellStyle.paddingRight);

    return {
      layoutWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      title: {
        left: titleRect.left,
        right: titleRect.right,
        bottom: titleRect.bottom,
        paddingTop: parseFloat(titleStyle.paddingTop),
        paddingBottom: parseFloat(titleStyle.paddingBottom),
      },
      head: {
        left: headRect.left,
        width: headRect.width,
      },
      featured: {
        left: featuredRect.left,
        width: featuredRect.width,
        top: featuredRect.top,
      },
      image: {
        width: imageRect.width,
        height: imageRect.height,
      },
      shell: {
        contentLeft: shellContentLeft,
        contentRight: shellContentRight,
        contentWidth: shellContentRight - shellContentLeft,
      },
      titleToFeatured: featuredRect.top - titleRect.bottom,
    };
  });
}

const browser = await chromium.launch({ headless: true });
try {
  const spContext = await browser.newContext({
    viewport: { width: 375, height: 1200 },
    isMobile: true,
    hasTouch: true,
  });
  const spPage = await spContext.newPage();
  await spPage.goto(url, { waitUntil: 'networkidle' });
  const sp = await measure(spPage);
  assert(sp, 'SP News detail title/featured surfaces were not found.');
  assert(close(sp.title.left, 0) && close(sp.title.right, sp.layoutWidth), `SP title band must remain full width; ${sp.title.left}/${sp.title.right}/${sp.layoutWidth}.`);
  assert(close(sp.title.paddingTop, 32) && close(sp.title.paddingBottom, 32), `SP title band padding expected 32px block, got ${sp.title.paddingTop}/${sp.title.paddingBottom}.`);
  assert(close(sp.head.left, 32), `SP title inner left inset expected 32px, got ${sp.head.left}.`);
  assert(close(sp.head.width, 311), `SP title inner rail expected 311px, got ${sp.head.width}.`);
  assert(close(sp.featured.left, 24), `SP featured rail left inset expected 24px, got ${sp.featured.left}.`);
  assert(close(sp.featured.width, 327), `SP featured rail expected 327px, got ${sp.featured.width}.`);
  assert(close(sp.titleToFeatured, 48), `SP title-to-featured rhythm expected current Figma 48px, got ${sp.titleToFeatured}.`);
  assert(close(sp.image.width / sp.image.height, 1000 / 668, 0.01), `SP featured aspect expected 1000/668, got ${sp.image.width}/${sp.image.height}.`);
  assert(sp.documentWidth <= sp.layoutWidth + 1, `SP horizontal overflow: document=${sp.documentWidth}, layout=${sp.layoutWidth}.`);
  await spContext.close();

  const pcContext = await browser.newContext({ viewport: { width: 1380, height: 1200 } });
  const pcPage = await pcContext.newPage();
  await pcPage.goto(url, { waitUntil: 'networkidle' });
  const pc = await measure(pcPage);
  assert(pc, 'PC News detail title/featured surfaces were not found.');
  assert(close(pc.title.left, 0) && close(pc.title.right, pc.layoutWidth), `PC title band must remain full width; ${pc.title.left}/${pc.title.right}/${pc.layoutWidth}.`);
  assert(close(pc.title.paddingTop, 48) && close(pc.title.paddingBottom, 48), `PC title band padding expected 48px block, got ${pc.title.paddingTop}/${pc.title.paddingBottom}.`);
  assert(close(pc.head.width, 960), `PC title inner rail expected 960px, got ${pc.head.width}.`);
  assert(close(pc.shell.contentWidth, 960), `PC authored content rail expected 960px, got ${pc.shell.contentWidth}.`);
  assert(close(pc.featured.width, 800), `PC featured width expected 800px, got ${pc.featured.width}.`);
  assert(close(pc.featured.left, (pc.layoutWidth - 800) / 2), `PC featured image must remain centered in the layout viewport; left=${pc.featured.left}.`);
  assert(close(pc.image.width / pc.image.height, 1000 / 668, 0.01), `PC featured aspect expected 1000/668, got ${pc.image.width}/${pc.image.height}.`);
  assert(pc.documentWidth <= pc.layoutWidth + 1, `PC horizontal overflow: document=${pc.documentWidth}, layout=${pc.layoutWidth}.`);
  await pcContext.close();

  console.log('PASS Budokan News single PC/SP title and featured-content rhythm QA.');
} finally {
  await browser.close();
}
