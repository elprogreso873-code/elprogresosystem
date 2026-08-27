/**
 * Genera iconos PWA profesionales para El Progreso (Android, iOS, escritorio).
 * Ejecutar: npm run generate:icons
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const BRAND = { r: 27, g: 67, b: 50 };
const DARK = { r: 31, g: 41, b: 55 };

const crc32 = (data) => {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const createPNG = (size) => {
  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(rowSize * size);
  const pad = Math.round(size * 0.12);
  const box = size - pad * 2;
  const radius = box * 0.22;

  for (let y = 0; y < size; y++) {
    const row = y * rowSize;
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 3;
      const bx = x - pad;
      const by = y - pad;
      const inside =
        bx >= 0 &&
        by >= 0 &&
        bx < box &&
        by < box &&
        bx >= radius &&
        by >= radius &&
        bx <= box - radius &&
        by <= box - radius;

      const corner =
        (bx < radius && by < radius && Math.hypot(bx - radius, by - radius) <= radius) ||
        (bx > box - radius && by < radius && Math.hypot(bx - (box - radius), by - radius) <= radius) ||
        (bx < radius && by > box - radius && Math.hypot(bx - radius, by - (box - radius)) <= radius) ||
        (bx > box - radius &&
          by > box - radius &&
          Math.hypot(bx - (box - radius), by - (box - radius)) <= radius);

      const inBox = inside || corner;

      const stripe =
        inBox &&
        by > box * 0.18 &&
        by < box * 0.34 &&
        bx > box * 0.12 &&
        bx < box * 0.88;

      const body =
        inBox &&
        by >= box * 0.34 &&
        by <= box * 0.86 &&
        bx >= box * 0.14 &&
        bx <= box * 0.86;

      if (inBox && (stripe || body)) {
        raw[i] = BRAND.r;
        raw[i + 1] = BRAND.g;
        raw[i + 2] = BRAND.b;
      } else if (inBox) {
        raw[i] = 245;
        raw[i + 1] = 246;
        raw[i + 2] = 247;
      } else {
        raw[i] = DARK.r;
        raw[i + 1] = DARK.g;
        raw[i + 2] = DARK.b;
      }
    }
  }

  const compressed = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type);
    const crcBuf = Buffer.concat([t, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcBuf), 0);
    return Buffer.concat([len, t, data, crc]);
  };

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const ICON_SIZES = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'apple-touch-icon-167x167.png', size: 167 },
  { file: 'apple-touch-icon-152x152.png', size: 152 },
  { file: 'apple-touch-icon-120x120.png', size: 120 },
];

for (const { file, size } of ICON_SIZES) {
  writeFileSync(join(publicDir, file), createPNG(size));
}

console.log('Iconos PWA generados en public/:');
for (const { file } of ICON_SIZES) {
  console.log(`  - ${file}`);
}
