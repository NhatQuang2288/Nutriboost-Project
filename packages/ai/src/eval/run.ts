#!/usr/bin/env tsx
/**
 * Chạy bộ đánh giá hiểu bữa ăn.
 *
 *   npm run eval
 *
 * Không gọi model, không tốn tiền, không cần mạng: bộ đánh giá đo **pipeline tất định**
 * — phần chịu trách nhiệm cho phần lớn câu người dùng gõ. Chạy được ở CI.
 *
 * Thoát với mã 1 nếu độ chính xác dưới ngưỡng, để CI chặn được thay đổi làm hỏng việc khớp món.
 */

import { buildDataset } from '@nutriboost/seed'

import { createMealEstimator } from '../meal-estimator'
import {
  EVAL_CASES,
  REQUIRED_NEGATIVE_ACCURACY,
  REQUIRED_TOP1_ACCURACY,
  type EvalCase,
} from './dataset'

interface CaseResult {
  testCase: EvalCase
  actual: string[]
  passed: boolean
}

const estimator = createMealEstimator(buildDataset().all)

function runCase(testCase: EvalCase): CaseResult {
  const estimate = estimator.estimate(testCase.text)
  const actual = estimate.items.map((item) => item.foodId).filter((id): id is string => id !== null)

  // Câu ngoài danh mục: đạt khi KHÔNG khớp được món nào.
  // Câu trong danh mục: đạt khi khớp đúng và đủ, theo đúng thứ tự.
  const passed =
    testCase.expected.length === 0
      ? actual.length === 0
      : actual.length === testCase.expected.length &&
        actual.every((id, index) => id === testCase.expected[index])

  return { testCase, actual, passed }
}

function main(): number {
  const results = EVAL_CASES.map(runCase)

  const positive = results.filter((result) => result.testCase.expected.length > 0)
  const negative = results.filter((result) => result.testCase.expected.length === 0)

  const positivePassed = positive.filter((result) => result.passed).length
  const negativePassed = negative.filter((result) => result.passed).length

  const top1 = positive.length === 0 ? 0 : positivePassed / positive.length
  const specificity = negative.length === 0 ? 0 : negativePassed / negative.length

  console.info('Bộ đánh giá hiểu bữa ăn — pipeline tất định')
  console.info('─'.repeat(64))
  console.info(`  Danh mục           ${estimator.size()} món`)
  console.info(
    `  Ca khớp món        ${positivePassed}/${positive.length}  →  ${(top1 * 100).toFixed(1)} %`,
  )
  console.info(
    `  Ca không được khớp ${negativePassed}/${negative.length}  →  ${(specificity * 100).toFixed(1)} %`,
  )
  console.info('')

  const failures = results.filter((result) => !result.passed)
  if (failures.length > 0) {
    console.info(`Ca không đạt (${failures.length}):`)
    for (const failure of failures) {
      const expected =
        failure.testCase.expected.length === 0
          ? '(không khớp gì)'
          : failure.testCase.expected.join(', ')
      const actual = failure.actual.length === 0 ? '(không khớp gì)' : failure.actual.join(', ')
      console.info(`  ✗ "${failure.testCase.text}"`)
      console.info(`      mong đợi: ${expected}`)
      console.info(`      thực tế:  ${actual}`)
      console.info(`      ghi chú:  ${failure.testCase.note}`)
    }
    console.info('')
  }

  const top1Ok = top1 >= REQUIRED_TOP1_ACCURACY
  const specificityOk = specificity >= REQUIRED_NEGATIVE_ACCURACY

  console.info(
    `Ngưỡng: khớp món ≥ ${(REQUIRED_TOP1_ACCURACY * 100).toFixed(0)} % ` +
      `(${top1Ok ? 'đạt' : 'KHÔNG ĐẠT'}), ` +
      `không khớp bừa ≥ ${(REQUIRED_NEGATIVE_ACCURACY * 100).toFixed(0)} % ` +
      `(${specificityOk ? 'đạt' : 'KHÔNG ĐẠT'})`,
  )

  return top1Ok && specificityOk ? 0 : 1
}

process.exit(main())
