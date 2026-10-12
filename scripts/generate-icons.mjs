import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "docs", "icons");
mkdirSync(OUT_DIR, { recursive: true });

const BG = [0x00, 0x00, 0x00]; // --bg
const NOTE = [0xff, 0x3f, 0x00]; // --accent

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Draws a simple filled music-note glyph (circle head + stem + flag) on an RGB canvas.
function drawNote(size, px) {
  const cx = size * 0.4;
  const cy = size * 0.68;
  const r = size * 0.16;
  const stemX = cx + r * 0.95;
  const stemTop = size * 0.16;
  const stemBottom = cy;
  const stemW = size * 0.055;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let isNote = false;
      const dx = x - cx, dy = y - cy;
      if ((dx * dx) / (r * r) + (dy * dy) / ((r * 0.82) * (r * 0.82)) <= 1) isNote = true;
      if (x >= stemX - stemW / 2 && x <= stemX + stemW / 2 && y >= stemTop && y <= stemBottom) isNote = true;
      // flag
      const fx = x - stemX, fy = y - stemTop;
      if (fy >= 0 && fy <= size * 0.28 && fx >= 0 && fx <= size * 0.26) {
        const t = fy / (size * 0.28);
        const width = size * 0.26 * Math.sin(t * Math.PI);
        if (fx <= width) isNote = true;
      }
      const o = (y * size + x) * 3;
      const color = isNote ? NOTE : BG;
      px[o] = color[0]; px[o + 1] = color[1]; px[o + 2] = color[2];
    }
  }
}

function makePng(size) {
  const px = Buffer.alloc(size * size * 3);
  drawNote(size, px);

  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filter: none
    px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const idat = deflateSync(raw);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [180, 192, 512]) {
  const buf = makePng(size);
  const file = path.join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, buf);
  console.log(`Wrote ${file} (${buf.length} bytes)`);
}
