#!/usr/bin/env node
/**
 * Sinh icon PWA từ mã, không dùng thư viện ảnh.
 *
 * Vì sao tự mã hoá PNG: iOS **không** chấp nhận `apple-touch-icon` dạng SVG, nên chỉ có
 * `icon.svg` là không đủ để ứng dụng cài được lên màn hình chính. Thêm một thư viện như
 * `sharp` chỉ để vẽ hai hình tròn là cái giá quá lớn cho một tệp chạy một lần, và nó kéo
 * thêm phụ thuộc nhị phân vào CI.
 *
 * PNG ở đây là ảnh RGBA 8 bit không nén theo dòng (filter 0), nén bằng `zlib.deflateSync`
 * của Node. Đúng chuẩn, mở được bằng mọi trình duyệt và mọi trình xem ảnh.
 *
 *   node scripts/generate-icons.mjs
 *
 * Kết quả được ghi vào `apps/web/public/`. Đổi hình thì sửa hàm `sample()` rồi chạy lại;
 * đừng sửa tay các tệp PNG.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT_DIR = join(ROOT, 'apps', 'web', 'public')

/** Màu lấy từ apps/web/src/app/globals.css — không tự đặt mã màu mới. */
const FOREST_600 = [0x32, 0x4b, 0x2e]
const OLIVE_100 = [0xe4, 0xf0, 0xd1]
const OLIVE_500 = [0x83, 0x9b, 0x4a]

/* ---------------------------------------------------------------------------
 * Mã hoá PNG
 * ------------------------------------------------------------------------- */

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([length, body, crc])
}

function encodePng(width, height, rgba) {
  // Mỗi dòng có một byte filter đứng trước. Filter 0 = không lọc: đơn giản nhất và với
  // ảnh phẳng như icon thì nén vẫn tốt.
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // filter method
  ihdr[12] = 0 // không xen kẽ

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ---------------------------------------------------------------------------
 * Hình
 * ------------------------------------------------------------------------- */

/**
 * Lá — hai cung tròn tạo thành hình con nhộng nhọn hai đầu.
 *
 * Công thức: trong hệ trục của lá (a dọc theo sống lá, b ngang), điểm nằm trong lá khi
 * `(|a|/A)^p + (|b|/B)^p ≤ 1`. Với `p < 2` hai đầu nhọn lại, và đó chính là dáng lá.
 * `p = 2` sẽ cho hình ellipse — trông như quả trứng, không ra lá.
 */
function leafCoverage(u, v, scale) {
  // Xoay 45° để lá chéo góc, và đặt tâm hơi lệch lên trên cho cân với sống lá.
  const angle = -Math.PI / 4
  const dx = u - 0.5
  const dy = v - 0.52
  const a = (dx * Math.cos(angle) - dy * Math.sin(angle)) / (0.3 * scale)
  const b = (dx * Math.sin(angle) + dy * Math.cos(angle)) / (0.17 * scale)

  return Math.abs(a) ** 1.7 + Math.abs(b) ** 1.7 <= 1
}

/** Sống lá: một dải mảnh dọc theo trục lá. */
function veinCoverage(u, v, scale) {
  const angle = -Math.PI / 4
  const dx = u - 0.5
  const dy = v - 0.52
  const a = (dx * Math.cos(angle) - dy * Math.sin(angle)) / (0.3 * scale)
  const b = (dx * Math.sin(angle) + dy * Math.cos(angle)) / (0.17 * scale)
  return Math.abs(a) <= 0.86 && Math.abs(b) <= 0.055
}

/** Hệ số bo góc: bán kính lớn nhất mà vẫn nằm trong khung. */
function insideRoundedSquare(u, v, radius) {
  const x = Math.min(u, 1 - u)
  const y = Math.min(v, 1 - v)
  if (x >= radius || y >= radius) return true
  return (radius - x) ** 2 + (radius - y) ** 2 <= radius ** 2
}

/**
 * Lấy màu tại một điểm, toạ độ chuẩn hoá 0..1.
 *
 * `maskable` bật chế độ nền tràn viền: Android cắt icon thành hình tròn hoặc squircle, nên
 * hình phải nằm gọn trong 80% ở giữa. Nền tràn viền để phần bị cắt vẫn là màu thương hiệu.
 */
function sample(u, v, options) {
  const { maskable } = options
  const scale = maskable ? 0.78 : 1

  if (!maskable && !insideRoundedSquare(u, v, 0.22)) return null

  if (leafCoverage(u, v, scale)) {
    return veinCoverage(u, v, scale) ? OLIVE_500 : OLIVE_100
  }
  return FOREST_600
}

/**
 * Vẽ với khử răng cưa 3×3.
 *
 * Không khử răng cưa thì đường chéo của lá bị bậc thang, và icon 192 px nhìn rõ lắm.
 */
function render(size, options) {
  const rgba = Buffer.alloc(size * size * 4)
  const sub = 3
  const total = sub * sub

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0
      let g = 0
      let b = 0
      let covered = 0

      for (let sy = 0; sy < sub; sy += 1) {
        for (let sx = 0; sx < sub; sx += 1) {
          const u = (x + (sx + 0.5) / sub) / size
          const v = (y + (sy + 0.5) / sub) / size
          const colour = sample(u, v, options)
          if (colour === null) continue
          r += colour[0]
          g += colour[1]
          b += colour[2]
          covered += 1
        }
      }

      const offset = (y * size + x) * 4
      if (covered === 0) continue

      // Màu trung bình của phần được phủ, alpha theo tỉ lệ phủ — đó là khử răng cưa.
      rgba[offset] = Math.round(r / covered)
      rgba[offset + 1] = Math.round(g / covered)
      rgba[offset + 2] = Math.round(b / covered)
      rgba[offset + 3] = Math.round((covered / total) * 255)
    }
  }

  return encodePng(size, size, rgba)
}

/* ---------------------------------------------------------------------------
 * Kết quả
 * ------------------------------------------------------------------------- */

const TARGETS = [
  // `any`: hiện trong danh sách ứng dụng, bo góc sẵn nên nền trong suốt ở bốn góc.
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  /*
   * `maskable`: nền tràn viền, hình nằm trong vùng an toàn để Android cắt tròn không mất
   * hình. Chế độ này phủ kín mọi điểm ảnh nên **không có** kênh alpha trong suốt — cũng vì
   * vậy nó dùng luôn được cho iOS, thứ ghét nền trong suốt ở `apple-touch-icon` (chỗ trong
   * suốt sẽ thành màu đen).
   */
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
]

function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  for (const target of TARGETS) {
    const png = render(target.size, { maskable: target.maskable === true })
    writeFileSync(join(OUT_DIR, target.file), png)
    console.info(`  ${target.file}  ${target.size}×${target.size}  ${png.length} byte`)
  }

  console.info(`\nĐã ghi ${TARGETS.length} tệp vào apps/web/public/`)
}

main()
