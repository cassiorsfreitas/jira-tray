/**
 * Generates the macOS app icon (src/assets/app-icon.icns) from src/assets/app-icon.svg.
 * Run with: npm run generate-app-icon
 *
 * macOS only: the .icns is assembled by `iconutil`. The generated file is
 * committed, so packaging the app does not need this script.
 */
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'darwin') {
  throw new Error('generate-app-icon needs macOS: it uses iconutil.');
}

const assets = join(dirname(fileURLToPath(import.meta.url)), '../src/assets');
const svg = readFileSync(join(assets, 'app-icon.svg'));

// The names and pixel sizes an .iconset must contain.
const ICONSET = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024],
];

const iconset = join(
  mkdtempSync(join(tmpdir(), 'app-icon-')),
  'app-icon.iconset',
);
mkdirSync(iconset);
try {
  for (const [name, size] of ICONSET) {
    // Rasterise at the target size, so thin shapes stay sharp in the small ones.
    await sharp(svg, { density: (72 * size) / 1024 })
      .resize(size, size)
      .png()
      .toFile(join(iconset, name));
  }
  execFileSync('iconutil', [
    '-c',
    'icns',
    iconset,
    '-o',
    join(assets, 'app-icon.icns'),
  ]);
  console.log('Wrote src/assets/app-icon.icns');
} finally {
  rmSync(dirname(iconset), { recursive: true, force: true });
}
