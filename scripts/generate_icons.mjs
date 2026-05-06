// Generate all icon sizes from the official Teddy Mail logo (PNG source).
// Pads to square if needed, then resamples to each Tauri-required size.
// Also packs the multi-size .ico for Windows.

import sharp from 'sharp';
import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const iconsDir = path.join(root, 'src-tauri', 'icons');
mkdirSync(iconsDir, { recursive: true });

// Source: prefer the official PNG mascot. Fallback to SVG if missing.
const sourcePng = path.join(iconsDir, 'source_logo.png');
const sourceIco = path.join(iconsDir, 'source_logo.ico');
const sourceSvg = path.join(iconsDir, 'icon.svg');
const source = existsSync(sourcePng) ? sourcePng : sourceSvg;
console.log('Source:', source);

// Pad to square (transparent background) so resamples don't distort.
async function squareBuffer(input) {
  const meta = await sharp(input).metadata();
  const size = Math.max(meta.width, meta.height);
  return sharp(input)
    .resize({
      width: size,
      height: size,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
}

const square = await squareBuffer(source);

// 1024 master
await sharp(square).resize(1024, 1024).png().toFile(path.join(iconsDir, 'icon.png'));
console.log('icon.png 1024x1024 generated');

// Tauri-required intermediate sizes
for (const { name, size } of [
  { name: '32x32.png', size: 32 },
  { name: '128x128.png', size: 128 },
  { name: '128x128@2x.png', size: 256 },
]) {
  await sharp(square).resize(size, size).png().toFile(path.join(iconsDir, name));
  console.log(`${name} generated`);
}

// Windows ICO with multiple sizes packed
const { default: pngToIco } = await import('png-to-ico');
const sizes = [16, 32, 48, 64, 128, 256];
const buffers = await Promise.all(
  sizes.map((s) => sharp(square).resize(s, s).png().toBuffer()),
);
const icoBuf = await pngToIco(buffers);
const fs = await import('node:fs/promises');
await fs.writeFile(path.join(iconsDir, 'icon.ico'), icoBuf);
console.log('icon.ico generated (multi-size)');

// Also keep the original .ico if provided (some pipelines prefer it)
if (existsSync(sourceIco)) {
  copyFileSync(sourceIco, path.join(iconsDir, 'icon-source.ico'));
}

console.log('All icons generated.');
