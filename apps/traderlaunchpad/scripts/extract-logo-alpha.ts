import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Two-pass alpha extraction:
 * Given the same foreground rendered on white and black backgrounds, recover a clean alpha channel
 * and un-premultiplied RGB (removes white/black halos).
 *
 * We generate those two inputs by compositing the current icon (which may have imperfect edges)
 * onto pure white and pure black backgrounds, then recover improved alpha.
 */

type RGB = { r: number; g: number; b: number };

const BLACK: RGB = { r: 0, g: 0, b: 0 };
const WHITE: RGB = { r: 255, g: 255, b: 255 };

async function fileExists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function compositeOnSolidBackground(
  inputPath: string,
  bg: RGB,
  outputPath: string,
) {
  const img = sharp(inputPath).ensureAlpha();
  const meta = await img.metadata();
  if (!meta.width || !meta.height) {
    throw new Error(`Could not read dimensions for ${inputPath}`);
  }
  const background = sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 3,
      background: { r: bg.r, g: bg.g, b: bg.b },
    },
  });

  // Composite the (possibly transparent) icon onto the background.
  await background
    .composite([{ input: await img.png().toBuffer() }])
    .png()
    .toFile(outputPath);
}

export async function extractAlphaTwoPass(
  imgOnWhitePath: string,
  imgOnBlackPath: string,
  outputPath: string,
) {
  const img1 = sharp(imgOnWhitePath);
  const img2 = sharp(imgOnBlackPath);

  const { data: dataWhite, info: meta } = await img1
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: dataBlack } = await img2
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (dataWhite.length !== dataBlack.length) {
    throw new Error("Dimension mismatch: Images must be identical size");
  }

  const outputBuffer = Buffer.alloc(dataWhite.length);

  // Distance between White (255,255,255) and Black (0,0,0)
  // sqrt(255^2 + 255^2 + 255^2) ≈ 441.67
  const bgDist = Math.sqrt(3 * 255 * 255);

  const totalPixels = meta.width * meta.height;
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;

    const rW = dataWhite[offset]!;
    const gW = dataWhite[offset + 1]!;
    const bW = dataWhite[offset + 2]!;

    const rB = dataBlack[offset]!;
    const gB = dataBlack[offset + 1]!;
    const bB = dataBlack[offset + 2]!;

    const pixelDist = Math.sqrt(
      Math.pow(rW - rB, 2) + Math.pow(gW - gB, 2) + Math.pow(bW - bB, 2),
    );

    // If pixel is fully opaque, it looks the same on black/white => pixelDist = 0 => alpha = 1
    // If fully transparent, it matches backgrounds => pixelDist ≈ bgDist => alpha ≈ 0
    let alpha = 1 - pixelDist / bgDist;
    alpha = Math.max(0, Math.min(1, alpha));

    let rOut = 0;
    let gOut = 0;
    let bOut = 0;

    if (alpha > 0.01) {
      // Recover foreground color from black-composited version:
      // (C - (1-alpha)*BG)/alpha ; BG=0 -> C/alpha
      rOut = rB / alpha;
      gOut = gB / alpha;
      bOut = bB / alpha;
    }

    outputBuffer[offset] = Math.round(Math.min(255, rOut));
    outputBuffer[offset + 1] = Math.round(Math.min(255, gOut));
    outputBuffer[offset + 2] = Math.round(Math.min(255, bOut));
    outputBuffer[offset + 3] = Math.round(alpha * 255);
  }

  await sharp(outputBuffer, {
    raw: { width: meta.width, height: meta.height, channels: 4 },
  })
    .png()
    .toFile(outputPath);
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const appRoot = path.resolve(__dirname, ".."); // .../apps/traderlaunchpad
  const repoRoot = path.resolve(appRoot, "..", ".."); // repo root
  const publicDir = path.resolve(appRoot, "public", "images");

  const inputIcon = path.resolve(publicDir, "traderlaunchpad-icon.png");
  const outputIcon = path.resolve(publicDir, "traderlaunchpad-icon.png");

  if (!(await fileExists(inputIcon))) {
    throw new Error(`Missing input icon: ${inputIcon}`);
  }

  const tmpDir = path.resolve(repoRoot, ".tmp", `alpha-extract-${Date.now()}`);
  await fs.mkdir(tmpDir, { recursive: true });

  const onWhite = path.resolve(tmpDir, "icon-on-white.png");
  const onBlack = path.resolve(tmpDir, "icon-on-black.png");
  const improved = path.resolve(tmpDir, "icon-improved.png");

  await compositeOnSolidBackground(inputIcon, WHITE, onWhite);
  await compositeOnSolidBackground(inputIcon, BLACK, onBlack);

  await extractAlphaTwoPass(onWhite, onBlack, improved);

  // Overwrite the icon used by the app.
  await fs.copyFile(improved, outputIcon);

  // Quick metadata for sanity.
  const meta = await sharp(outputIcon).metadata();
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        output: outputIcon,
        format: meta.format,
        width: meta.width,
        height: meta.height,
        hasAlpha: Boolean(meta.hasAlpha),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

