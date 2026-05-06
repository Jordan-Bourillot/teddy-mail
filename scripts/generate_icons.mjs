// Generate the source 1024x1024 PNG from the SVG. Tauri CLI then derives the
// per-platform icons (.ico, .icns, multiple .png sizes) from this source.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcSvg = path.join(root, 'src-tauri', 'icons', 'icon.svg');
const outDir = path.join(root, 'src-tauri', 'icons');
mkdirSync(outDir, { recursive: true });

const out1024 = path.join(outDir, 'icon.png');
await sharp(srcSvg).resize(1024, 1024).png().toFile(out1024);
console.log('icon.png 1024x1024 generated:', out1024);

// Tauri CLI also expects these explicitly named files for the bundle pipeline.
// Rather than depending on `cargo tauri icon` (which needs the dev profile), we
// generate the standard set up-front so build works out of the box.
const sizes = [
  { name: '32x32.png', size: 32 },
  { name: '128x128.png', size: 128 },
  { name: '128x128@2x.png', size: 256 },
];
for (const s of sizes) {
  const outFile = path.join(outDir, s.name);
  await sharp(srcSvg).resize(s.size, s.size).png().toFile(outFile);
  console.log(`${s.name} generated`);
}

// Windows ICO: pack multiple sizes. Sharp doesn't write ICO directly, but we
// can produce a 256x256 PNG and let png-to-ico do the conversion.
const icoSrc = await sharp(srcSvg).resize(256, 256).png().toBuffer();
const { default: pngToIco } = await import('png-to-ico');
const icoBuf = await pngToIco([icoSrc]);
const icoPath = path.join(outDir, 'icon.ico');
const fs = await import('node:fs/promises');
await fs.writeFile(icoPath, icoBuf);
console.log('icon.ico generated');

console.log('All icons generated.');
