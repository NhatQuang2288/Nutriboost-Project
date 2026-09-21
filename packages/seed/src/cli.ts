#!/usr/bin/env tsx
/**
 * Công cụ dữ liệu món Việt.
 *
 *   npm run seed                → kiểm tra và in báo cáo
 *   npm run seed -- --emit-sql  → sinh supabase/seed.sql
 *
 * Không kết nối CSDL: việc nạp dữ liệu do `supabase db reset` hoặc script import lo.
 * Nhờ vậy công cụ này chạy được ở CI mà không cần Supabase.
 */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { emitSeedSql } from './emit-sql'
import { datasetStats, validateFullDataset } from './index'

const SEED_PATH = resolve(process.cwd(), 'supabase/seed.sql')

function main(): number {
  const emitSql = process.argv.includes('--emit-sql')
  const { dataset, food, componentIssues } = validateFullDataset()
  const stats = datasetStats()

  console.info('Bộ dữ liệu món Việt')
  console.info('─'.repeat(52))
  console.info(`  Nguyên liệu          ${stats.ingredientCount}`)
  console.info(`  Món ăn               ${stats.dishCount}`)
  console.info(`  Tổng bản ghi         ${stats.totalCount}`)
  console.info(
    `  Thành phần của món   ${dataset.components.reduce((n, d) => n + d.components.length, 0)}`,
  )
  console.info(`  Còn thiếu so với mục tiêu (120 + 180)  ${stats.remainingToTarget}`)
  console.info('')

  if (food.warnings.length > 0) {
    console.info(`Cảnh báo (${food.warnings.length}):`)
    for (const warning of food.warnings) {
      console.info(`  [${warning.slug}] ${warning.field}: ${warning.message}`)
    }
    console.info('')
  }

  const errors = [...food.errors, ...componentIssues]
  if (errors.length > 0) {
    console.error(`LỖI (${errors.length}) — dữ liệu chưa được nạp:`)
    for (const error of errors) {
      console.error(`  [${error.slug}] ${error.field}: ${error.message}`)
    }
    return 1
  }

  console.info('Không có lỗi. Dữ liệu đủ điều kiện nạp.')

  if (emitSql) {
    const sql = emitSeedSql(dataset)
    writeFileSync(SEED_PATH, sql, 'utf8')
    console.info('')
    console.info(`Đã ghi ${SEED_PATH} (${sql.length} ký tự).`)
  } else {
    console.info('')
    console.info('Thêm --emit-sql để sinh supabase/seed.sql.')
  }

  return 0
}

process.exit(main())
