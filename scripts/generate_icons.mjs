// Generate all icon sizes from the official Teddy Mail logo (PNG source).
// Removes the white background (replaces near-white pixels with alpha=0)
// so the bear head sits on transparency — clean against any taskbar / desktop
// background regardless of theme.

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const iconsDir = path.join(root, 'src-tauri', 'icons');
mkdirSync(iconsDir, { recursive: true });

const sourcePng = path.join(iconsDir, 'source_logo.png');
const sourceSvg = path.join(iconsDir, 'icon.svg');
const source = existsSync(sourcePng) ? sourcePng : sourceSvg;
console.log('Source:', source);

/**
 * Strip near-white pixels (alpha 0) so only the bear silhouette + glasses
 * remain visible. Threshold tuned to keep antialiased edges intact.
 */
async function stripWhiteBackground(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = new Uint8ClampedArray(data);
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i] ?? 0;
    const g = px[i + 1] ?? 0;
    const b = px[i + 2] ?? 0;
    // Treat near-white as transparent. Threshold 240 keeps the cream bear
    // interior (which is darker creamy white) opaque, only outer pure white
    // disappears.
    if (r > 240 && g > 240 && b > 240) {
      px[i + 3] = 0;
    }
  }
  return sharp(px, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

async function squareTransparent(input) {
  const stripped = await stripWhiteBackground(input);
  const buf = await stripped.toBuffer();
  const meta = await sharp(buf).metadata();
  const size = Math.max(meta.width ?? 1024, meta.height ?? 1024);
  return sharp(buf)
    .resize({
      width: size,
      height: size,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

const square = await squareTransparent(source);

// 1024 master
await sharp(square).resize(1024, 1024).png().toFile(path.join(iconsDir, 'icon.png'));
console.log('icon.png 1024x1024 (transparent bg) generated');

for (const { name, size } of [
  { name: '32x32.png', size: 32 },
  { name: '128x128.png', size: 128 },
  { name: '128x128@2x.png', size: 256 },
]) {
  await sharp(square).resize(size, size).png().toFile(path.join(iconsDir, name));
  console.log(`${name} generated`);
}

// Multi-size .ico for crisp Windows display at every zoom.
const { default: pngToIco } = await import('png-to-ico');
const sizes = [16, 32, 48, 64, 128, 256];
const buffers = await Promise.all(
  sizes.map((s) => sharp(square).resize(s, s).png().toBuffer()),
);
const icoBuf = await pngToIco(buffers);
const fs = await import('node:fs/promises');
await fs.writeFile(path.join(iconsDir, 'icon.ico'), icoBuf);
console.log('icon.ico (multi-size, transparent) generated');

console.log('All icons generated with transparent backgrounds.');
