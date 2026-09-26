/**
 * Chặn lỗi model xảy ra TRƯỚC khi nó kịp trả về chữ nào.
 *
 * Vì sao cần: `buildChatStreamResponse` **không ném lỗi** khi DeepSeek từ chối. AI SDK biến
 * lỗi HTTP thành một phần `error` nằm trong chính stream — stream chỉ có đúng `start` rồi
 * `error`, và hàm kết thúc bình thường. Đã kiểm chứng bằng một khoá sai: request đi tới
 * `https://api.deepseek.com/chat/completions`, DeepSeek trả 401, và không có ngoại lệ nào
 * ném ra.
 *
 * Nghĩa là `try/catch` quanh lời gọi đó **không bao giờ chạy**. Hậu quả: khoá sai, khoá hết
 * hạn, hoặc tài khoản DeepSeek chưa nạp tiền thì mọi lượt chat đều hỏng — người dùng thấy
 * "Bơ đang gặp sự cố kết nối" và mất luôn thẻ ghi bữa ăn, dù bộ ước lượng tất định chạy tốt
 * mà không cần mạng. Comment trong route nói rõ ý định ngược lại ("Rơi về đường giả vì ứng
 * dụng phải luôn dùng được"), và trước đây ý định đó bị vô hiệu.
 *
 * Cách làm: đọc phần ĐẦU của stream cho tới khi biết chắc phần tử thứ hai là gì, rồi mới quyết
 * định. Lỗi xác thực, lỗi hết tiền và lỗi sai tên model đều xảy ra trước khi model sinh chữ
 * nào, nên quyết định luôn có ngay; đổi lại chỉ chậm đúng một phần tử so với trước.
 *
 * Lỗi giữa dòng (mạng đứt sau khi đã có chữ) KHÔNG bị coi là lỗi sớm: lúc đó đã có nội dung
 * hiển thị cho người dùng và không thể thay bằng câu trả lời khác.
 */

/** Tiền tố của một dòng SSE mang phần tử của giao thức UI message stream. */
const SSE_DATA_PREFIX = 'data:'

/** Tên các phần tử đánh dấu model đã thật sự bắt đầu trả nội dung. */
const ERROR_PART = 'error'
const START_PART = 'start'

export type StreamHead =
  { failedEarly: true } | { failedEarly: false; body: ReadableStream<Uint8Array> }

/**
 * Đọc các `type` của những phần tử SSE đã đọc trọn vẹn trong `text`.
 *
 * Dòng bị cắt ngang giữa hai lần đọc sẽ không phân tích được thành JSON — bỏ qua nó thay vì
 * đoán, vì đoán sai ở đây dẫn tới kết luận sai về việc model có hỏng hay không.
 */
function partTypes(text: string): string[] {
  const types: string[] = []

  for (const line of text.split('\n')) {
    if (!line.startsWith(SSE_DATA_PREFIX)) continue

    const raw = line.slice(SSE_DATA_PREFIX.length).trim()
    if (raw.length === 0 || raw === '[DONE]') continue

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      continue
    }

    if (parsed !== null && typeof parsed === 'object' && 'type' in parsed) {
      const type: unknown = (parsed as { type: unknown }).type
      types.push(typeof type === 'string' ? type : '?')
    }
  }

  return types
}

/**
 * Soi phần đầu của stream để biết model có hỏng ngay từ đầu không.
 *
 * Trả về `body` nguyên vẹn (byte đầu tiên đã đọc được ghép lại trước phần còn lại) khi model
 * trả lời bình thường, để tầng gọi cứ thế chuyển tiếp cho trình duyệt.
 *
 * Không trả về lý do lỗi: phần tử `error` trong giao thức UI chỉ mang câu chung chung
 * ("An error occurred.") vì AI SDK lược chi tiết trước khi nó tới trình duyệt. Lý do thật lấy
 * từ `onError` của `streamText` — xem `ChatStreamOptions.onError`.
 *
 * Ném ra nếu chính việc đọc hỏng — ví dụ mất mạng trước khi nhận được byte nào. Tầng gọi bắt
 * lấy và rơi về đường tất định.
 */
export async function inspectStreamHead(source: ReadableStream<Uint8Array>): Promise<StreamHead> {
  const reader = source.getReader()
  const decoder = new TextDecoder()
  let head = ''

  // Đọc cho tới khi biết chắc phần tử thứ hai. `start` luôn đứng đầu, nên hai phần tử là đủ.
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    head += decoder.decode(value, { stream: true })
    if (partTypes(head).length >= 2) break
  }

  const types = partTypes(head)
  const failedEarly =
    types[0] === ERROR_PART || (types[0] === START_PART && types[1] === ERROR_PART)

  if (failedEarly) {
    await reader.cancel().catch(() => undefined)
    return { failedEarly: true }
  }

  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      if (head.length > 0) controller.enqueue(encoder.encode(head))

      try {
        for (;;) {
          const next = await reader.read()
          if (next.done) break
          if (next.value !== undefined) controller.enqueue(next.value)
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
    cancel(reason) {
      return reader.cancel(reason)
    },
  })

  return { failedEarly: false, body }
}
