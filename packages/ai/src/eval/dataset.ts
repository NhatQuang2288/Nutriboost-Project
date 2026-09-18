/**
 * Bộ đánh giá hiểu bữa ăn.
 *
 * Mục đích: đo **độ chính xác khớp món** của pipeline tất định trên những câu mà người
 * Việt thật sự gõ — có dấu, không dấu, viết tắt, có ngữ cảnh, có số lượng.
 *
 * Bộ này cố tình giữ nguyên các câu khó. Một bộ dữ liệu chỉ toàn câu dễ sẽ cho con số
 * đẹp nhưng vô dụng. Khi thêm câu mới, thêm cả câu khó.
 *
 * Chạy: `npm run eval`
 */

export interface EvalCase {
  /** Câu người dùng gõ. */
  text: string
  /**
   * Slug của các món phải khớp, theo thứ tự.
   * Mảng rỗng nghĩa là **không** món nào được khớp (câu ngoài danh mục).
   */
  expected: readonly string[]
  /** Ghi chú vì sao câu này có trong bộ. */
  note: string
}

export const EVAL_CASES: readonly EvalCase[] = [
  // --- Có dấu, câu đầy đủ ---
  { text: 'sáng nay mình ăn phở bò', expected: ['pho-bo'], note: 'câu đầy đủ có ngữ cảnh' },
  { text: 'trưa nay tôi ăn cơm tấm sườn', expected: ['com-tam-suon'], note: 'tên món trùng số từ' },
  { text: 'tối qua mình ăn bún bò huế', expected: ['bun-bo-hue'], note: 'ba từ, có dấu' },
  { text: 'mình vừa ăn phở gà', expected: ['pho-ga'], note: 'phân biệt phở bò và phở gà' },
  { text: 'hôm nay mình ăn cơm gà', expected: ['com-ga'], note: 'hai từ ngắn' },
  { text: 'sáng mình ăn bánh mì thịt', expected: ['banh-mi-thit'], note: 'món khô phổ biến' },
  { text: 'mình ăn gỏi cuốn', expected: ['goi-cuon'], note: 'món cuốn' },
  { text: 'mình uống cà phê sữa đá', expected: ['ca-phe-sua-da'], note: 'đồ uống' },
  { text: 'mình ăn sữa chua chuối', expected: ['sua-chua-chuoi'], note: 'bữa phụ' },
  { text: 'mình ăn canh rau muống', expected: ['canh-rau-muong'], note: 'món canh' },
  { text: 'mình ăn rau muống xào tỏi', expected: ['rau-muong-xao-toi'], note: 'món xào' },
  { text: 'mình ăn đậu hũ chiên', expected: ['dau-hu-chien'], note: 'món chay' },
  { text: 'mình ăn trứng chiên', expected: ['trung-chien'], note: 'món chiên' },
  { text: 'mình ăn cá thu chiên', expected: ['ca-thu-chien'], note: 'món chiên' },
  { text: 'mình ăn khoai tây chiên', expected: ['khoai-tay-chien'], note: 'món chiên' },
  {
    text: 'mình ăn khoai lang luộc',
    expected: ['khoai-lang-luoc'],
    note: 'món luộc một thành phần',
  },
  { text: 'mình uống sinh tố chuối sữa', expected: ['sinh-to-chuoi-sua'], note: 'đồ uống' },
  { text: 'mình ăn cơm trứng', expected: ['com-trung'], note: 'hai từ ngắn' },

  // --- Không dấu ---
  { text: 'sang nay minh an pho bo', expected: ['pho-bo'], note: 'gõ không dấu' },
  { text: 'minh an com tam suon', expected: ['com-tam-suon'], note: 'không dấu, tên trùng số từ' },
  { text: 'toi an bun bo hue', expected: ['bun-bo-hue'], note: 'không dấu' },
  { text: 'minh an banh mi thit', expected: ['banh-mi-thit'], note: 'không dấu' },
  { text: 'minh uong ca phe sua da', expected: ['ca-phe-sua-da'], note: 'không dấu' },
  { text: 'minh an goi cuon', expected: ['goi-cuon'], note: 'không dấu' },
  { text: 'minh an dau hu chien', expected: ['dau-hu-chien'], note: 'không dấu' },
  { text: 'minh an khoai tay chien', expected: ['khoai-tay-chien'], note: 'không dấu' },

  // --- Số lượng ---
  { text: 'mình ăn hai tô phở bò', expected: ['pho-bo'], note: 'số viết bằng chữ' },
  { text: 'mình ăn 2 bát cơm tấm sườn', expected: ['com-tam-suon'], note: 'chữ số' },
  { text: 'mình ăn nửa tô phở bò', expected: ['pho-bo'], note: 'nửa khẩu phần' },
  { text: 'mình ăn 1/2 bát cơm tấm sườn', expected: ['com-tam-suon'], note: 'phân số' },
  { text: 'mình uống ba ly cà phê sữa đá', expected: ['ca-phe-sua-da'], note: 'số viết bằng chữ' },
  { text: 'mình ăn bốn cái trứng chiên', expected: ['trung-chien'], note: 'số nhiều' },

  // --- Nhiều món trong một câu ---
  {
    text: 'sáng nay mình ăn phở bò và uống cà phê sữa đá',
    expected: ['pho-bo', 'ca-phe-sua-da'],
    note: 'hai món, nối bằng "và"',
  },
  {
    text: 'trưa nay mình ăn cơm tấm sườn, canh rau muống',
    expected: ['com-tam-suon', 'canh-rau-muong'],
    note: 'hai món, nối bằng dấu phẩy',
  },
  {
    text: 'mình ăn trứng chiên với rau muống xào tỏi',
    expected: ['trung-chien', 'rau-muong-xao-toi'],
    note: 'hai món, nối bằng "với"',
  },
  {
    text: 'tối mình ăn cá thu chiên và cơm trứng',
    expected: ['ca-thu-chien', 'com-trung'],
    note: 'hai món, nối bằng "và"',
  },

  // --- Bí danh và cách gọi khác ---
  { text: 'mình ăn phở', expected: ['pho-bo'], note: 'bí danh ngắn của phở bò' },
  { text: 'mình ăn cơm tấm', expected: ['com-tam-suon'], note: 'bí danh' },
  { text: 'mình ăn bún bò', expected: ['bun-bo-hue'], note: 'bí danh' },
  { text: 'mình ăn bánh mì', expected: ['banh-mi-thit'], note: 'hoà nguyên liệu/món → chọn món' },
  { text: 'mình uống cà phê', expected: ['ca-phe-den'], note: 'cà phê mặc định là cà phê đen' },
  { text: 'mình ăn đậu phụ rán', expected: ['dau-hu-chien'], note: 'cách gọi miền Bắc' },

  // --- Nguyên liệu lẻ ---
  { text: 'mình ăn một bát cơm trắng', expected: ['com-trang'], note: 'nguyên liệu có khẩu phần' },
  { text: 'mình ăn một quả trứng gà', expected: ['trung-ga'], note: 'nguyên liệu có khẩu phần' },
  { text: 'mình ăn một quả chuối tiêu', expected: ['chuoi-tieu'], note: 'trái cây' },
  {
    text: 'mình uống một ly sữa tươi không đường',
    expected: ['sua-tuoi-khong-duong'],
    note: 'đồ uống',
  },
  {
    text: 'mình ăn một hộp sữa chua không đường',
    expected: ['sua-chua-khong-duong'],
    note: 'bữa phụ',
  },

  // --- Viết tắt thường gặp ---
  { text: 'mình uống cf sữa', expected: ['ca-phe-sua-da'], note: 'viết tắt "cf"' },
  { text: 'mình ăn 2 quả trứng', expected: ['trung-ga'], note: 'bí danh "trứng" gắn với trứng gà' },

  // --- Câu ngoài danh mục: KHÔNG được khớp bừa ---
  { text: 'mình ăn pizza hải sản', expected: [], note: 'ngoài danh mục' },
  { text: 'mình ăn sushi cá hồi', expected: [], note: 'ngoài danh mục' },
  { text: 'mình ăn hamburger bò', expected: [], note: 'ngoài danh mục' },
  { text: 'mình ăn mì Ý sốt bò bằm', expected: [], note: 'ngoài danh mục' },
  { text: 'mình ăn salad ức gà', expected: [], note: 'ngoài danh mục' },
  { text: 'mình ăn gì đó', expected: [], note: 'quá mơ hồ' },
  { text: 'mình ăn', expected: [], note: 'không có món nào' },
  { text: 'mình ăn kem', expected: [], note: 'chưa có trong danh mục, không được đoán bừa' },
  { text: 'mình ăn chè đậu đen', expected: [], note: 'chưa có trong danh mục' },
  { text: 'mình ăn bún chả', expected: [], note: 'chưa có trong danh mục' },
]

export const EVAL_CASE_COUNT = EVAL_CASES.length

/** Ngưỡng đạt theo kế hoạch trong docs/REVIEW-MVP.md §3.1. */
export const REQUIRED_TOP1_ACCURACY = 0.85
export const REQUIRED_NEGATIVE_ACCURACY = 0.9
