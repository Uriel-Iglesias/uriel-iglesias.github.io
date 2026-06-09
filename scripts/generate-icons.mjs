// Genera los iconos PNG de la PWA sin dependencias (PNG con zlib nativo).
// Diseño: moneda verde con un símbolo "€" sobre fondo oscuro de la app.
//   node scripts/generate-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')
mkdirSync(PUBLIC, { recursive: true })

// ── CRC32 (para los chunks PNG) ──────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // 10-12 = 0 (compression, filter, interlace)
  // Scanlines con filtro 0
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ── Dibujo (con supersampling para antialiasing) ─────────────────────────────
const DARK = [28, 28, 30] // #1c1c1e
const GREEN = [52, 199, 89] // #34c759

function renderIcon(size) {
  const ss = 4 // supersampling
  const N = size * ss
  const big = Buffer.alloc(N * N * 4)

  const c = N / 2
  const coinR = N * 0.31
  const ringIn = N * 0.13
  const ringOut = N * 0.205
  const openHalf = (38 * Math.PI) / 180 // apertura de la "C" a la derecha
  const barH = N * 0.024
  const barX0 = c - N * 0.215
  const barX1 = c + N * 0.02
  const barYs = [c - N * 0.05, c + N * 0.05]

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = x - c
      const dy = y - c
      const dist = Math.hypot(dx, dy)

      let col = DARK // fondo
      if (dist <= coinR) {
        col = GREEN // moneda
        // Símbolo € en oscuro
        const inRing = dist >= ringIn && dist <= ringOut
        const ang = Math.atan2(dy, dx) // -PI..PI, 0 = derecha
        const inOpening = Math.abs(ang) < openHalf
        const onArc = inRing && !inOpening
        let onBar = false
        for (const by of barYs) {
          if (x >= barX0 && x <= barX1 && Math.abs(y - by) <= barH) onBar = true
        }
        if (onArc || onBar) col = DARK
      }

      const i = (y * N + x) * 4
      big[i] = col[0]
      big[i + 1] = col[1]
      big[i + 2] = col[2]
      big[i + 3] = 255
    }
  }

  // Downsample box ss×ss → tamaño final
  const out = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const i = ((y * ss + sy) * N + (x * ss + sx)) * 4
          r += big[i]
          g += big[i + 1]
          b += big[i + 2]
        }
      }
      const n = ss * ss
      const o = (y * size + x) * 4
      out[o] = Math.round(r / n)
      out[o + 1] = Math.round(g / n)
      out[o + 2] = Math.round(b / n)
      out[o + 3] = 255
    }
  }
  return encodePNG(size, size, out)
}

for (const size of [180, 192, 512]) {
  const png = renderIcon(size)
  writeFileSync(join(PUBLIC, `icon-${size}.png`), png)
  console.log(`✓ icon-${size}.png (${png.length} bytes)`)
}

// favicon SVG (vectorial, ligero)
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#1c1c1e"/>
  <circle cx="32" cy="32" r="20" fill="#34c759"/>
  <text x="32" y="42" font-size="26" font-family="-apple-system,Helvetica,Arial" font-weight="700" fill="#1c1c1e" text-anchor="middle">€</text>
</svg>
`
writeFileSync(join(PUBLIC, 'favicon.svg'), favicon)
console.log('✓ favicon.svg')
