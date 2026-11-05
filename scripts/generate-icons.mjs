/**
 * Generates base64-encoded PNG tray icons from SVG source.
 * Run with: node scripts/generate-icons.mjs
 *
 * Outputs the base64 strings to stdout so they can be pasted into tray.ts.
 * The @2x variant is used by macOS on Retina displays.
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
async function toBase64(svgBuffer, size) {
  const buf = await sharp(svgBuffer, { density: Math.round(size * (96 / 16)) })
    .resize(size, size)
    .png()
    .toBuffer();
  return buf.toString('base64');
}

const defaultSvg = readFileSync(join(__dirname, '../src/assets/tray-icon.svg'));
const alertSvg = readFileSync(
  join(__dirname, '../src/assets/tray-icon-alert.svg'),
);
const alertDarkSvg = readFileSync(
  join(__dirname, '../src/assets/tray-icon-alert-dark.svg'),
);

const [b16, b32, a16, a32, ad16, ad32] = await Promise.all([
  toBase64(defaultSvg, 16),
  toBase64(defaultSvg, 32),
  toBase64(alertSvg, 16),
  toBase64(alertSvg, 32),
  toBase64(alertDarkSvg, 16),
  toBase64(alertDarkSvg, 32),
]);

console.log('// Default icon — paste as TRAY_ICON_1X in tray.ts');
console.log(`'${b16}'`);
console.log('');
console.log('// Default icon @2x — paste as TRAY_ICON_2X in tray.ts');
console.log(`'${b32}'`);
console.log('');
console.log(
  '// Alert icon (light menu bar) — paste as TRAY_ICON_ALERT_1X in tray.ts',
);
console.log(`'${a16}'`);
console.log('');
console.log(
  '// Alert icon (light menu bar) @2x — paste as TRAY_ICON_ALERT_2X in tray.ts',
);
console.log(`'${a32}'`);
console.log('');
console.log(
  '// Alert icon (dark menu bar) — paste as TRAY_ICON_ALERT_DARK_1X in tray.ts',
);
console.log(`'${ad16}'`);
console.log('');
console.log(
  '// Alert icon (dark menu bar) @2x — paste as TRAY_ICON_ALERT_DARK_2X in tray.ts',
);
console.log(`'${ad32}'`);
