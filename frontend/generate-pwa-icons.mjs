// Generates PWA PNG icons from scratch (no external deps, pure Node.js built-ins)
import { deflateSync } from 'zlib'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

function uint32BE(n) {
  const b = Buffer.allocUnsafe(4)
  b.writeUInt32BE(n, 0)
  return b
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0)
  }
  return (~c) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const body = Buffer.concat([t, data])
  return Buffer.concat([uint32BE(data.length), t, data, uint32BE(crc32(body))])
}

function setPixel(buf, size, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= size || y < 0 || y >= size) return
  const i = (y * size + x) * 4
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a
}

function fillCircle(buf, size, cx, cy, radius, r, g, b) {
  const x0 = Math.max(0, Math.floor(cx - radius))
  const x1 = Math.min(size - 1, Math.ceil(cx + radius))
  const y0 = Math.max(0, Math.floor(cy - radius))
  const y1 = Math.min(size - 1, Math.ceil(cy + radius))
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2)
        setPixel(buf, size, x, y, r, g, b)
}

function drawLine(buf, size, x0, y0, x1, y1, thickness, r, g, b) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) * 3
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = x0 + (x1 - x0) * t
    const y = y0 + (y1 - y0) * t
    fillCircle(buf, size, x, y, thickness, r, g, b)
  }
}

function createIcon(size) {
  const pixels = Buffer.alloc(size * size * 4)

  // Background #0f172a
  for (let i = 0; i < size * size; i++) {
    pixels[i * 4] = 15; pixels[i * 4 + 1] = 23
    pixels[i * 4 + 2] = 42; pixels[i * 4 + 3] = 255
  }

  const s = size
  const cx = s * 0.5
  const cy = s * 0.42
  const r = s * 0.13
  const bond = s * 0.015

  // Satellite positions (angles in degrees)
  const satellites = [
    { angle: 210, dist: r * 2.2 },
    { angle: 330, dist: r * 2.2 },
    { angle: 270, dist: r * 2.8 },
  ]

  // Draw bonds first (so atoms render on top)
  for (const { angle, dist } of satellites) {
    const rad = (angle * Math.PI) / 180
    const nx = cx + Math.cos(rad) * dist
    const ny = cy + Math.sin(rad) * dist
    drawLine(pixels, s, cx, cy, nx, ny, bond, 99, 102, 241)
  }

  // Main atom #6366f1
  fillCircle(pixels, s, cx, cy, r * 1.1, 99, 102, 241)

  // Satellite atoms #818cf8
  for (const { angle, dist } of satellites) {
    const rad = (angle * Math.PI) / 180
    fillCircle(pixels, s, cx + Math.cos(rad) * dist, cy + Math.sin(rad) * dist, r * 0.8, 129, 140, 248)
  }

  // Build IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(s, 0); ihdr.writeUInt32BE(s, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8-bit RGBA

  // Build IDAT rows (filter byte 0 + row data)
  const rows = Buffer.alloc(s * (1 + s * 4))
  for (let y = 0; y < s; y++) {
    rows[y * (1 + s * 4)] = 0
    pixels.copy(rows, y * (1 + s * 4) + 1, y * s * 4, (y + 1) * s * 4)
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const icons = [
  { file: 'pwa-64x64.png', size: 64 },
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'maskable-icon-512x512.png', size: 512 },
  { file: 'apple-touch-icon-180x180.png', size: 180 },
]

for (const { file, size } of icons) {
  writeFileSync(resolve(__dir, 'public', file), createIcon(size))
  console.log(`✓ ${file}`)
}

// favicon.ico: wrap the 64×64 PNG (modern browsers accept PNG inside .ico)
const ico64 = createIcon(32)
writeFileSync(resolve(__dir, 'public', 'favicon.ico'), ico64)
console.log('✓ favicon.ico')
console.log('Done.')
