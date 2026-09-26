/**
 * Kết quả trả về của một Server Action.
 *
 * Server Action **không ném lỗi ra giao diện**: một ngoại lệ không bắt được sẽ thành màn
 * hình lỗi của Next.js, không phải một dòng chữ đọc được. Nên mọi action trả về đúng một
 * hình dạng, và nơi gọi chỉ việc hiện `message`.
 */
export interface ActionResult {
  ok: boolean
  /** Câu hiển thị cho người dùng. Tiếng Việt có dấu, nói thẳng chuyện gì đã xảy ra. */
  message: string
  /** Mã mời vừa tạo — chỉ có ở hành động tạo mã. */
  code?: string
}
