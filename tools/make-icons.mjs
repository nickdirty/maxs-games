// Generates icon-192.png, icon-512.png, icon-maskable-512.png with zero deps.
// Pure-JS rasterizer + PNG encoder. Run: `node tools/make-icons.mjs`.
//
// Design: rounded-square soft green background, three colored balls
// (red/yellow/blue) centered. Maskable variant keeps content within
// the central 80% safe zone per the maskable-icon spec.

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ICON_DIR = join(ROOT, 'icons');

// --- tiny rasterizer ----------------------------------------------------
function makeCanvas(size) {
  return { w: size, h: size, px: new Uint8Array(size * size * 4) };
}
function setPx(c, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  // alpha blend over existing
  const dstA = c.px[i + 3] / 255;
  const srcA = a / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;
  c.px[i + 0] = (r * srcA + c.px[i + 0] * dstA * (1 - srcA)) / outA;
  c.px[i + 1] = (g * srcA + c.px[i + 1] * dstA * (1 - srcA)) / outA;
  c.px[i + 2] = (b * srcA + c.px[i + 2] * dstA * (1 - srcA)) / outA;
  c.px[i + 3] = outA * 255;
}
function fillRoundRect(c, x0, y0, x1, y1, r, color) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      // distance to nearest corner if in corner zone
      let dx = 0, dy = 0;
      if (x < x0 + r) dx = x0 + r - x;
      else if (x > x1 - 1 - r) dx = x - (x1 - 1 - r);
      if (y < y0 + r) dy = y0 + r - y;
      else if (y > y1 - 1 - r) dy = y - (y1 - 1 - r);
      const d = Math.sqrt(dx * dx + dy * dy);
      const a = d <= r - 0.5 ? 1 : d >= r + 0.5 ? 0 : (r + 0.5 - d);
      if (a > 0) setPx(c, x, y, [...color, Math.round(a * 255)]);
    }
  }
}
function fillCircle(c, cx, cy, r, color) {
  const x0 = Math.max(0, Math.floor(cx - r - 1));
  const y0 = Math.max(0, Math.floor(cy - r - 1));
  const x1 = Math.min(c.w, Math.ceil(cx + r + 1));
  const y1 = Math.min(c.h, Math.ceil(cy + r + 1));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const d = Math.sqrt((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2);
      const a = d <= r - 0.5 ? 1 : d >= r + 0.5 ? 0 : (r + 0.5 - d);
      if (a > 0) setPx(c, x, y, [...color, Math.round(a * 255)]);
    }
  }
}

// --- PNG encode ---------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(c) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0); ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  // build raw scanlines (filter byte 0 per row)
  const stride = c.w * 4;
  const raw = Buffer.alloc((stride + 1) * c.h);
  for (let y = 0; y < c.h; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(c.px.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// --- design -------------------------------------------------------------
function drawIcon(size, { safeZone = 1.0 } = {}) {
  const c = makeCanvas(size);
  // background: soft mint green, full bleed (good for maskable too)
  fillRoundRect(c, 0, 0, size, size, Math.round(size * 0.18 * safeZone), [120, 200, 140]);
  // For maskable, content within central safeZone% of canvas
  const inset = (1 - safeZone) / 2;
  const cx = size / 2;
  const cy = size * (0.5 + inset * 0.0);
  const ballR = size * 0.14 * safeZone;
  const spread = size * 0.22 * safeZone;
  // three balls: red / yellow / blue
  fillCircle(c, cx - spread, cy + size * 0.05 * safeZone, ballR, [232, 76, 76]);
  fillCircle(c, cx,          cy - size * 0.08 * safeZone, ballR, [240, 200, 60]);
  fillCircle(c, cx + spread, cy + size * 0.05 * safeZone, ballR, [70, 130, 230]);
  // tiny highlights on each ball for depth
  fillCircle(c, cx - spread - ballR * 0.3, cy + size * 0.05 * safeZone - ballR * 0.3, ballR * 0.3, [255, 255, 255, 130]);
  fillCircle(c, cx          - ballR * 0.3, cy - size * 0.08 * safeZone - ballR * 0.3, ballR * 0.3, [255, 255, 255, 130]);
  fillCircle(c, cx + spread - ballR * 0.3, cy + size * 0.05 * safeZone - ballR * 0.3, ballR * 0.3, [255, 255, 255, 130]);
  return c;
}

// Note on highlight alpha: setPx expects [r,g,b,a] in 0..255. The highlight
// passes 4 values; our setPx accepts that. Background+balls pass 3 values
// (alpha=undefined), so we patch setPx to default a=255 there.
// (handled below by wrapping)

// patch: add default alpha
const _set = setPx;
// (already handled — color array can be length 3 or 4; index 3 is undefined ⇒ NaN.
// To be safe, normalize colors here.)
function norm(c) { return c.length === 4 ? c : [c[0], c[1], c[2], 255]; }
// re-bind fillRoundRect / fillCircle to normalize. Easier: redefine.
function fillRR(c, x0, y0, x1, y1, r, color) { fillRoundRect(c, x0, y0, x1, y1, r, norm(color)); }
function fillC(c, cx, cy, r, color) { fillCircle(c, cx, cy, r, norm(color)); }
// Re-implement drawIcon using normalized colors
function drawIconN(size, { safeZone = 1.0 } = {}) {
  const c = makeCanvas(size);
  fillRR(c, 0, 0, size, size, Math.round(size * 0.18), [120, 200, 140]);
  const cx = size / 2, cy = size / 2;
  const ballR = size * 0.14 * safeZone;
  const spread = size * 0.22 * safeZone;
  fillC(c, cx - spread, cy + size * 0.05 * safeZone, ballR, [232, 76, 76]);
  fillC(c, cx,          cy - size * 0.08 * safeZone, ballR, [240, 200, 60]);
  fillC(c, cx + spread, cy + size * 0.05 * safeZone, ballR, [70, 130, 230]);
  fillC(c, cx - spread - ballR * 0.3, cy + size * 0.05 * safeZone - ballR * 0.3, ballR * 0.3, [255, 255, 255, 130]);
  fillC(c, cx          - ballR * 0.3, cy - size * 0.08 * safeZone - ballR * 0.3, ballR * 0.3, [255, 255, 255, 130]);
  fillC(c, cx + spread - ballR * 0.3, cy + size * 0.05 * safeZone - ballR * 0.3, ballR * 0.3, [255, 255, 255, 130]);
  return c;
}

writeFileSync(join(ICON_DIR, 'icon-192.png'),          encodePNG(drawIconN(192,  { safeZone: 1.0 })));
writeFileSync(join(ICON_DIR, 'icon-512.png'),          encodePNG(drawIconN(512,  { safeZone: 1.0 })));
writeFileSync(join(ICON_DIR, 'icon-maskable-512.png'), encodePNG(drawIconN(512,  { safeZone: 0.7 })));
console.log('icons written');
