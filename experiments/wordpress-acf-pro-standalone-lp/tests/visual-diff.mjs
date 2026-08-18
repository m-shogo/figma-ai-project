import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.resolve(testDir, '..');
const dependencyPackage = process.env.QA_DEPENDENCY_PACKAGE || path.join(fixtureRoot, '.runtime', 'playwright', 'package.json');
const runtimeRequire = createRequire(dependencyPackage);
const pixelmatch = (await import(pathToFileURL(runtimeRequire.resolve('pixelmatch')).href)).default;
const { PNG } = runtimeRequire('pngjs');

const referencePath = process.env.VISUAL_DIFF_REFERENCE || '';
const actualPath = process.env.VISUAL_DIFF_ACTUAL || '';
const outputPath = process.env.VISUAL_DIFF_OUTPUT || '.runtime/visual-diff.png';
const maxRatioValue = process.env.VISUAL_DIFF_MAX_RATIO;

if (!referencePath || !actualPath || !fs.existsSync(referencePath) || !fs.existsSync(actualPath)) {
  console.log('SKIP FIGMA_FIDELITY: actual Figma reference and matching runtime screenshot are required.');
  process.exit(0);
}

const reference = PNG.sync.read(fs.readFileSync(referencePath));
const actual = PNG.sync.read(fs.readFileSync(actualPath));
if (reference.width !== actual.width || reference.height !== actual.height) {
  console.error(`FAIL FIGMA_FIDELITY: dimensions differ reference=${reference.width}x${reference.height} actual=${actual.width}x${actual.height}`);
  process.exit(1);
}

const diff = new PNG({ width: reference.width, height: reference.height });
const diffPixels = pixelmatch(reference.data, actual.data, diff.data, reference.width, reference.height, { threshold: 0.1 });
const ratio = diffPixels / (reference.width * reference.height);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, PNG.sync.write(diff));
console.log(`FIGMA_FIDELITY diffPixels=${diffPixels} ratio=${ratio}`);

if (maxRatioValue === undefined || maxRatioValue === '') {
  console.log('MEASURE_ONLY: set VISUAL_DIFF_MAX_RATIO from the project/reference contract to assert PASS/FAIL.');
  process.exit(0);
}
const maxRatio = Number(maxRatioValue);
if (!Number.isFinite(maxRatio) || maxRatio < 0) {
  console.error('FAIL VISUAL_DIFF_MAX_RATIO must be a non-negative number.');
  process.exit(2);
}
if (ratio > maxRatio) {
  console.error(`FAIL FIGMA_FIDELITY ratio ${ratio} exceeds ${maxRatio}`);
  process.exit(1);
}
console.log(`PASS FIGMA_FIDELITY ratio ${ratio} <= ${maxRatio}`);
