/**
 * Chuẩn hoá tiếng Việt cho việc tìm và khớp tên món ăn.
 *
 * Mục tiêu: "Phở Bò Tái", "pho bo tai", "phở bò tái" và "pho bo" phải cho ra cùng
 * một khoá tìm kiếm. Nhờ vậy phần lớn câu người dùng gõ khớp được **tất định**,
 * không cần gọi AI — vừa rẻ vừa chính xác hơn.
 *
 * Hàm ở đây là thuần và không phụ thuộc dữ liệu. Các biến thể riêng của từng món
 * (ví dụ "hủ tiếu nam vang" ↔ "hu tieu") thuộc bảng `food_aliases` trong CSDL,
 * không nhồi vào đây.
 */

/**
 * Viết tắt và teencode phổ biến, ánh xạ theo **từ nguyên vẹn** (không thay thế
 * trong lòng từ) để tránh phá tên món.
 */
const TEENCODE_TOKENS: Readonly<Record<string, string>> = {
  k: 'khong',
  ko: 'khong',
  hok: 'khong',
  hong: 'khong',
  hem: 'khong',
  kg: 'khong',
  dc: 'duoc',
  dk: 'duoc',
  dkc: 'duoc',
  j: 'gi',
  z: 'gi',
  mk: 'minh',
  mik: 'minh',
  mink: 'minh',
  cx: 'cung',
  cug: 'cung',
  vs: 'voi',
  zoi: 'voi',
  cf: 'ca phe',
  nc: 'nuoc',
}

/** Từ chỉ số lượng, dùng để tách phần tên món khỏi phần khẩu phần. */
const QUANTITY_WORDS = new Set([
  'mot',
  'hai',
  'ba',
  'bon',
  'tu',
  'nam',
  'sau',
  'bay',
  'tam',
  'chin',
  'muoi',
  'nua',
  'vai',
  'may',
  'chut',
  'it',
  'nhieu',
  'khoang',
  'tam',
])

/** Đơn vị và loại từ chỉ đơn vị — bỏ đi khi tìm tên món. */
const UNIT_WORDS = new Set([
  'g',
  'gram',
  'gr',
  'gam',
  'kg',
  'kilogram',
  'ml',
  'l',
  'lit',
  'ly',
  'coc',
  'chen',
  'bat',
  'to',
  'dia',
  'mieng',
  'cai',
  'chiec',
  'qua',
  'cu',
  'trai',
  'goi',
  'hop',
  'muong',
  'thia',
  'lat',
  'phan',
  'suat',
  'ong',
  'cum',
])

/**
 * Bỏ dấu tiếng Việt và đưa `đ` về `d`.
 *
 * `đ` không phân rã được bằng NFD nên phải thay tường minh.
 */
export function stripDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/**
 * Khoá tìm kiếm chuẩn: không dấu, chữ thường, không dấu câu, teencode đã mở rộng.
 * Giữ `/` để xử lý khẩu phần dạng "1/2".
 */
export function normalizeVi(input: string): string {
  const withoutDiacritics = stripDiacritics(input).toLowerCase()
  const cleaned = withoutDiacritics.replace(/[^a-z0-9/\s]/g, ' ')
  const tokens = cleaned.split(/\s+/).filter((token) => token.length > 0)
  const expanded = tokens.flatMap((token) => {
    const replacement = TEENCODE_TOKENS[token]
    return replacement === undefined ? [token] : replacement.split(' ')
  })
  return expanded.join(' ').replace(/\s+/g, ' ').trim()
}

/** Tách thành mảng token đã chuẩn hoá. */
export function tokenizeVi(input: string): string[] {
  const normalized = normalizeVi(input)
  return normalized.length === 0 ? [] : normalized.split(' ')
}

/**
 * Token còn lại sau khi bỏ số lượng và đơn vị — dùng làm khoá khớp tên món.
 *
 * Ví dụ: `"2 bát phở bò"` → `["pho", "bo"]`.
 *
 * Một từ chỉ số lượng **chỉ** bị bỏ khi nó đứng ngay trước một đơn vị
 * (`"hai bát"`, `"nửa tô"`). Nếu bỏ vô điều kiện thì tên món sẽ bị phá:
 * `"tấm"` trong "cơm tấm" trùng với `"tám"`, `"nấm"` trùng với `"năm"`,
 * `"ba"` trong "thịt ba chỉ" trùng với số ba. Đây là lỗi có thật, bắt được
 * bằng test đầu-cuối: "trưa nay mình ăn cơm tấm sườn" từng không khớp món nào.
 *
 * Nếu bỏ hết mà không còn gì (ví dụ người dùng chỉ gõ `"2 bát"`), trả lại
 * token đầy đủ để tránh khoá rỗng.
 */
export function foodNameTokens(input: string): string[] {
  const tokens = tokenizeVi(input)
  const dropped = new Set<number>()

  const isUnit = (token: string | undefined): boolean =>
    token !== undefined && UNIT_WORDS.has(token)

  const isQuantityWord = (token: string | undefined): boolean =>
    token !== undefined && QUANTITY_WORDS.has(token)

  // 1. Chữ số và phân số luôn là số lượng, không thể là tên món.
  tokens.forEach((token, index) => {
    if (isQuantityToken(token)) dropped.add(index)
  })

  // 2. Số từ chỉ là số lượng khi đi liền trước một đơn vị, hoặc liền trước
  //    một số từ khác ("một nửa bát").
  tokens.forEach((token, index) => {
    if (!QUANTITY_WORDS.has(token)) return
    const next = tokens[index + 1]
    if (isUnit(next) || isQuantityWord(next)) dropped.add(index)
  })

  // 3. Đơn vị chỉ bị bỏ khi đi liền SAU một số lượng ("2 bát", "một gói", "nửa tô").
  //
  //    Bỏ vô điều kiện sẽ phá tên món có từ trùng với đơn vị: "gỏi" trong "gỏi cuốn"
  //    bị coi là "gói". Cùng họ lỗi với "tấm" bị coi là "tám" — lỗi có thật, đo được
  //    bằng `npm run eval`.
  tokens.forEach((token, index) => {
    if (!UNIT_WORDS.has(token)) return
    const previous = tokens[index - 1]
    if (previous !== undefined && (isQuantityToken(previous) || QUANTITY_WORDS.has(previous))) {
      dropped.add(index)
    }
  })

  const kept = tokens.filter((_, index) => !dropped.has(index))
  return kept.length > 0 ? kept : tokens
}

/** Số nguyên ("2") hoặc phân số ("1/2", "3/4"). */
function isQuantityToken(token: string): boolean {
  return /^\d+(\/\d+)?$/.test(token)
}

/**
 * Có phải từ chỉ đơn vị hoặc loại từ không.
 *
 * Xuất ra để tầng trên dùng cùng một danh sách: một số từ chỉ là số lượng khi nó
 * đi liền trước một đơn vị, và quy tắc đó phải giống nhau ở mọi nơi.
 */
export function isUnitWord(token: string): boolean {
  return UNIT_WORDS.has(token)
}

/** Khoá khớp tên món: các token còn lại nối bằng khoảng trắng. */
export function foodNameKey(input: string): string {
  return foodNameTokens(input).join(' ')
}
