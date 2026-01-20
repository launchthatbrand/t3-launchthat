import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore
import potrace from 'potrace';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const publicDir = path.resolve(appRoot, 'public', 'images');

const inputPath = path.resolve(publicDir, 'traderlaunchpad-icon-alpha.png');
const outputPath = path.resolve(publicDir, 'traderlaunchpad-icon.svg');

console.log(`Tracing ${inputPath} to ${outputPath}...`);

async function convert() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  // Pre-process with sharp:
  // 1. Flatten to white background (handles alpha)
  // 2. Convert to grayscale (optional, but helps verify what potrace sees)
  // 3. Output as PNG buffer
  const buffer = await sharp(inputPath)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toFormat('png')
    .toBuffer();

  // Potrace Params
  // threshold: 0-255. Pixels < threshold become "black" (foreground).
  // Rocket is dark, Flame is medium, Cloud is light.
  // To capture light objects as foreground, we need a HIGH threshold.
  // Almost everything except pure white (background) should be foreground.
  const params = {
    threshold: 245, 
    optCurve: true,
    optTolerance: 0.2,
    turdSize: 5, // Remove only very small specks
    alphaMax: 1,
    color: '#000000', // Output path color
  };

  potrace.trace(buffer, params, (err: Error | null, svg: string) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    fs.writeFileSync(outputPath, svg);
    console.log(`SVG saved to ${outputPath}`);
  });
}

convert().catch(err => {
  console.error(err);
  process.exit(1);
});
