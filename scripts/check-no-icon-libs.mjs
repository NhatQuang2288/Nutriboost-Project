#!/usr/bin/env node
/**
 * Cổng kiểm soát: không package.json nào được khai báo thư viện icon.
 *
 * Quy tắc sản phẩm: toàn bộ icon phải là SVG tự vẽ trong
 * `apps/web/src/components/icons/`. Chạy ở pre-commit và ở CI.
 */

import { readFileSync } from 'node:fs'
import { glob } from 'node:fs/promises'

const FORBIDDEN = [
  'lucide-react',
  'react-icons',
  '@heroicons/react',
  '@radix-ui/react-icons',
  'phosphor-react',
  '@tabler/icons-react',
  'react-feather',
  'feather-icons',
  '@iconify/react',
]

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.npm-cache', 'dist', 'coverage'])

const violations = []

for await (const entry of glob('**/package.json', { withFileTypes: false })) {
  if (entry.split('/').some((segment) => SKIP_DIRS.has(segment))) continue

  let manifest
  try {
    manifest = JSON.parse(readFileSync(entry, 'utf8'))
  } catch {
    continue
  }

  for (const field of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    const block = manifest[field]
    if (block === undefined || block === null) continue
    for (const name of Object.keys(block)) {
      if (FORBIDDEN.includes(name)) {
        violations.push(`${entry} → ${field}.${name}`)
      }
    }
  }
}

if (violations.length > 0) {
  console.error('\nPhát hiện thư viện icon bị cấm:\n')
  for (const line of violations) console.error(`  • ${line}`)
  console.error('\nHãy thêm SVG tự vẽ vào apps/web/src/components/icons/ thay vì dùng thư viện.\n')
  process.exit(1)
}

console.log('Không có thư viện icon nào được khai báo. Tốt.')
