/**
 * `@nutriboost/db` — kiểu dữ liệu, schema dùng chung và cấu hình kết nối.
 *
 * Gói này KHÔNG phụ thuộc Next.js. Việc tạo client Supabase gắn với cookie phiên
 * nằm ở `apps/web/src/lib/supabase/` vì nó cần API của Next.
 */

export * from './database.types'
export * from './domain'
export * from './env'
