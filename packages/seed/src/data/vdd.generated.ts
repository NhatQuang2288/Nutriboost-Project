// FILE SINH TỰ ĐỘNG bởi scripts/import-vdd-xlsx.py từ packages/seed/source/vdd-tong-hop.xlsx.
// ĐỪNG SỬA TAY. Gram từng nguyên liệu là số ƯỚC TÍNH; số dinh dưỡng của món là số bảng VDD.

export interface VddRow {
  code: string
  category: string
  name: string
  ingredientsText: string
  /** Khối lượng khẩu phần mà các số dinh dưỡng dưới đây ghi theo. */
  servingGrams: number
  kcal: number
  proteinG: number
  fatG: number
  carbG: number
  fiberG: number | null
  sodiumMg: number | null
  components: { name: string; grams: number }[]
}

export const VDD_ROWS: readonly VddRow[] = [
 {
  "code": "VPF-000001",
  "category": "Lương thực & Ngũ cốc",
  "name": "Gạo tẻ trắng",
  "ingredientsText": "Gạo tẻ trắng hạt dài",
  "servingGrams": 100.0,
  "kcal": 344.0,
  "proteinG": 7.9,
  "fatG": 1.0,
  "carbG": 76.2,
  "fiberG": 0.4,
  "sodiumMg": 3.0,
  "components": [
   {
    "name": "Gạo tẻ trắng hạt dài",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000002",
  "category": "Lương thực & Ngũ cốc",
  "name": "Gạo lứt đỏ",
  "ingredientsText": "Gạo lứt đỏ xát dở",
  "servingGrams": 100.0,
  "kcal": 345.0,
  "proteinG": 7.5,
  "fatG": 2.7,
  "carbG": 72.8,
  "fiberG": 3.4,
  "sodiumMg": 5.0,
  "components": [
   {
    "name": "Gạo lứt đỏ xát dở",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000003",
  "category": "Lương thực & Ngũ cốc",
  "name": "Gạo nếp cái hoa vàng",
  "ingredientsText": "Gạo nếp hạt tròn",
  "servingGrams": 100.0,
  "kcal": 346.0,
  "proteinG": 8.2,
  "fatG": 1.5,
  "carbG": 74.9,
  "fiberG": 0.6,
  "sodiumMg": 4.0,
  "components": [
   {
    "name": "Gạo nếp hạt tròn",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000004",
  "category": "Lương thực & Ngũ cốc",
  "name": "Ngô vàng tươi",
  "ingredientsText": "Hạt ngô vàng tươi",
  "servingGrams": 100.0,
  "kcal": 190.0,
  "proteinG": 4.1,
  "fatG": 2.3,
  "carbG": 39.6,
  "fiberG": 1.2,
  "sodiumMg": 15.0,
  "components": [
   {
    "name": "Hạt ngô vàng tươi",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000005",
  "category": "Lương thực & Ngũ cốc",
  "name": "Khoai lang củ",
  "ingredientsText": "Khoai lang ruột vàng",
  "servingGrams": 100.0,
  "kcal": 119.0,
  "proteinG": 0.8,
  "fatG": 0.2,
  "carbG": 28.5,
  "fiberG": 1.3,
  "sodiumMg": 18.0,
  "components": [
   {
    "name": "Khoai lang ruột vàng",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000006",
  "category": "Lương thực & Ngũ cốc",
  "name": "Khoai tây củ",
  "ingredientsText": "Khoai tây tươi",
  "servingGrams": 100.0,
  "kcal": 93.0,
  "proteinG": 2.0,
  "fatG": 0.1,
  "carbG": 20.9,
  "fiberG": 1.0,
  "sodiumMg": 7.0,
  "components": [
   {
    "name": "Khoai tây tươi",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000007",
  "category": "Lương thực & Ngũ cốc",
  "name": "Khoai môn",
  "ingredientsText": "Khoai môn củ tươi",
  "servingGrams": 100.0,
  "kcal": 109.0,
  "proteinG": 1.5,
  "fatG": 0.2,
  "carbG": 25.2,
  "fiberG": 1.2,
  "sodiumMg": 11.0,
  "components": [
   {
    "name": "Khoai môn củ tươi",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000008",
  "category": "Lương thực & Ngũ cốc",
  "name": "Khoai sọ",
  "ingredientsText": "Khoai sọ củ nhỏ",
  "servingGrams": 100.0,
  "kcal": 98.0,
  "proteinG": 1.8,
  "fatG": 0.1,
  "carbG": 22.5,
  "fiberG": 1.1,
  "sodiumMg": 9.0,
  "components": [
   {
    "name": "Khoai sọ củ nhỏ",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000009",
  "category": "Lương thực & Ngũ cốc",
  "name": "Sắn củ (Khoai mì)",
  "ingredientsText": "Sắn củ tươi cạo vỏ",
  "servingGrams": 100.0,
  "kcal": 152.0,
  "proteinG": 1.1,
  "fatG": 0.2,
  "carbG": 36.4,
  "fiberG": 1.5,
  "sodiumMg": 14.0,
  "components": [
   {
    "name": "Sắn củ tươi cạo vỏ",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000010",
  "category": "Lương thực & Ngũ cốc",
  "name": "Bột đao (Bột năng)",
  "ingredientsText": "Tinh bột sắn tinh khiết",
  "servingGrams": 100.0,
  "kcal": 347.0,
  "proteinG": 0.5,
  "fatG": 0.1,
  "carbG": 86.0,
  "fiberG": 0.1,
  "sodiumMg": 6.0,
  "components": [
   {
    "name": "Tinh bột sắn tinh khiết",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000011",
  "category": "Món Cơm",
  "name": "Cơm tấm sườn nướng",
  "ingredientsText": "Gạo tấm, sườn heo nướng, mỡ hành",
  "servingGrams": 300.0,
  "kcal": 520.0,
  "proteinG": 22.5,
  "fatG": 18.0,
  "carbG": 66.5,
  "fiberG": 1.2,
  "sodiumMg": 750.0,
  "components": [
   {
    "name": "Cơm tấm chín",
    "grams": 180.0
   },
   {
    "name": "Sườn heo nướng",
    "grams": 90.0
   },
   {
    "name": "Mỡ hành",
    "grams": 10.0
   },
   {
    "name": "Nước mắm pha",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000012",
  "category": "Món Cơm",
  "name": "Cơm tấm bì chả",
  "ingredientsText": "Gạo tấm, bì heo, chả trứng hấp",
  "servingGrams": 280.0,
  "kcal": 480.0,
  "proteinG": 19.8,
  "fatG": 16.5,
  "carbG": 63.0,
  "fiberG": 1.0,
  "sodiumMg": 680.0,
  "components": [
   {
    "name": "Cơm tấm chín",
    "grams": 180.0
   },
   {
    "name": "Bì heo trộn thính",
    "grams": 40.0
   },
   {
    "name": "Chả trứng hấp",
    "grams": 40.0
   },
   {
    "name": "Nước mắm pha",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000013",
  "category": "Món Cơm",
  "name": "Cơm tấm chả trứng",
  "ingredientsText": "Gạo tấm, chả trứng hấp",
  "servingGrams": 250.0,
  "kcal": 420.0,
  "proteinG": 16.2,
  "fatG": 14.0,
  "carbG": 58.0,
  "fiberG": 0.8,
  "sodiumMg": 620.0,
  "components": [
   {
    "name": "Cơm tấm chín",
    "grams": 180.0
   },
   {
    "name": "Chả trứng hấp",
    "grams": 50.0
   },
   {
    "name": "Nước mắm pha",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000014",
  "category": "Món Cơm",
  "name": "Cơm chiên Dương Châu",
  "ingredientsText": "Cơm nguội, trứng, lạp xưởng, đậu hà lan",
  "servingGrams": 250.0,
  "kcal": 465.0,
  "proteinG": 14.2,
  "fatG": 18.5,
  "carbG": 59.8,
  "fiberG": 1.8,
  "sodiumMg": 680.0,
  "components": [
   {
    "name": "Cơm nguội",
    "grams": 170.0
   },
   {
    "name": "Trứng gà",
    "grams": 30.0
   },
   {
    "name": "Lạp xưởng",
    "grams": 25.0
   },
   {
    "name": "Đậu hà lan",
    "grams": 15.0
   },
   {
    "name": "Dầu ăn",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000015",
  "category": "Món Cơm",
  "name": "Cơm chiên hải sản",
  "ingredientsText": "Cơm nguội, tôm, mực, cà rốt",
  "servingGrams": 250.0,
  "kcal": 430.0,
  "proteinG": 16.5,
  "fatG": 12.8,
  "carbG": 61.2,
  "fiberG": 1.5,
  "sodiumMg": 720.0,
  "components": [
   {
    "name": "Cơm nguội",
    "grams": 170.0
   },
   {
    "name": "Tôm",
    "grams": 30.0
   },
   {
    "name": "Mực",
    "grams": 25.0
   },
   {
    "name": "Cà rốt",
    "grams": 15.0
   },
   {
    "name": "Dầu ăn",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000016",
  "category": "Món Cơm",
  "name": "Cơm chiên cá mặn",
  "ingredientsText": "Cơm nguội, cá mặn, gà xé",
  "servingGrams": 250.0,
  "kcal": 450.0,
  "proteinG": 18.0,
  "fatG": 15.2,
  "carbG": 59.0,
  "fiberG": 1.0,
  "sodiumMg": 950.0,
  "components": [
   {
    "name": "Cơm nguội",
    "grams": 175.0
   },
   {
    "name": "Cá mặn",
    "grams": 20.0
   },
   {
    "name": "Thịt gà xé",
    "grams": 40.0
   },
   {
    "name": "Dầu ăn",
    "grams": 10.0
   },
   {
    "name": "Hành lá",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000017",
  "category": "Món Cơm",
  "name": "Cơm gà Hội An",
  "ingredientsText": "Gạo nấu nước dùng gà, thịt gà xé, rau răm",
  "servingGrams": 300.0,
  "kcal": 490.0,
  "proteinG": 22.0,
  "fatG": 15.0,
  "carbG": 65.5,
  "fiberG": 1.1,
  "sodiumMg": 650.0,
  "components": [
   {
    "name": "Cơm nấu nước gà",
    "grams": 200.0
   },
   {
    "name": "Thịt gà xé",
    "grams": 80.0
   },
   {
    "name": "Rau răm, hành tây",
    "grams": 15.0
   },
   {
    "name": "Nước mắm gừng",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000018",
  "category": "Món Cơm",
  "name": "Cơm gà Tam Kỳ",
  "ingredientsText": "Gạo tẻ, gà luộc xé phay, rau thơm",
  "servingGrams": 300.0,
  "kcal": 480.0,
  "proteinG": 23.2,
  "fatG": 14.2,
  "carbG": 64.0,
  "fiberG": 1.0,
  "sodiumMg": 630.0,
  "components": [
   {
    "name": "Cơm chín",
    "grams": 200.0
   },
   {
    "name": "Thịt gà luộc xé",
    "grams": 80.0
   },
   {
    "name": "Rau thơm, hành tây",
    "grams": 15.0
   },
   {
    "name": "Nước chấm",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000019",
  "category": "Món Cơm",
  "name": "Cơm lam nướng",
  "ingredientsText": "Gạo nếp nướng ống tre",
  "servingGrams": 150.0,
  "kcal": 380.0,
  "proteinG": 8.5,
  "fatG": 2.1,
  "carbG": 81.5,
  "fiberG": 1.0,
  "sodiumMg": 25.0,
  "components": [
   {
    "name": "Gạo nếp (cơm lam chín)",
    "grams": 140.0
   },
   {
    "name": "Nước cốt dừa",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000020",
  "category": "Món Cơm",
  "name": "Cơm cháy kho quẹt",
  "ingredientsText": "Cơm cháy giòn, mắm kho quẹt, tôm khô",
  "servingGrams": 200.0,
  "kcal": 410.0,
  "proteinG": 9.5,
  "fatG": 12.0,
  "carbG": 65.0,
  "fiberG": 1.2,
  "sodiumMg": 1100.0,
  "components": [
   {
    "name": "Cơm cháy",
    "grams": 140.0
   },
   {
    "name": "Mắm kho quẹt",
    "grams": 40.0
   },
   {
    "name": "Tôm khô",
    "grams": 10.0
   },
   {
    "name": "Thịt ba chỉ",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000021",
  "category": "Món Xôi",
  "name": "Xôi đậu xanh",
  "ingredientsText": "Gạo nếp, đậu xanh cà vỏ",
  "servingGrams": 100.0,
  "kcal": 339.0,
  "proteinG": 10.4,
  "fatG": 1.2,
  "carbG": 71.7,
  "fiberG": 2.2,
  "sodiumMg": 12.0,
  "components": [
   {
    "name": "Gạo nếp (xôi chín)",
    "grams": 75.0
   },
   {
    "name": "Đậu xanh cà vỏ",
    "grams": 25.0
   }
  ]
 },
 {
  "code": "VPF-000022",
  "category": "Món Xôi",
  "name": "Xôi gấc",
  "ingredientsText": "Gạo nếp, màng gấc, đường, mỡ",
  "servingGrams": 100.0,
  "kcal": 332.0,
  "proteinG": 7.2,
  "fatG": 2.1,
  "carbG": 71.0,
  "fiberG": 1.2,
  "sodiumMg": 15.0,
  "components": [
   {
    "name": "Gạo nếp (xôi chín)",
    "grams": 85.0
   },
   {
    "name": "Màng gấc",
    "grams": 8.0
   },
   {
    "name": "Đường",
    "grams": 5.0
   },
   {
    "name": "Mỡ nước",
    "grams": 2.0
   }
  ]
 },
 {
  "code": "VPF-000023",
  "category": "Món Xôi",
  "name": "Xôi lạc (đậu phụng)",
  "ingredientsText": "Gạo nếp, lạc nhân",
  "servingGrams": 100.0,
  "kcal": 358.0,
  "proteinG": 9.8,
  "fatG": 8.5,
  "carbG": 60.5,
  "fiberG": 2.1,
  "sodiumMg": 10.0,
  "components": [
   {
    "name": "Gạo nếp (xôi chín)",
    "grams": 80.0
   },
   {
    "name": "Lạc nhân",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000024",
  "category": "Món Xôi",
  "name": "Xôi khúc (Bánh khúc)",
  "ingredientsText": "Gạo nếp, rau khúc, đậu xanh, thịt ba chỉ",
  "servingGrams": 150.0,
  "kcal": 412.0,
  "proteinG": 11.5,
  "fatG": 12.8,
  "carbG": 62.0,
  "fiberG": 2.5,
  "sodiumMg": 320.0,
  "components": [
   {
    "name": "Gạo nếp (xôi chín)",
    "grams": 95.0
   },
   {
    "name": "Rau khúc",
    "grams": 15.0
   },
   {
    "name": "Đậu xanh",
    "grams": 20.0
   },
   {
    "name": "Thịt ba chỉ",
    "grams": 15.0
   },
   {
    "name": "Hành phi",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000025",
  "category": "Món Xôi",
  "name": "Xôi xéo",
  "ingredientsText": "Gạo nếp, đậu xanh quết, hành phi",
  "servingGrams": 150.0,
  "kcal": 435.0,
  "proteinG": 9.8,
  "fatG": 15.5,
  "carbG": 63.5,
  "fiberG": 2.0,
  "sodiumMg": 280.0,
  "components": [
   {
    "name": "Gạo nếp (xôi chín)",
    "grams": 100.0
   },
   {
    "name": "Đậu xanh quết",
    "grams": 30.0
   },
   {
    "name": "Hành phi + mỡ",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000026",
  "category": "Món Xôi",
  "name": "Xôi gà xé",
  "ingredientsText": "Gạo nếp, thịt gà xé, mỡ hành",
  "servingGrams": 180.0,
  "kcal": 460.0,
  "proteinG": 18.5,
  "fatG": 14.0,
  "carbG": 64.0,
  "fiberG": 1.1,
  "sodiumMg": 450.0,
  "components": [
   {
    "name": "Gạo nếp (xôi chín)",
    "grams": 120.0
   },
   {
    "name": "Thịt gà xé",
    "grams": 45.0
   },
   {
    "name": "Mỡ hành",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000027",
  "category": "Món Xôi",
  "name": "Xôi nếp cẩm",
  "ingredientsText": "Gạo nếp cẩm",
  "servingGrams": 100.0,
  "kcal": 340.0,
  "proteinG": 8.2,
  "fatG": 2.2,
  "carbG": 71.5,
  "fiberG": 3.1,
  "sodiumMg": 8.0,
  "components": [
   {
    "name": "Gạo nếp cẩm (xôi chín)",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000028",
  "category": "Món Xôi",
  "name": "Xôi vò",
  "ingredientsText": "Gạo nếp, đậu xanh quết mịn",
  "servingGrams": 100.0,
  "kcal": 345.0,
  "proteinG": 10.8,
  "fatG": 2.5,
  "carbG": 69.8,
  "fiberG": 2.4,
  "sodiumMg": 14.0,
  "components": [
   {
    "name": "Gạo nếp (xôi chín)",
    "grams": 70.0
   },
   {
    "name": "Đậu xanh quết mịn",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000029",
  "category": "Món Xôi",
  "name": "Xôi sắn (khoai mì)",
  "ingredientsText": "Gạo nếp, sắn thái hạt lựu, mỡ hành",
  "servingGrams": 150.0,
  "kcal": 385.0,
  "proteinG": 6.8,
  "fatG": 5.2,
  "carbG": 77.2,
  "fiberG": 2.1,
  "sodiumMg": 120.0,
  "components": [
   {
    "name": "Gạo nếp (xôi chín)",
    "grams": 90.0
   },
   {
    "name": "Sắn hạt lựu",
    "grams": 50.0
   },
   {
    "name": "Mỡ hành",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000030",
  "category": "Món Xôi",
  "name": "Xôi mặn Sài Gòn",
  "ingredientsText": "Gạo nếp, lạp xưởng, chà bông, tôm khô",
  "servingGrams": 180.0,
  "kcal": 490.0,
  "proteinG": 16.5,
  "fatG": 19.2,
  "carbG": 62.5,
  "fiberG": 1.2,
  "sodiumMg": 780.0,
  "components": [
   {
    "name": "Gạo nếp (xôi chín)",
    "grams": 120.0
   },
   {
    "name": "Lạp xưởng",
    "grams": 25.0
   },
   {
    "name": "Chà bông",
    "grams": 15.0
   },
   {
    "name": "Tôm khô",
    "grams": 10.0
   },
   {
    "name": "Mỡ hành",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000031",
  "category": "Món Cháo",
  "name": "Cháo lòng",
  "ingredientsText": "Gạo tẻ/nếp, tim, gan, lòng heo, huyết",
  "servingGrams": 400.0,
  "kcal": 320.0,
  "proteinG": 18.5,
  "fatG": 11.2,
  "carbG": 36.5,
  "fiberG": 0.5,
  "sodiumMg": 890.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 300.0
   },
   {
    "name": "Lòng heo",
    "grams": 30.0
   },
   {
    "name": "Tim, gan heo",
    "grams": 30.0
   },
   {
    "name": "Huyết heo",
    "grams": 30.0
   },
   {
    "name": "Hành lá",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000032",
  "category": "Món Cháo",
  "name": "Cháo gà ta",
  "ingredientsText": "Gạo tẻ, thịt gà xé, hành lá",
  "servingGrams": 400.0,
  "kcal": 280.0,
  "proteinG": 16.2,
  "fatG": 6.8,
  "carbG": 38.0,
  "fiberG": 0.4,
  "sodiumMg": 680.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 320.0
   },
   {
    "name": "Thịt gà xé",
    "grams": 70.0
   },
   {
    "name": "Hành lá, tiêu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000033",
  "category": "Món Cháo",
  "name": "Cháo sườn quẩy",
  "ingredientsText": "Gạo tẻ xay, sườn heo băm nhừ, quẩy",
  "servingGrams": 350.0,
  "kcal": 310.0,
  "proteinG": 12.8,
  "fatG": 10.5,
  "carbG": 42.5,
  "fiberG": 0.5,
  "sodiumMg": 720.0,
  "components": [
   {
    "name": "Cháo gạo xay",
    "grams": 290.0
   },
   {
    "name": "Sườn heo băm",
    "grams": 35.0
   },
   {
    "name": "Quẩy",
    "grams": 25.0
   }
  ]
 },
 {
  "code": "VPF-000034",
  "category": "Món Cháo",
  "name": "Cháo cá lóc",
  "ingredientsText": "Gạo tẻ, thịt cá lóc, gừng, hành",
  "servingGrams": 400.0,
  "kcal": 265.0,
  "proteinG": 15.8,
  "fatG": 5.2,
  "carbG": 38.5,
  "fiberG": 0.4,
  "sodiumMg": 620.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 320.0
   },
   {
    "name": "Thịt cá lóc",
    "grams": 65.0
   },
   {
    "name": "Gừng, hành",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000035",
  "category": "Món Cháo",
  "name": "Cháo hến",
  "ingredientsText": "Gạo, thịt hến sông, rau răm",
  "servingGrams": 350.0,
  "kcal": 240.0,
  "proteinG": 14.2,
  "fatG": 4.5,
  "carbG": 35.8,
  "fiberG": 0.5,
  "sodiumMg": 580.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 285.0
   },
   {
    "name": "Thịt hến",
    "grams": 50.0
   },
   {
    "name": "Rau răm, hành",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000036",
  "category": "Món Cháo",
  "name": "Cháo vịt",
  "ingredientsText": "Gạo tẻ, thịt vịt luộc xé, hành gừng",
  "servingGrams": 400.0,
  "kcal": 330.0,
  "proteinG": 17.5,
  "fatG": 11.8,
  "carbG": 38.2,
  "fiberG": 0.4,
  "sodiumMg": 650.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 310.0
   },
   {
    "name": "Thịt vịt luộc xé",
    "grams": 75.0
   },
   {
    "name": "Hành, gừng",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000037",
  "category": "Món Cháo",
  "name": "Cháo ốc",
  "ingredientsText": "Gạo tẻ, thịt ốc nhồi, tía tô",
  "servingGrams": 350.0,
  "kcal": 230.0,
  "proteinG": 12.5,
  "fatG": 3.8,
  "carbG": 36.2,
  "fiberG": 0.8,
  "sodiumMg": 590.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 285.0
   },
   {
    "name": "Thịt ốc nhồi",
    "grams": 50.0
   },
   {
    "name": "Tía tô, hành",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000038",
  "category": "Món Cháo",
  "name": "Cháo lươn Nghệ An",
  "ingredientsText": "Gạo tẻ, thịt lươn xào nghệ, hành hoa",
  "servingGrams": 400.0,
  "kcal": 295.0,
  "proteinG": 16.8,
  "fatG": 7.2,
  "carbG": 40.5,
  "fiberG": 0.6,
  "sodiumMg": 680.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 320.0
   },
   {
    "name": "Thịt lươn xào nghệ",
    "grams": 65.0
   },
   {
    "name": "Hành hoa",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000039",
  "category": "Món Cháo",
  "name": "Cháo bầu tôm",
  "ingredientsText": "Gạo tẻ, thịt tôm băm, bầu nạo",
  "servingGrams": 350.0,
  "kcal": 210.0,
  "proteinG": 11.5,
  "fatG": 3.2,
  "carbG": 33.8,
  "fiberG": 0.9,
  "sodiumMg": 520.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 250.0
   },
   {
    "name": "Tôm băm",
    "grams": 40.0
   },
   {
    "name": "Bầu nạo",
    "grams": 60.0
   }
  ]
 },
 {
  "code": "VPF-000040",
  "category": "Món Cháo",
  "name": "Cháo nấm tràm",
  "ingredientsText": "Gạo tẻ, nấm tràm tươi, thịt băm",
  "servingGrams": 350.0,
  "kcal": 220.0,
  "proteinG": 9.8,
  "fatG": 4.8,
  "carbG": 34.2,
  "fiberG": 1.5,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 270.0
   },
   {
    "name": "Nấm tràm",
    "grams": 50.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000041",
  "category": "Món Phở",
  "name": "Phở bò chín",
  "ingredientsText": "Bánh phở, thịt bò chín, nước dùng xương",
  "servingGrams": 450.0,
  "kcal": 435.0,
  "proteinG": 18.5,
  "fatG": 10.2,
  "carbG": 67.2,
  "fiberG": 0.8,
  "sodiumMg": 1120.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 200.0
   },
   {
    "name": "Thịt bò chín",
    "grams": 60.0
   },
   {
    "name": "Nước dùng xương",
    "grams": 175.0
   },
   {
    "name": "Hành, rau thơm",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000042",
  "category": "Món Phở",
  "name": "Phở bò tái",
  "ingredientsText": "Bánh phở, thịt bò tái, nước dùng xương",
  "servingGrams": 450.0,
  "kcal": 420.0,
  "proteinG": 19.2,
  "fatG": 9.5,
  "carbG": 66.8,
  "fiberG": 0.8,
  "sodiumMg": 1080.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 200.0
   },
   {
    "name": "Thịt bò tái",
    "grams": 60.0
   },
   {
    "name": "Nước dùng xương",
    "grams": 175.0
   },
   {
    "name": "Hành, rau thơm",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000043",
  "category": "Món Phở",
  "name": "Phở bò tái lăn",
  "ingredientsText": "Bánh phở, thịt bò xào tái tỏi",
  "servingGrams": 450.0,
  "kcal": 480.0,
  "proteinG": 20.5,
  "fatG": 15.2,
  "carbG": 65.0,
  "fiberG": 0.8,
  "sodiumMg": 1180.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 200.0
   },
   {
    "name": "Thịt bò xào tái lăn",
    "grams": 70.0
   },
   {
    "name": "Tỏi, dầu",
    "grams": 10.0
   },
   {
    "name": "Nước dùng",
    "grams": 160.0
   },
   {
    "name": "Hành, rau thơm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000044",
  "category": "Món Phở",
  "name": "Phở bò nạm gầu",
  "ingredientsText": "Bánh phở, thịt bò nạm gầu",
  "servingGrams": 450.0,
  "kcal": 495.0,
  "proteinG": 19.8,
  "fatG": 17.5,
  "carbG": 64.2,
  "fiberG": 0.8,
  "sodiumMg": 1150.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 200.0
   },
   {
    "name": "Nạm, gầu bò",
    "grams": 70.0
   },
   {
    "name": "Nước dùng xương",
    "grams": 165.0
   },
   {
    "name": "Hành, rau thơm",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000045",
  "category": "Món Phở",
  "name": "Phở gà ta",
  "ingredientsText": "Bánh phở, thịt gà ta, nước dùng gà",
  "servingGrams": 450.0,
  "kcal": 410.0,
  "proteinG": 19.8,
  "fatG": 8.5,
  "carbG": 63.5,
  "fiberG": 0.6,
  "sodiumMg": 980.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 200.0
   },
   {
    "name": "Thịt gà ta",
    "grams": 65.0
   },
   {
    "name": "Nước dùng gà",
    "grams": 170.0
   },
   {
    "name": "Hành, lá chanh",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000046",
  "category": "Món Phở",
  "name": "Phở cuốn Hà Nội",
  "ingredientsText": "Bánh phở tấm, thịt bò xào, rau thơm",
  "servingGrams": 200.0,
  "kcal": 320.0,
  "proteinG": 14.5,
  "fatG": 11.2,
  "carbG": 40.2,
  "fiberG": 1.2,
  "sodiumMg": 580.0,
  "components": [
   {
    "name": "Bánh phở tấm",
    "grams": 120.0
   },
   {
    "name": "Thịt bò xào",
    "grams": 50.0
   },
   {
    "name": "Rau thơm, xà lách",
    "grams": 20.0
   },
   {
    "name": "Nước chấm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000047",
  "category": "Món Phở",
  "name": "Phở trộn gà",
  "ingredientsText": "Bánh phở, thịt gà, xì dầu, lạc rang",
  "servingGrams": 300.0,
  "kcal": 420.0,
  "proteinG": 17.2,
  "fatG": 13.5,
  "carbG": 57.0,
  "fiberG": 1.4,
  "sodiumMg": 720.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 180.0
   },
   {
    "name": "Thịt gà",
    "grams": 60.0
   },
   {
    "name": "Lạc rang",
    "grams": 15.0
   },
   {
    "name": "Rau thơm",
    "grams": 25.0
   },
   {
    "name": "Xì dầu, nước trộn",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000048",
  "category": "Món Phở",
  "name": "Phở xào bò",
  "ingredientsText": "Bánh phở xào, thịt bò, cải ngọt",
  "servingGrams": 350.0,
  "kcal": 540.0,
  "proteinG": 21.0,
  "fatG": 20.5,
  "carbG": 67.5,
  "fiberG": 2.1,
  "sodiumMg": 920.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 210.0
   },
   {
    "name": "Thịt bò",
    "grams": 70.0
   },
   {
    "name": "Cải ngọt",
    "grams": 50.0
   },
   {
    "name": "Dầu ăn",
    "grams": 15.0
   },
   {
    "name": "Xì dầu",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000049",
  "category": "Món Phở",
  "name": "Phở chua Lạng Sơn",
  "ingredientsText": "Bánh phở, thịt xá xíu, lạp xưởng, sốt chua",
  "servingGrams": 350.0,
  "kcal": 460.0,
  "proteinG": 18.2,
  "fatG": 14.8,
  "carbG": 63.5,
  "fiberG": 1.2,
  "sodiumMg": 880.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 200.0
   },
   {
    "name": "Xá xíu",
    "grams": 50.0
   },
   {
    "name": "Lạp xưởng",
    "grams": 20.0
   },
   {
    "name": "Lạc, khoai chiên",
    "grams": 20.0
   },
   {
    "name": "Sốt chua",
    "grams": 50.0
   },
   {
    "name": "Rau thơm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000050",
  "category": "Món Phở",
  "name": "Phở ngầu pín",
  "ingredientsText": "Bánh phở, pín bò hầm, nước dùng",
  "servingGrams": 450.0,
  "kcal": 510.0,
  "proteinG": 24.5,
  "fatG": 18.2,
  "carbG": 61.8,
  "fiberG": 0.6,
  "sodiumMg": 1220.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 200.0
   },
   {
    "name": "Pín bò hầm",
    "grams": 80.0
   },
   {
    "name": "Nước dùng thuốc bắc",
    "grams": 160.0
   },
   {
    "name": "Rau ăn kèm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000051",
  "category": "Món Bún",
  "name": "Bún riêu cua",
  "ingredientsText": "Bún tươi, cua đồng, cà chua, đậu hũ",
  "servingGrams": 450.0,
  "kcal": 382.0,
  "proteinG": 16.2,
  "fatG": 11.4,
  "carbG": 53.6,
  "fiberG": 1.8,
  "sodiumMg": 1250.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 200.0
   },
   {
    "name": "Riêu cua đồng",
    "grams": 50.0
   },
   {
    "name": "Cà chua",
    "grams": 30.0
   },
   {
    "name": "Đậu hũ chiên",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 120.0
   },
   {
    "name": "Rau sống",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000052",
  "category": "Món Bún",
  "name": "Bún bò Huế",
  "ingredientsText": "Bún to, bắp bò, giò heo, huyết",
  "servingGrams": 500.0,
  "kcal": 478.0,
  "proteinG": 22.4,
  "fatG": 14.8,
  "carbG": 63.8,
  "fiberG": 1.2,
  "sodiumMg": 1380.0,
  "components": [
   {
    "name": "Bún to",
    "grams": 200.0
   },
   {
    "name": "Bắp bò",
    "grams": 50.0
   },
   {
    "name": "Giò heo",
    "grams": 50.0
   },
   {
    "name": "Huyết, chả Huế",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 150.0
   },
   {
    "name": "Rau ăn kèm",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000053",
  "category": "Món Bún",
  "name": "Bún chả Hà Nội",
  "ingredientsText": "Bún tươi, thịt nướng, nước mắm đu đủ",
  "servingGrams": 350.0,
  "kcal": 485.0,
  "proteinG": 21.0,
  "fatG": 18.2,
  "carbG": 58.5,
  "fiberG": 1.5,
  "sodiumMg": 950.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 150.0
   },
   {
    "name": "Chả + thịt nướng",
    "grams": 100.0
   },
   {
    "name": "Nước mắm pha",
    "grams": 70.0
   },
   {
    "name": "Đu đủ, cà rốt",
    "grams": 15.0
   },
   {
    "name": "Rau sống",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000054",
  "category": "Món Bún",
  "name": "Bún ốc Hà Nội",
  "ingredientsText": "Bún tươi, thịt ốc nhồi, cà chua",
  "servingGrams": 450.0,
  "kcal": 350.0,
  "proteinG": 15.5,
  "fatG": 6.8,
  "carbG": 56.2,
  "fiberG": 1.6,
  "sodiumMg": 1180.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 200.0
   },
   {
    "name": "Thịt ốc nhồi",
    "grams": 50.0
   },
   {
    "name": "Cà chua",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 150.0
   },
   {
    "name": "Rau sống",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000055",
  "category": "Món Bún",
  "name": "Bún thang",
  "ingredientsText": "Bún tươi, gà xé, giò lụa, trứng tráng",
  "servingGrams": 450.0,
  "kcal": 395.0,
  "proteinG": 21.5,
  "fatG": 9.2,
  "carbG": 56.0,
  "fiberG": 0.8,
  "sodiumMg": 1050.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 180.0
   },
   {
    "name": "Thịt gà xé",
    "grams": 40.0
   },
   {
    "name": "Giò lụa",
    "grams": 30.0
   },
   {
    "name": "Trứng tráng",
    "grams": 25.0
   },
   {
    "name": "Nước dùng gà",
    "grams": 160.0
   },
   {
    "name": "Rau thơm",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000056",
  "category": "Món Bún",
  "name": "Bún mọc",
  "ingredientsText": "Bún tươi, mọc giò sống, sườn heo",
  "servingGrams": 450.0,
  "kcal": 415.0,
  "proteinG": 18.6,
  "fatG": 13.5,
  "carbG": 54.2,
  "fiberG": 1.0,
  "sodiumMg": 1100.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 200.0
   },
   {
    "name": "Mọc giò sống",
    "grams": 50.0
   },
   {
    "name": "Sườn heo",
    "grams": 40.0
   },
   {
    "name": "Nước dùng",
    "grams": 140.0
   },
   {
    "name": "Hành, rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000057",
  "category": "Món Bún",
  "name": "Bún mắm Miền Tây",
  "ingredientsText": "Bún tươi, mắm cá linh, thịt quay, tôm",
  "servingGrams": 500.0,
  "kcal": 510.0,
  "proteinG": 24.5,
  "fatG": 16.0,
  "carbG": 66.2,
  "fiberG": 2.2,
  "sodiumMg": 1650.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 200.0
   },
   {
    "name": "Mắm cá linh",
    "grams": 20.0
   },
   {
    "name": "Thịt quay",
    "grams": 50.0
   },
   {
    "name": "Tôm",
    "grams": 30.0
   },
   {
    "name": "Nước lèo",
    "grams": 160.0
   },
   {
    "name": "Rau sống",
    "grams": 40.0
   }
  ]
 },
 {
  "code": "VPF-000058",
  "category": "Món Bún",
  "name": "Bún cá Hải Phòng",
  "ingredientsText": "Bún tươi, cá rô chiên, chả cá, dọc mùng",
  "servingGrams": 450.0,
  "kcal": 405.0,
  "proteinG": 18.2,
  "fatG": 11.0,
  "carbG": 58.0,
  "fiberG": 2.0,
  "sodiumMg": 1150.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 200.0
   },
   {
    "name": "Cá rô chiên",
    "grams": 50.0
   },
   {
    "name": "Chả cá",
    "grams": 30.0
   },
   {
    "name": "Dọc mùng",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 120.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000059",
  "category": "Món Bún",
  "name": "Bún đậu mắm tôm",
  "ingredientsText": "Bún lá, đậu hũ chiên, chả cốm, mắm tôm",
  "servingGrams": 350.0,
  "kcal": 460.0,
  "proteinG": 16.8,
  "fatG": 21.5,
  "carbG": 49.5,
  "fiberG": 1.8,
  "sodiumMg": 1120.0,
  "components": [
   {
    "name": "Bún lá",
    "grams": 150.0
   },
   {
    "name": "Đậu hũ chiên",
    "grams": 100.0
   },
   {
    "name": "Chả cốm",
    "grams": 40.0
   },
   {
    "name": "Mắm tôm pha",
    "grams": 25.0
   },
   {
    "name": "Rau kinh giới, tía tô",
    "grams": 35.0
   }
  ]
 },
 {
  "code": "VPF-000060",
  "category": "Món Bún",
  "name": "Bún thịt nướng",
  "ingredientsText": "Bún tươi, thịt heo nướng, rau thơm",
  "servingGrams": 350.0,
  "kcal": 470.0,
  "proteinG": 19.5,
  "fatG": 17.2,
  "carbG": 59.0,
  "fiberG": 2.2,
  "sodiumMg": 880.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 170.0
   },
   {
    "name": "Thịt heo nướng",
    "grams": 90.0
   },
   {
    "name": "Nước mắm pha",
    "grams": 50.0
   },
   {
    "name": "Đồ chua, rau thơm",
    "grams": 30.0
   },
   {
    "name": "Lạc, mỡ hành",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000061",
  "category": "Món Bún",
  "name": "Bún chả cá Nha Trang",
  "ingredientsText": "Bún tươi, chả cá thu/nhồng, sứa tươi",
  "servingGrams": 450.0,
  "kcal": 380.0,
  "proteinG": 19.8,
  "fatG": 8.5,
  "carbG": 56.5,
  "fiberG": 1.2,
  "sodiumMg": 1080.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 200.0
   },
   {
    "name": "Chả cá",
    "grams": 70.0
   },
   {
    "name": "Sứa",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 130.0
   },
   {
    "name": "Rau sống",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000062",
  "category": "Món Bún",
  "name": "Bún xào nghệ",
  "ingredientsText": "Bún tươi xào, lòng nghệ, củ nghệ tươi",
  "servingGrams": 300.0,
  "kcal": 390.0,
  "proteinG": 14.2,
  "fatG": 12.8,
  "carbG": 54.5,
  "fiberG": 1.8,
  "sodiumMg": 780.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 200.0
   },
   {
    "name": "Lòng heo",
    "grams": 60.0
   },
   {
    "name": "Nghệ, dầu",
    "grams": 15.0
   },
   {
    "name": "Hành, rau",
    "grams": 25.0
   }
  ]
 },
 {
  "code": "VPF-000063",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Hủ tiếu Nam Vang",
  "ingredientsText": "Hủ tiếu khô, thịt băm, tôm, gan heo",
  "servingGrams": 450.0,
  "kcal": 425.0,
  "proteinG": 20.1,
  "fatG": 11.2,
  "carbG": 60.5,
  "fiberG": 1.1,
  "sodiumMg": 1180.0,
  "components": [
   {
    "name": "Hủ tiếu",
    "grams": 180.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 40.0
   },
   {
    "name": "Tôm",
    "grams": 30.0
   },
   {
    "name": "Gan heo",
    "grams": 20.0
   },
   {
    "name": "Nước lèo",
    "grams": 160.0
   },
   {
    "name": "Hẹ, giá",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000064",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Hủ tiếu Mỹ Tho",
  "ingredientsText": "Hủ tiếu khô, thịt heo, tôm, sườn",
  "servingGrams": 450.0,
  "kcal": 430.0,
  "proteinG": 19.5,
  "fatG": 12.0,
  "carbG": 61.0,
  "fiberG": 1.0,
  "sodiumMg": 1150.0,
  "components": [
   {
    "name": "Hủ tiếu",
    "grams": 180.0
   },
   {
    "name": "Thịt heo",
    "grams": 40.0
   },
   {
    "name": "Tôm",
    "grams": 30.0
   },
   {
    "name": "Sườn heo",
    "grams": 30.0
   },
   {
    "name": "Nước lèo",
    "grams": 150.0
   },
   {
    "name": "Hẹ, giá",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000065",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Hủ tiếu sa tế bò",
  "ingredientsText": "Hủ tiếu, thịt bò, gia vị sa tế, lạc",
  "servingGrams": 450.0,
  "kcal": 490.0,
  "proteinG": 22.0,
  "fatG": 16.5,
  "carbG": 62.8,
  "fiberG": 1.8,
  "sodiumMg": 1280.0,
  "components": [
   {
    "name": "Hủ tiếu",
    "grams": 180.0
   },
   {
    "name": "Thịt bò",
    "grams": 60.0
   },
   {
    "name": "Sa tế",
    "grams": 15.0
   },
   {
    "name": "Lạc",
    "grams": 10.0
   },
   {
    "name": "Nước dùng",
    "grams": 165.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000066",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Mỳ Quảng gà",
  "ingredientsText": "Mỳ Quảng, thịt gà kho, bánh tráng, lạc",
  "servingGrams": 400.0,
  "kcal": 460.0,
  "proteinG": 21.2,
  "fatG": 14.5,
  "carbG": 61.0,
  "fiberG": 1.8,
  "sodiumMg": 1020.0,
  "components": [
   {
    "name": "Mỳ Quảng",
    "grams": 180.0
   },
   {
    "name": "Thịt gà kho",
    "grams": 70.0
   },
   {
    "name": "Bánh tráng nướng",
    "grams": 20.0
   },
   {
    "name": "Lạc rang",
    "grams": 10.0
   },
   {
    "name": "Nước nhưn",
    "grams": 90.0
   },
   {
    "name": "Rau sống",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000067",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Mỳ Quảng tôm thịt",
  "ingredientsText": "Mỳ Quảng, tôm, thịt heo kho, trứng cút",
  "servingGrams": 400.0,
  "kcal": 480.0,
  "proteinG": 22.5,
  "fatG": 16.0,
  "carbG": 61.5,
  "fiberG": 1.6,
  "sodiumMg": 1080.0,
  "components": [
   {
    "name": "Mỳ Quảng",
    "grams": 180.0
   },
   {
    "name": "Tôm",
    "grams": 35.0
   },
   {
    "name": "Thịt heo kho",
    "grams": 40.0
   },
   {
    "name": "Trứng cút",
    "grams": 20.0
   },
   {
    "name": "Bánh tráng",
    "grams": 15.0
   },
   {
    "name": "Nước nhưn",
    "grams": 80.0
   },
   {
    "name": "Rau",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000068",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Mỳ xào hải sản",
  "ingredientsText": "Mỳ sợi xào, tôm, mực, cải ngọt",
  "servingGrams": 350.0,
  "kcal": 510.0,
  "proteinG": 20.5,
  "fatG": 17.8,
  "carbG": 66.0,
  "fiberG": 2.0,
  "sodiumMg": 980.0,
  "components": [
   {
    "name": "Mỳ trứng",
    "grams": 180.0
   },
   {
    "name": "Tôm",
    "grams": 40.0
   },
   {
    "name": "Mực",
    "grams": 40.0
   },
   {
    "name": "Cải ngọt",
    "grams": 60.0
   },
   {
    "name": "Dầu ăn",
    "grams": 20.0
   },
   {
    "name": "Sốt dầu hàu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000069",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Mỳ hoành thánh tôm thịt",
  "ingredientsText": "Sợi mỳ vàng, hoành thánh, xá xíu",
  "servingGrams": 400.0,
  "kcal": 440.0,
  "proteinG": 19.2,
  "fatG": 12.5,
  "carbG": 62.5,
  "fiberG": 1.2,
  "sodiumMg": 1100.0,
  "components": [
   {
    "name": "Mỳ trứng",
    "grams": 150.0
   },
   {
    "name": "Hoành thánh",
    "grams": 60.0
   },
   {
    "name": "Xá xíu",
    "grams": 40.0
   },
   {
    "name": "Nước dùng",
    "grams": 130.0
   },
   {
    "name": "Cải, hẹ",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000070",
  "category": "Món Miến & Bánh Canh",
  "name": "Miến lươn nước",
  "ingredientsText": "Miến, lươn đồng chiên/xào, hành rau răm",
  "servingGrams": 450.0,
  "kcal": 390.0,
  "proteinG": 17.5,
  "fatG": 9.8,
  "carbG": 57.8,
  "fiberG": 0.8,
  "sodiumMg": 1050.0,
  "components": [
   {
    "name": "Miến",
    "grams": 150.0
   },
   {
    "name": "Lươn chiên",
    "grams": 60.0
   },
   {
    "name": "Nước dùng",
    "grams": 200.0
   },
   {
    "name": "Hành, rau răm, giá",
    "grams": 40.0
   }
  ]
 },
 {
  "code": "VPF-000071",
  "category": "Món Miến & Bánh Canh",
  "name": "Miến măng gà",
  "ingredientsText": "Miến, thịt gà, măng khô",
  "servingGrams": 450.0,
  "kcal": 385.0,
  "proteinG": 18.2,
  "fatG": 8.5,
  "carbG": 58.5,
  "fiberG": 2.1,
  "sodiumMg": 990.0,
  "components": [
   {
    "name": "Miến",
    "grams": 150.0
   },
   {
    "name": "Thịt gà",
    "grams": 60.0
   },
   {
    "name": "Măng khô (đã ngâm)",
    "grams": 50.0
   },
   {
    "name": "Nước dùng gà",
    "grams": 170.0
   },
   {
    "name": "Hành, rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000072",
  "category": "Món Miến & Bánh Canh",
  "name": "Miến xào cua",
  "ingredientsText": "Miến xào, thịt cua, giá đỗ, mộc nhĩ",
  "servingGrams": 300.0,
  "kcal": 420.0,
  "proteinG": 17.8,
  "fatG": 12.5,
  "carbG": 59.0,
  "fiberG": 2.2,
  "sodiumMg": 890.0,
  "components": [
   {
    "name": "Miến xào",
    "grams": 170.0
   },
   {
    "name": "Thịt cua",
    "grams": 50.0
   },
   {
    "name": "Giá đỗ",
    "grams": 40.0
   },
   {
    "name": "Mộc nhĩ",
    "grams": 15.0
   },
   {
    "name": "Dầu ăn",
    "grams": 15.0
   },
   {
    "name": "Hành",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000073",
  "category": "Món Miến & Bánh Canh",
  "name": "Bánh canh cua",
  "ingredientsText": "Bánh canh bột lọc, thịt cua, chả cá",
  "servingGrams": 450.0,
  "kcal": 395.0,
  "proteinG": 17.8,
  "fatG": 8.2,
  "carbG": 62.1,
  "fiberG": 0.9,
  "sodiumMg": 1050.0,
  "components": [
   {
    "name": "Bánh canh bột lọc",
    "grams": 200.0
   },
   {
    "name": "Thịt cua",
    "grams": 40.0
   },
   {
    "name": "Chả cá",
    "grams": 40.0
   },
   {
    "name": "Nước dùng",
    "grams": 150.0
   },
   {
    "name": "Hành, ngò",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000074",
  "category": "Món Miến & Bánh Canh",
  "name": "Bánh canh trảng bàng",
  "ingredientsText": "Bánh canh bột gạo, giò heo, thịt luộc",
  "servingGrams": 500.0,
  "kcal": 485.0,
  "proteinG": 23.0,
  "fatG": 15.2,
  "carbG": 63.8,
  "fiberG": 0.8,
  "sodiumMg": 1120.0,
  "components": [
   {
    "name": "Bánh canh bột gạo",
    "grams": 200.0
   },
   {
    "name": "Giò heo",
    "grams": 70.0
   },
   {
    "name": "Thịt luộc",
    "grams": 40.0
   },
   {
    "name": "Nước dùng",
    "grams": 170.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000075",
  "category": "Món Miến & Bánh Canh",
  "name": "Cao lầu Hội An",
  "ingredientsText": "Mỳ cao lầu, thịt xá xíu, bánh tráng chiên",
  "servingGrams": 350.0,
  "kcal": 465.0,
  "proteinG": 20.8,
  "fatG": 15.5,
  "carbG": 60.5,
  "fiberG": 1.5,
  "sodiumMg": 980.0,
  "components": [
   {
    "name": "Mỳ cao lầu",
    "grams": 180.0
   },
   {
    "name": "Xá xíu",
    "grams": 60.0
   },
   {
    "name": "Bánh tráng chiên",
    "grams": 15.0
   },
   {
    "name": "Nước sốt",
    "grams": 40.0
   },
   {
    "name": "Rau sống, giá",
    "grams": 55.0
   }
  ]
 },
 {
  "code": "VPF-000076",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt lợn kho tàu với trứng",
  "ingredientsText": "Thịt ba chỉ, trứng vịt, nước mắm",
  "servingGrams": 130.0,
  "kcal": 315.0,
  "proteinG": 15.8,
  "fatG": 24.5,
  "carbG": 7.8,
  "fiberG": null,
  "sodiumMg": 780.0,
  "components": [
   {
    "name": "Thịt ba chỉ",
    "grams": 80.0
   },
   {
    "name": "Trứng vịt",
    "grams": 40.0
   },
   {
    "name": "Nước mắm, đường, nước dừa",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000077",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt lợn luộc nạc mông",
  "ingredientsText": "Thịt heo nạc tươi",
  "servingGrams": 100.0,
  "kcal": 139.0,
  "proteinG": 19.0,
  "fatG": 7.0,
  "carbG": 0.0,
  "fiberG": null,
  "sodiumMg": 65.0,
  "components": [
   {
    "name": "Thịt heo nạc tươi",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000078",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Sườn lợn xào chua ngọt",
  "ingredientsText": "Sườn heo, dứa, cà chua, giấm",
  "servingGrams": 150.0,
  "kcal": 295.0,
  "proteinG": 14.5,
  "fatG": 18.2,
  "carbG": 18.0,
  "fiberG": 0.8,
  "sodiumMg": 620.0,
  "components": [
   {
    "name": "Sườn heo",
    "grams": 100.0
   },
   {
    "name": "Dứa",
    "grams": 20.0
   },
   {
    "name": "Cà chua",
    "grams": 15.0
   },
   {
    "name": "Giấm, đường, dầu",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000079",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Chả lá lốt rán",
  "ingredientsText": "Thịt heo băm, lá lốt, dầu ăn",
  "servingGrams": 100.0,
  "kcal": 235.0,
  "proteinG": 13.2,
  "fatG": 18.6,
  "carbG": 3.5,
  "fiberG": 0.9,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Thịt heo băm",
    "grams": 70.0
   },
   {
    "name": "Lá lốt",
    "grams": 15.0
   },
   {
    "name": "Dầu ăn",
    "grams": 10.0
   },
   {
    "name": "Hành, gia vị",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000080",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt lợn rang cháy cạnh",
  "ingredientsText": "Thịt ba chỉ, hành khô, nước mắm",
  "servingGrams": 110.0,
  "kcal": 328.0,
  "proteinG": 15.2,
  "fatG": 28.0,
  "carbG": 4.2,
  "fiberG": null,
  "sodiumMg": 690.0,
  "components": [
   {
    "name": "Thịt ba chỉ",
    "grams": 95.0
   },
   {
    "name": "Hành khô",
    "grams": 8.0
   },
   {
    "name": "Nước mắm, đường",
    "grams": 7.0
   }
  ]
 },
 {
  "code": "VPF-000081",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt lợn kho tiêu",
  "ingredientsText": "Thịt nạc thăn, tiêu đen",
  "servingGrams": 110.0,
  "kcal": 185.0,
  "proteinG": 19.5,
  "fatG": 9.8,
  "carbG": 4.5,
  "fiberG": 0.3,
  "sodiumMg": 720.0,
  "components": [
   {
    "name": "Thịt nạc thăn",
    "grams": 95.0
   },
   {
    "name": "Nước mắm, đường",
    "grams": 12.0
   },
   {
    "name": "Tiêu đen, hành",
    "grams": 3.0
   }
  ]
 },
 {
  "code": "VPF-000082",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Giò lụa (Chả lụa)",
  "ingredientsText": "Thịt heo quết mịn, nước mắm",
  "servingGrams": 100.0,
  "kcal": 230.0,
  "proteinG": 15.2,
  "fatG": 17.5,
  "carbG": 2.8,
  "fiberG": null,
  "sodiumMg": 850.0,
  "components": [
   {
    "name": "Thịt heo nạc quết",
    "grams": 92.0
   },
   {
    "name": "Nước mắm",
    "grams": 5.0
   },
   {
    "name": "Bột năng",
    "grams": 3.0
   }
  ]
 },
 {
  "code": "VPF-000083",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Chả giò (Nem rán)",
  "ingredientsText": "Bánh đa nem, thịt heo băm, miến",
  "servingGrams": 100.0,
  "kcal": 285.0,
  "proteinG": 9.5,
  "fatG": 17.2,
  "carbG": 23.0,
  "fiberG": 0.8,
  "sodiumMg": 430.0,
  "components": [
   {
    "name": "Thịt heo băm",
    "grams": 45.0
   },
   {
    "name": "Bánh đa nem",
    "grams": 15.0
   },
   {
    "name": "Miến",
    "grams": 10.0
   },
   {
    "name": "Mộc nhĩ, nấm",
    "grams": 8.0
   },
   {
    "name": "Trứng",
    "grams": 7.0
   },
   {
    "name": "Cà rốt, hành",
    "grams": 5.0
   },
   {
    "name": "Dầu (thấm)",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000084",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt chân giò hầm măng",
  "ingredientsText": "Chân giò heo, măng khô",
  "servingGrams": 200.0,
  "kcal": 380.0,
  "proteinG": 21.0,
  "fatG": 28.5,
  "carbG": 8.5,
  "fiberG": 2.1,
  "sodiumMg": 790.0,
  "components": [
   {
    "name": "Chân giò heo",
    "grams": 130.0
   },
   {
    "name": "Măng khô (đã ngâm)",
    "grams": 60.0
   },
   {
    "name": "Hành, gia vị",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000085",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt quay giòn bì",
  "ingredientsText": "Thịt ba chỉ quay",
  "servingGrams": 100.0,
  "kcal": 350.0,
  "proteinG": 14.8,
  "fatG": 31.0,
  "carbG": 2.5,
  "fiberG": null,
  "sodiumMg": 590.0,
  "components": [
   {
    "name": "Thịt ba chỉ quay",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000086",
  "category": "Món Mặn - Thịt Bò",
  "name": "Thịt bò xào cần tây tỏi tây",
  "ingredientsText": "Thịt bò thăn, cần tây, tỏi tây",
  "servingGrams": 155.0,
  "kcal": 182.0,
  "proteinG": 16.5,
  "fatG": 10.2,
  "carbG": 6.1,
  "fiberG": 1.4,
  "sodiumMg": 420.0,
  "components": [
   {
    "name": "Thịt bò thăn",
    "grams": 80.0
   },
   {
    "name": "Cần tây",
    "grams": 40.0
   },
   {
    "name": "Tỏi tây",
    "grams": 25.0
   },
   {
    "name": "Dầu, tỏi",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000087",
  "category": "Món Mặn - Thịt Bò",
  "name": "Bò sốt vang",
  "ingredientsText": "Thịt nạm bò, rượu vang, cà rốt",
  "servingGrams": 200.0,
  "kcal": 285.0,
  "proteinG": 18.2,
  "fatG": 16.5,
  "carbG": 15.8,
  "fiberG": 1.6,
  "sodiumMg": 750.0,
  "components": [
   {
    "name": "Thịt nạm bò",
    "grams": 120.0
   },
   {
    "name": "Cà rốt",
    "grams": 40.0
   },
   {
    "name": "Rượu vang + sốt",
    "grams": 30.0
   },
   {
    "name": "Hành tây, sả",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000088",
  "category": "Món Mặn - Thịt Bò",
  "name": "Bò lúc lắc",
  "ingredientsText": "Thịt bò thăn, ớt đà lạt, hành tây",
  "servingGrams": 180.0,
  "kcal": 260.0,
  "proteinG": 21.0,
  "fatG": 15.8,
  "carbG": 8.5,
  "fiberG": 1.2,
  "sodiumMg": 620.0,
  "components": [
   {
    "name": "Thịt bò thăn",
    "grams": 120.0
   },
   {
    "name": "Ớt chuông",
    "grams": 25.0
   },
   {
    "name": "Hành tây",
    "grams": 25.0
   },
   {
    "name": "Bơ, dầu, tỏi",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000089",
  "category": "Món Mặn - Thịt Bò",
  "name": "Thịt bò xào thiên lý",
  "ingredientsText": "Thịt bò, hoa thiên lý tươi",
  "servingGrams": 150.0,
  "kcal": 160.0,
  "proteinG": 16.5,
  "fatG": 8.2,
  "carbG": 4.2,
  "fiberG": 1.6,
  "sodiumMg": 410.0,
  "components": [
   {
    "name": "Thịt bò",
    "grams": 80.0
   },
   {
    "name": "Hoa thiên lý",
    "grams": 60.0
   },
   {
    "name": "Dầu, tỏi",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000090",
  "category": "Món Mặn - Gia Cầm",
  "name": "Thịt gà luộc đùi có da",
  "ingredientsText": "Thịt đùi gà ta có da",
  "servingGrams": 100.0,
  "kcal": 211.0,
  "proteinG": 19.2,
  "fatG": 14.8,
  "carbG": 0.0,
  "fiberG": null,
  "sodiumMg": 75.0,
  "components": [
   {
    "name": "Thịt đùi gà ta có da",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000091",
  "category": "Món Mặn - Gia Cầm",
  "name": "Thịt gà kho sả ớt",
  "ingredientsText": "Thịt gà, sả, ớt, nước mắm",
  "servingGrams": 120.0,
  "kcal": 235.0,
  "proteinG": 18.6,
  "fatG": 15.2,
  "carbG": 5.8,
  "fiberG": 0.8,
  "sodiumMg": 680.0,
  "components": [
   {
    "name": "Thịt gà",
    "grams": 100.0
   },
   {
    "name": "Sả",
    "grams": 8.0
   },
   {
    "name": "Ớt",
    "grams": 2.0
   },
   {
    "name": "Nước mắm, đường, dầu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000092",
  "category": "Món Mặn - Gia Cầm",
  "name": "Gà chiên nước mắm",
  "ingredientsText": "Thịt gà, nước mắm, đường, tỏi",
  "servingGrams": 130.0,
  "kcal": 310.0,
  "proteinG": 20.2,
  "fatG": 21.5,
  "carbG": 8.8,
  "fiberG": null,
  "sodiumMg": 890.0,
  "components": [
   {
    "name": "Thịt gà",
    "grams": 110.0
   },
   {
    "name": "Nước mắm",
    "grams": 6.0
   },
   {
    "name": "Đường",
    "grams": 6.0
   },
   {
    "name": "Tỏi",
    "grams": 3.0
   },
   {
    "name": "Dầu (thấm)",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000093",
  "category": "Món Mặn - Gia Cầm",
  "name": "Thịt vịt luộc",
  "ingredientsText": "Thịt vịt tươi có da",
  "servingGrams": 100.0,
  "kcal": 267.0,
  "proteinG": 17.8,
  "fatG": 21.8,
  "carbG": 0.0,
  "fiberG": null,
  "sodiumMg": 70.0,
  "components": [
   {
    "name": "Thịt vịt tươi có da",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000094",
  "category": "Món Mặn - Gia Cầm",
  "name": "Vịt om sấu",
  "ingredientsText": "Thịt vịt, quả sấu, khoai sọ",
  "servingGrams": 250.0,
  "kcal": 365.0,
  "proteinG": 20.4,
  "fatG": 24.2,
  "carbG": 16.5,
  "fiberG": 1.8,
  "sodiumMg": 820.0,
  "components": [
   {
    "name": "Thịt vịt",
    "grams": 130.0
   },
   {
    "name": "Quả sấu",
    "grams": 30.0
   },
   {
    "name": "Khoai sọ",
    "grams": 60.0
   },
   {
    "name": "Nước om",
    "grams": 25.0
   },
   {
    "name": "Rau",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000095",
  "category": "Món Mặn - Gia Cầm",
  "name": "Vịt quay Bắc Kinh",
  "ingredientsText": "Thịt vịt quay có da giòn",
  "servingGrams": 120.0,
  "kcal": 380.0,
  "proteinG": 18.5,
  "fatG": 32.0,
  "carbG": 4.5,
  "fiberG": null,
  "sodiumMg": 650.0,
  "components": [
   {
    "name": "Thịt vịt quay có da",
    "grams": 110.0
   },
   {
    "name": "Bánh/sốt chấm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000096",
  "category": "Món Mặn - Gia Cầm",
  "name": "Chim cút quay",
  "ingredientsText": "Chim cút, gia vị, mật ong",
  "servingGrams": 100.0,
  "kcal": 254.0,
  "proteinG": 21.5,
  "fatG": 17.8,
  "carbG": 2.1,
  "fiberG": null,
  "sodiumMg": 450.0,
  "components": [
   {
    "name": "Chim cút",
    "grams": 90.0
   },
   {
    "name": "Mật ong",
    "grams": 5.0
   },
   {
    "name": "Gia vị",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000097",
  "category": "Món Mặn - Gia Cầm",
  "name": "Ngan luộc chấm mắm tôm",
  "ingredientsText": "Thịt ngan tươi luộc",
  "servingGrams": 100.0,
  "kcal": 245.0,
  "proteinG": 18.5,
  "fatG": 18.2,
  "carbG": 0.0,
  "fiberG": null,
  "sodiumMg": 95.0,
  "components": [
   {
    "name": "Thịt ngan luộc",
    "grams": 90.0
   },
   {
    "name": "Mắm tôm pha",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000098",
  "category": "Món Mặn - Gia Cầm",
  "name": "Bồ câu quay giòn",
  "ingredientsText": "Thịt bồ câu, ngũ vị hương",
  "servingGrams": 100.0,
  "kcal": 235.0,
  "proteinG": 20.2,
  "fatG": 16.0,
  "carbG": 1.5,
  "fiberG": null,
  "sodiumMg": 420.0,
  "components": [
   {
    "name": "Thịt bồ câu",
    "grams": 95.0
   },
   {
    "name": "Ngũ vị hương, gia vị",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000099",
  "category": "Món Mặn - Gia Cầm",
  "name": "Trứng gà kho thịt ba chỉ",
  "ingredientsText": "Trứng gà luộc, thịt ba chỉ kho",
  "servingGrams": 130.0,
  "kcal": 290.0,
  "proteinG": 14.8,
  "fatG": 22.0,
  "carbG": 7.2,
  "fiberG": null,
  "sodiumMg": 760.0,
  "components": [
   {
    "name": "Trứng gà luộc",
    "grams": 50.0
   },
   {
    "name": "Thịt ba chỉ",
    "grams": 65.0
   },
   {
    "name": "Nước kho",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000100",
  "category": "Món Mặn - Gia Cầm",
  "name": "Trứng đúc thịt nướng",
  "ingredientsText": "Trứng gà, thịt heo băm, mộc nhĩ",
  "servingGrams": 110.0,
  "kcal": 210.0,
  "proteinG": 13.5,
  "fatG": 15.2,
  "carbG": 3.8,
  "fiberG": 0.5,
  "sodiumMg": 580.0,
  "components": [
   {
    "name": "Trứng gà",
    "grams": 60.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 40.0
   },
   {
    "name": "Mộc nhĩ",
    "grams": 5.0
   },
   {
    "name": "Dầu",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000101",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá lóc kho tộ",
  "ingredientsText": "Thịt cá lóc, nước mắm, đường",
  "servingGrams": 110.0,
  "kcal": 165.0,
  "proteinG": 18.2,
  "fatG": 7.5,
  "carbG": 6.2,
  "fiberG": null,
  "sodiumMg": 850.0,
  "components": [
   {
    "name": "Thịt cá lóc",
    "grams": 95.0
   },
   {
    "name": "Nước mắm",
    "grams": 6.0
   },
   {
    "name": "Đường, hành, tiêu",
    "grams": 9.0
   }
  ]
 },
 {
  "code": "VPF-000102",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá chép rán giòn",
  "ingredientsText": "Cá chép khúc, dầu chiên",
  "servingGrams": 100.0,
  "kcal": 218.0,
  "proteinG": 16.0,
  "fatG": 17.0,
  "carbG": 0.0,
  "fiberG": null,
  "sodiumMg": 90.0,
  "components": [
   {
    "name": "Cá chép khúc",
    "grams": 90.0
   },
   {
    "name": "Dầu (thấm)",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000103",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá thu sốt cà chua",
  "ingredientsText": "Cá thu khúc, cà chua, hành lá",
  "servingGrams": 160.0,
  "kcal": 245.0,
  "proteinG": 20.5,
  "fatG": 14.2,
  "carbG": 8.5,
  "fiberG": 0.8,
  "sodiumMg": 580.0,
  "components": [
   {
    "name": "Cá thu khúc",
    "grams": 110.0
   },
   {
    "name": "Cà chua",
    "grams": 35.0
   },
   {
    "name": "Hành lá, dầu",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000104",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá bống kho tiêu",
  "ingredientsText": "Cá bống nhỏ, tiêu đen",
  "servingGrams": 100.0,
  "kcal": 145.0,
  "proteinG": 17.2,
  "fatG": 5.2,
  "carbG": 7.1,
  "fiberG": null,
  "sodiumMg": 920.0,
  "components": [
   {
    "name": "Cá bống",
    "grams": 85.0
   },
   {
    "name": "Nước mắm, đường",
    "grams": 12.0
   },
   {
    "name": "Tiêu đen",
    "grams": 3.0
   }
  ]
 },
 {
  "code": "VPF-000105",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá trắm kho riềng",
  "ingredientsText": "Cá trắm khúc, riềng củ, nước mắm",
  "servingGrams": 120.0,
  "kcal": 175.0,
  "proteinG": 18.0,
  "fatG": 8.5,
  "carbG": 5.2,
  "fiberG": 0.6,
  "sodiumMg": 890.0,
  "components": [
   {
    "name": "Cá trắm khúc",
    "grams": 100.0
   },
   {
    "name": "Riềng",
    "grams": 10.0
   },
   {
    "name": "Nước mắm, đường",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000106",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá rô đồng chiên giòn",
  "ingredientsText": "Cá rô đồng nguyên con chiên",
  "servingGrams": 100.0,
  "kcal": 235.0,
  "proteinG": 18.5,
  "fatG": 16.8,
  "carbG": 0.0,
  "fiberG": null,
  "sodiumMg": 320.0,
  "components": [
   {
    "name": "Cá rô đồng",
    "grams": 90.0
   },
   {
    "name": "Dầu (thấm)",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000107",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá chép om dưa",
  "ingredientsText": "Cá chép khúc, dưa chua, cà chua",
  "servingGrams": 200.0,
  "kcal": 190.0,
  "proteinG": 17.2,
  "fatG": 8.8,
  "carbG": 9.5,
  "fiberG": 1.5,
  "sodiumMg": 850.0,
  "components": [
   {
    "name": "Cá chép khúc",
    "grams": 110.0
   },
   {
    "name": "Dưa chua",
    "grams": 50.0
   },
   {
    "name": "Cà chua",
    "grams": 30.0
   },
   {
    "name": "Hành, thì là",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000108",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá ngừ kho thơm (dứa)",
  "ingredientsText": "Cá ngừ khúc, dứa tươi, ớt",
  "servingGrams": 140.0,
  "kcal": 185.0,
  "proteinG": 20.8,
  "fatG": 7.5,
  "carbG": 8.2,
  "fiberG": 0.9,
  "sodiumMg": 790.0,
  "components": [
   {
    "name": "Cá ngừ khúc",
    "grams": 100.0
   },
   {
    "name": "Dứa",
    "grams": 30.0
   },
   {
    "name": "Ớt, nước mắm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000109",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá nục sốt cà chua",
  "ingredientsText": "Cá nục, cà chua, hành lá",
  "servingGrams": 150.0,
  "kcal": 190.0,
  "proteinG": 18.5,
  "fatG": 9.2,
  "carbG": 7.5,
  "fiberG": 0.8,
  "sodiumMg": 680.0,
  "components": [
   {
    "name": "Cá nục",
    "grams": 105.0
   },
   {
    "name": "Cà chua",
    "grams": 35.0
   },
   {
    "name": "Hành lá, dầu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000110",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá kèo kho rau răm",
  "ingredientsText": "Cá kèo, rau răm, nước mắm",
  "servingGrams": 110.0,
  "kcal": 160.0,
  "proteinG": 16.5,
  "fatG": 7.8,
  "carbG": 5.2,
  "fiberG": 0.5,
  "sodiumMg": 830.0,
  "components": [
   {
    "name": "Cá kèo",
    "grams": 95.0
   },
   {
    "name": "Rau răm",
    "grams": 5.0
   },
   {
    "name": "Nước mắm, đường",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000111",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá hồi áp chảo bơ tỏi",
  "ingredientsText": "Thịt cá hồi, bơ tỏi, chanh",
  "servingGrams": 120.0,
  "kcal": 265.0,
  "proteinG": 20.8,
  "fatG": 18.5,
  "carbG": 3.2,
  "fiberG": null,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Thịt cá hồi",
    "grams": 105.0
   },
   {
    "name": "Bơ",
    "grams": 8.0
   },
   {
    "name": "Tỏi, chanh",
    "grams": 7.0
   }
  ]
 },
 {
  "code": "VPF-000112",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Chả cá thát lát chiên",
  "ingredientsText": "Thịt cá thát lát quết, thì là",
  "servingGrams": 100.0,
  "kcal": 215.0,
  "proteinG": 17.5,
  "fatG": 14.8,
  "carbG": 2.8,
  "fiberG": 0.3,
  "sodiumMg": 780.0,
  "components": [
   {
    "name": "Thịt cá thát lát quết",
    "grams": 85.0
   },
   {
    "name": "Thì là",
    "grams": 5.0
   },
   {
    "name": "Dầu (thấm)",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000113",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Chả cá Lăng Hà Nội",
  "ingredientsText": "Cá lăng, thì là, mắm tôm",
  "servingGrams": 150.0,
  "kcal": 260.0,
  "proteinG": 18.5,
  "fatG": 18.2,
  "carbG": 5.5,
  "fiberG": 0.8,
  "sodiumMg": 780.0,
  "components": [
   {
    "name": "Cá lăng",
    "grams": 100.0
   },
   {
    "name": "Thì là, hành",
    "grams": 25.0
   },
   {
    "name": "Dầu",
    "grams": 15.0
   },
   {
    "name": "Mắm tôm pha",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000114",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Tôm đồng rim mặn ngọt",
  "ingredientsText": "Tôm đồng nguyên vỏ, đường, mắm",
  "servingGrams": 90.0,
  "kcal": 142.0,
  "proteinG": 16.8,
  "fatG": 5.8,
  "carbG": 5.6,
  "fiberG": null,
  "sodiumMg": 690.0,
  "components": [
   {
    "name": "Tôm đồng nguyên vỏ",
    "grams": 80.0
   },
   {
    "name": "Đường, nước mắm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000115",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Tôm sú hấp bia",
  "ingredientsText": "Tôm sú tươi, bia, sả",
  "servingGrams": 100.0,
  "kcal": 115.0,
  "proteinG": 20.1,
  "fatG": 1.8,
  "carbG": 3.5,
  "fiberG": null,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Tôm sú",
    "grams": 90.0
   },
   {
    "name": "Sả",
    "grams": 5.0
   },
   {
    "name": "Bia (thấm)",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000116",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Tôm nướng muối ớt",
  "ingredientsText": "Tôm sú, muối ớt",
  "servingGrams": 100.0,
  "kcal": 125.0,
  "proteinG": 19.5,
  "fatG": 2.2,
  "carbG": 6.8,
  "fiberG": null,
  "sodiumMg": 810.0,
  "components": [
   {
    "name": "Tôm sú",
    "grams": 95.0
   },
   {
    "name": "Muối ớt",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000117",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Tôm lăn bột chiên xù",
  "ingredientsText": "Tôm tươi, bột chiên xù",
  "servingGrams": 120.0,
  "kcal": 245.0,
  "proteinG": 15.2,
  "fatG": 14.0,
  "carbG": 14.5,
  "fiberG": 0.4,
  "sodiumMg": 580.0,
  "components": [
   {
    "name": "Tôm tươi",
    "grams": 85.0
   },
   {
    "name": "Bột chiên xù",
    "grams": 20.0
   },
   {
    "name": "Dầu (thấm)",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000118",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Mực xào sa tế",
  "ingredientsText": "Mực tươi, sa tế, hành tây",
  "servingGrams": 150.0,
  "kcal": 168.0,
  "proteinG": 17.2,
  "fatG": 6.5,
  "carbG": 9.8,
  "fiberG": 0.9,
  "sodiumMg": 720.0,
  "components": [
   {
    "name": "Mực tươi",
    "grams": 110.0
   },
   {
    "name": "Hành tây",
    "grams": 25.0
   },
   {
    "name": "Sa tế, dầu",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000119",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Mực nhồi thịt chiên",
  "ingredientsText": "Mực ống, thịt heo băm",
  "servingGrams": 150.0,
  "kcal": 230.0,
  "proteinG": 19.8,
  "fatG": 13.5,
  "carbG": 7.2,
  "fiberG": 0.4,
  "sodiumMg": 680.0,
  "components": [
   {
    "name": "Mực ống",
    "grams": 90.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 45.0
   },
   {
    "name": "Dầu (thấm)",
    "grams": 10.0
   },
   {
    "name": "Mộc nhĩ, hành",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000120",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Mực xào dứa (thơm)",
  "ingredientsText": "Mực tươi, dứa chín",
  "servingGrams": 150.0,
  "kcal": 130.0,
  "proteinG": 16.0,
  "fatG": 3.5,
  "carbG": 8.5,
  "fiberG": 0.9,
  "sodiumMg": 520.0,
  "components": [
   {
    "name": "Mực tươi",
    "grams": 100.0
   },
   {
    "name": "Dứa chín",
    "grams": 40.0
   },
   {
    "name": "Dầu, hành",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000121",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cua biển hấp",
  "ingredientsText": "Thịt cua biển",
  "servingGrams": 100.0,
  "kcal": 103.0,
  "proteinG": 17.5,
  "fatG": 0.6,
  "carbG": 7.0,
  "fiberG": null,
  "sodiumMg": 316.0,
  "components": [
   {
    "name": "Thịt cua biển",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000122",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cua rang me",
  "ingredientsText": "Cua biển, sốt me chua ngọt",
  "servingGrams": 150.0,
  "kcal": 185.0,
  "proteinG": 18.2,
  "fatG": 6.5,
  "carbG": 13.5,
  "fiberG": 0.8,
  "sodiumMg": 680.0,
  "components": [
   {
    "name": "Cua biển (phần ăn được)",
    "grams": 110.0
   },
   {
    "name": "Sốt me chua ngọt",
    "grams": 40.0
   }
  ]
 },
 {
  "code": "VPF-000123",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Ghẹ hấp sả",
  "ingredientsText": "Thịt ghẹ biển, sả tươi",
  "servingGrams": 120.0,
  "kcal": 115.0,
  "proteinG": 19.2,
  "fatG": 1.2,
  "carbG": 5.8,
  "fiberG": null,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Thịt ghẹ",
    "grams": 110.0
   },
   {
    "name": "Sả",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000124",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Nghêu hấp sả",
  "ingredientsText": "Thịt nghêu, sả, ớt",
  "servingGrams": 150.0,
  "kcal": 95.0,
  "proteinG": 12.8,
  "fatG": 1.8,
  "carbG": 6.5,
  "fiberG": 0.3,
  "sodiumMg": 650.0,
  "components": [
   {
    "name": "Thịt nghêu",
    "grams": 120.0
   },
   {
    "name": "Sả, ớt",
    "grams": 15.0
   },
   {
    "name": "Nước hấp",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000125",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Sò huyết xào me",
  "ingredientsText": "Thịt sò huyết, sốt me",
  "servingGrams": 120.0,
  "kcal": 145.0,
  "proteinG": 13.5,
  "fatG": 4.2,
  "carbG": 13.2,
  "fiberG": 0.8,
  "sodiumMg": 590.0,
  "components": [
   {
    "name": "Thịt sò huyết",
    "grams": 90.0
   },
   {
    "name": "Sốt me",
    "grams": 25.0
   },
   {
    "name": "Tỏi, dầu",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000126",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Hàu nướng mỡ hành",
  "ingredientsText": "Thịt hàu, mỡ hành, lạc rang",
  "servingGrams": 120.0,
  "kcal": 185.0,
  "proteinG": 11.8,
  "fatG": 12.5,
  "carbG": 6.2,
  "fiberG": 0.6,
  "sodiumMg": 510.0,
  "components": [
   {
    "name": "Thịt hàu",
    "grams": 95.0
   },
   {
    "name": "Mỡ hành",
    "grams": 15.0
   },
   {
    "name": "Lạc rang",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000127",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Ốc hương xào bơ tỏi",
  "ingredientsText": "Thịt ốc hương, bơ, tỏi",
  "servingGrams": 130.0,
  "kcal": 195.0,
  "proteinG": 15.2,
  "fatG": 12.0,
  "carbG": 6.5,
  "fiberG": 0.3,
  "sodiumMg": 590.0,
  "components": [
   {
    "name": "Thịt ốc hương",
    "grams": 110.0
   },
   {
    "name": "Bơ",
    "grams": 10.0
   },
   {
    "name": "Tỏi",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000128",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Ốc móng tay xào rau muống",
  "ingredientsText": "Ốc móng tay, rau muống",
  "servingGrams": 160.0,
  "kcal": 150.0,
  "proteinG": 14.8,
  "fatG": 6.2,
  "carbG": 8.2,
  "fiberG": 1.4,
  "sodiumMg": 520.0,
  "components": [
   {
    "name": "Ốc móng tay",
    "grams": 80.0
   },
   {
    "name": "Rau muống",
    "grams": 70.0
   },
   {
    "name": "Tỏi, dầu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000129",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Ốc len xào dừa",
  "ingredientsText": "Thịt ốc len, nước cốt dừa",
  "servingGrams": 150.0,
  "kcal": 210.0,
  "proteinG": 11.2,
  "fatG": 15.5,
  "carbG": 6.8,
  "fiberG": 0.5,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Thịt ốc len",
    "grams": 100.0
   },
   {
    "name": "Nước cốt dừa",
    "grams": 40.0
   },
   {
    "name": "Sả, ớt",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000130",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Bạch tuộc nướng sa tế",
  "ingredientsText": "Bạch tuộc, sa tế, ớt",
  "servingGrams": 120.0,
  "kcal": 160.0,
  "proteinG": 18.2,
  "fatG": 5.5,
  "carbG": 8.5,
  "fiberG": 0.4,
  "sodiumMg": 650.0,
  "components": [
   {
    "name": "Bạch tuộc",
    "grams": 105.0
   },
   {
    "name": "Sa tế, ớt",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000131",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Lươn om chuối đậu",
  "ingredientsText": "Thịt lươn, chuối xanh, đậu hũ",
  "servingGrams": 220.0,
  "kcal": 285.0,
  "proteinG": 18.5,
  "fatG": 14.2,
  "carbG": 20.5,
  "fiberG": 2.8,
  "sodiumMg": 780.0,
  "components": [
   {
    "name": "Thịt lươn",
    "grams": 90.0
   },
   {
    "name": "Chuối xanh",
    "grams": 60.0
   },
   {
    "name": "Đậu hũ",
    "grams": 50.0
   },
   {
    "name": "Mẻ, nghệ, tía tô",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000132",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Ếch xào sa tế",
  "ingredientsText": "Thịt đùi ếch, sa tế, hành tây",
  "servingGrams": 140.0,
  "kcal": 175.0,
  "proteinG": 18.0,
  "fatG": 7.8,
  "carbG": 7.5,
  "fiberG": 0.8,
  "sodiumMg": 590.0,
  "components": [
   {
    "name": "Thịt đùi ếch",
    "grams": 100.0
   },
   {
    "name": "Hành tây",
    "grams": 25.0
   },
   {
    "name": "Sa tế, dầu",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000133",
  "category": "Món Rau & Xào",
  "name": "Rau muống xào tỏi",
  "ingredientsText": "Rau muống, tỏi, dầu ăn",
  "servingGrams": 170.0,
  "kcal": 132.0,
  "proteinG": 4.8,
  "fatG": 10.2,
  "carbG": 5.2,
  "fiberG": 1.5,
  "sodiumMg": 310.0,
  "components": [
   {
    "name": "Rau muống",
    "grams": 150.0
   },
   {
    "name": "Tỏi",
    "grams": 8.0
   },
   {
    "name": "Dầu ăn",
    "grams": 12.0
   }
  ]
 },
 {
  "code": "VPF-000134",
  "category": "Món Rau & Xào",
  "name": "Rau cải ngọt luộc",
  "ingredientsText": "Rau cải ngọt tươi",
  "servingGrams": 150.0,
  "kcal": 24.0,
  "proteinG": 2.6,
  "fatG": 0.3,
  "carbG": 2.7,
  "fiberG": 1.8,
  "sodiumMg": 45.0,
  "components": [
   {
    "name": "Rau cải ngọt tươi",
    "grams": 150.0
   }
  ]
 },
 {
  "code": "VPF-000135",
  "category": "Món Rau & Xào",
  "name": "Súp lơ xào thịt bò",
  "ingredientsText": "Súp lơ xanh, thịt bò thăn",
  "servingGrams": 150.0,
  "kcal": 145.0,
  "proteinG": 12.5,
  "fatG": 7.8,
  "carbG": 6.2,
  "fiberG": 2.1,
  "sodiumMg": 380.0,
  "components": [
   {
    "name": "Súp lơ xanh",
    "grams": 90.0
   },
   {
    "name": "Thịt bò thăn",
    "grams": 50.0
   },
   {
    "name": "Dầu, tỏi",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000136",
  "category": "Món Rau & Xào",
  "name": "Nộm hoa chuối tai heo",
  "ingredientsText": "Hoa chuối, tai heo, lạc rang",
  "servingGrams": 150.0,
  "kcal": 185.0,
  "proteinG": 8.5,
  "fatG": 11.2,
  "carbG": 12.5,
  "fiberG": 3.2,
  "sodiumMg": 490.0,
  "components": [
   {
    "name": "Hoa chuối",
    "grams": 80.0
   },
   {
    "name": "Tai heo",
    "grams": 40.0
   },
   {
    "name": "Lạc rang",
    "grams": 10.0
   },
   {
    "name": "Rau thơm",
    "grams": 10.0
   },
   {
    "name": "Nước trộn",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000137",
  "category": "Món Rau & Xào",
  "name": "Đậu hũ sốt cà chua",
  "ingredientsText": "Đậu hũ phụ, cà chua, dầu ăn",
  "servingGrams": 155.0,
  "kcal": 138.0,
  "proteinG": 10.2,
  "fatG": 8.6,
  "carbG": 5.1,
  "fiberG": 0.9,
  "sodiumMg": 380.0,
  "components": [
   {
    "name": "Đậu hũ",
    "grams": 100.0
   },
   {
    "name": "Cà chua",
    "grams": 40.0
   },
   {
    "name": "Dầu ăn",
    "grams": 10.0
   },
   {
    "name": "Hành",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000138",
  "category": "Món Rau & Xào",
  "name": "Khổ qua xào trứng",
  "ingredientsText": "Khổ qua, trứng gà tươi",
  "servingGrams": 140.0,
  "kcal": 112.0,
  "proteinG": 6.8,
  "fatG": 7.2,
  "carbG": 5.0,
  "fiberG": 1.4,
  "sodiumMg": 290.0,
  "components": [
   {
    "name": "Khổ qua",
    "grams": 90.0
   },
   {
    "name": "Trứng gà",
    "grams": 40.0
   },
   {
    "name": "Dầu ăn",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000139",
  "category": "Món Rau & Xào",
  "name": "Ngọn su su xào tỏi",
  "ingredientsText": "Ngọn su su tươi, tỏi",
  "servingGrams": 150.0,
  "kcal": 98.0,
  "proteinG": 3.2,
  "fatG": 6.5,
  "carbG": 4.8,
  "fiberG": 2.2,
  "sodiumMg": 280.0,
  "components": [
   {
    "name": "Ngọn su su",
    "grams": 140.0
   },
   {
    "name": "Tỏi",
    "grams": 3.0
   },
   {
    "name": "Dầu ăn",
    "grams": 7.0
   }
  ]
 },
 {
  "code": "VPF-000140",
  "category": "Món Rau & Xào",
  "name": "Cần tây xào thịt bò",
  "ingredientsText": "Cần tây tươi, thịt bò",
  "servingGrams": 150.0,
  "kcal": 135.0,
  "proteinG": 11.8,
  "fatG": 6.2,
  "carbG": 5.5,
  "fiberG": 1.8,
  "sodiumMg": 390.0,
  "components": [
   {
    "name": "Cần tây",
    "grams": 80.0
   },
   {
    "name": "Thịt bò",
    "grams": 60.0
   },
   {
    "name": "Dầu, tỏi",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000141",
  "category": "Món Canh & Súp",
  "name": "Canh chua cá lóc",
  "ingredientsText": "Cá lóc, dứa, cà chua, giá đỗ",
  "servingGrams": 250.0,
  "kcal": 118.0,
  "proteinG": 10.5,
  "fatG": 4.2,
  "carbG": 9.6,
  "fiberG": 1.6,
  "sodiumMg": 520.0,
  "components": [
   {
    "name": "Cá lóc",
    "grams": 50.0
   },
   {
    "name": "Dứa",
    "grams": 20.0
   },
   {
    "name": "Cà chua",
    "grams": 20.0
   },
   {
    "name": "Giá đỗ",
    "grams": 15.0
   },
   {
    "name": "Dọc mùng, rau",
    "grams": 15.0
   },
   {
    "name": "Nước canh",
    "grams": 130.0
   }
  ]
 },
 {
  "code": "VPF-000142",
  "category": "Món Canh & Súp",
  "name": "Canh bí đỏ thịt băm",
  "ingredientsText": "Bí đỏ, thịt lợn băm",
  "servingGrams": 250.0,
  "kcal": 105.0,
  "proteinG": 7.2,
  "fatG": 4.1,
  "carbG": 9.8,
  "fiberG": 1.2,
  "sodiumMg": 410.0,
  "components": [
   {
    "name": "Bí đỏ",
    "grams": 90.0
   },
   {
    "name": "Thịt lợn băm",
    "grams": 30.0
   },
   {
    "name": "Nước canh",
    "grams": 130.0
   }
  ]
 },
 {
  "code": "VPF-000143",
  "category": "Món Canh & Súp",
  "name": "Canh cua mồng tơi mướp",
  "ingredientsText": "Thịt cua đồng, rau mồng tơi, mướp",
  "servingGrams": 250.0,
  "kcal": 68.0,
  "proteinG": 6.8,
  "fatG": 1.8,
  "carbG": 6.2,
  "fiberG": 1.9,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Thịt cua đồng",
    "grams": 30.0
   },
   {
    "name": "Mồng tơi",
    "grams": 40.0
   },
   {
    "name": "Mướp",
    "grams": 40.0
   },
   {
    "name": "Nước canh",
    "grams": 140.0
   }
  ]
 },
 {
  "code": "VPF-000144",
  "category": "Món Canh & Súp",
  "name": "Canh khoai mỡ nấu tôm",
  "ingredientsText": "Khoai mỡ, tôm tươi băm",
  "servingGrams": 250.0,
  "kcal": 135.0,
  "proteinG": 7.5,
  "fatG": 2.8,
  "carbG": 20.2,
  "fiberG": 1.5,
  "sodiumMg": 430.0,
  "components": [
   {
    "name": "Khoai mỡ",
    "grams": 90.0
   },
   {
    "name": "Tôm băm",
    "grams": 30.0
   },
   {
    "name": "Nước canh",
    "grams": 125.0
   },
   {
    "name": "Rau ngò",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000145",
  "category": "Món Canh & Súp",
  "name": "Canh khổ qua nhồi thịt",
  "ingredientsText": "Khổ qua, thịt heo băm, miến",
  "servingGrams": 200.0,
  "kcal": 140.0,
  "proteinG": 11.2,
  "fatG": 7.5,
  "carbG": 7.2,
  "fiberG": 1.8,
  "sodiumMg": 490.0,
  "components": [
   {
    "name": "Khổ qua",
    "grams": 80.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 40.0
   },
   {
    "name": "Miến, mộc nhĩ",
    "grams": 10.0
   },
   {
    "name": "Nước canh",
    "grams": 70.0
   }
  ]
 },
 {
  "code": "VPF-000146",
  "category": "Món Canh & Súp",
  "name": "Canh rau ngót thịt băm",
  "ingredientsText": "Rau ngót tươi, thịt heo băm",
  "servingGrams": 250.0,
  "kcal": 85.0,
  "proteinG": 8.2,
  "fatG": 2.5,
  "carbG": 6.8,
  "fiberG": 2.1,
  "sodiumMg": 380.0,
  "components": [
   {
    "name": "Rau ngót",
    "grams": 60.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 30.0
   },
   {
    "name": "Nước canh",
    "grams": 160.0
   }
  ]
 },
 {
  "code": "VPF-000147",
  "category": "Món Canh & Súp",
  "name": "Súp gà nấm tuyết",
  "ingredientsText": "Thịt gà xé, nấm tuyết, trứng",
  "servingGrams": 200.0,
  "kcal": 115.0,
  "proteinG": 8.2,
  "fatG": 3.5,
  "carbG": 12.8,
  "fiberG": 0.6,
  "sodiumMg": 460.0,
  "components": [
   {
    "name": "Thịt gà xé",
    "grams": 40.0
   },
   {
    "name": "Nấm tuyết",
    "grams": 15.0
   },
   {
    "name": "Trứng",
    "grams": 20.0
   },
   {
    "name": "Bột năng",
    "grams": 5.0
   },
   {
    "name": "Nước súp",
    "grams": 120.0
   }
  ]
 },
 {
  "code": "VPF-000148",
  "category": "Món Canh & Súp",
  "name": "Canh sườn nấu sấu",
  "ingredientsText": "Sườn heo, quả sấu, cà chua",
  "servingGrams": 250.0,
  "kcal": 165.0,
  "proteinG": 11.5,
  "fatG": 9.8,
  "carbG": 7.5,
  "fiberG": 1.1,
  "sodiumMg": 540.0,
  "components": [
   {
    "name": "Sườn heo",
    "grams": 60.0
   },
   {
    "name": "Quả sấu",
    "grams": 15.0
   },
   {
    "name": "Cà chua",
    "grams": 25.0
   },
   {
    "name": "Nước canh",
    "grams": 150.0
   }
  ]
 },
 {
  "code": "VPF-000149",
  "category": "Món Canh & Súp",
  "name": "Canh bầu nấu hến",
  "ingredientsText": "Quả bầu tươi, thịt hến sông",
  "servingGrams": 250.0,
  "kcal": 72.0,
  "proteinG": 6.2,
  "fatG": 1.2,
  "carbG": 8.5,
  "fiberG": 1.2,
  "sodiumMg": 420.0,
  "components": [
   {
    "name": "Quả bầu",
    "grams": 90.0
   },
   {
    "name": "Thịt hến",
    "grams": 30.0
   },
   {
    "name": "Nước canh",
    "grams": 130.0
   }
  ]
 },
 {
  "code": "VPF-000150",
  "category": "Món Canh & Súp",
  "name": "Canh rong biển thịt băm",
  "ingredientsText": "Rong biển khô, thịt heo băm",
  "servingGrams": 250.0,
  "kcal": 92.0,
  "proteinG": 7.8,
  "fatG": 3.2,
  "carbG": 8.0,
  "fiberG": 1.8,
  "sodiumMg": 620.0,
  "components": [
   {
    "name": "Rong biển (đã ngâm)",
    "grams": 30.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 30.0
   },
   {
    "name": "Nước canh",
    "grams": 190.0
   }
  ]
 },
 {
  "code": "VPF-000151",
  "category": "Món Lẩu",
  "name": "Lẩu thái hải sản",
  "ingredientsText": "Tôm, mực, nấm, nước lẩu Thái",
  "servingGrams": 400.0,
  "kcal": 280.0,
  "proteinG": 22.5,
  "fatG": 8.2,
  "carbG": 18.5,
  "fiberG": 2.4,
  "sodiumMg": 1450.0,
  "components": [
   {
    "name": "Tôm",
    "grams": 60.0
   },
   {
    "name": "Mực",
    "grams": 50.0
   },
   {
    "name": "Nấm",
    "grams": 50.0
   },
   {
    "name": "Rau lẩu",
    "grams": 40.0
   },
   {
    "name": "Nước lẩu Thái",
    "grams": 200.0
   }
  ]
 },
 {
  "code": "VPF-000152",
  "category": "Món Lẩu",
  "name": "Lẩu gà lá giang",
  "ingredientsText": "Thịt gà, lá giang, bún, gia vị",
  "servingGrams": 450.0,
  "kcal": 380.0,
  "proteinG": 24.0,
  "fatG": 14.2,
  "carbG": 38.5,
  "fiberG": 2.1,
  "sodiumMg": 1280.0,
  "components": [
   {
    "name": "Thịt gà",
    "grams": 120.0
   },
   {
    "name": "Lá giang",
    "grams": 30.0
   },
   {
    "name": "Bún",
    "grams": 120.0
   },
   {
    "name": "Nước lẩu",
    "grams": 180.0
   }
  ]
 },
 {
  "code": "VPF-000153",
  "category": "Món Lẩu",
  "name": "Lẩu mắm Miền Tây",
  "ingredientsText": "Mắm cá linh, thịt quay, tôm, mực, rau",
  "servingGrams": 450.0,
  "kcal": 420.0,
  "proteinG": 26.2,
  "fatG": 16.5,
  "carbG": 41.0,
  "fiberG": 3.2,
  "sodiumMg": 1680.0,
  "components": [
   {
    "name": "Mắm cá linh",
    "grams": 20.0
   },
   {
    "name": "Thịt quay",
    "grams": 50.0
   },
   {
    "name": "Tôm",
    "grams": 40.0
   },
   {
    "name": "Mực",
    "grams": 30.0
   },
   {
    "name": "Rau",
    "grams": 60.0
   },
   {
    "name": "Bún",
    "grams": 100.0
   },
   {
    "name": "Nước lẩu",
    "grams": 150.0
   }
  ]
 },
 {
  "code": "VPF-000154",
  "category": "Món Lẩu",
  "name": "Lẩu riêu cua sườn sụn",
  "ingredientsText": "Cua đồng, sườn sụn, chả cua, rau",
  "servingGrams": 450.0,
  "kcal": 395.0,
  "proteinG": 23.5,
  "fatG": 18.0,
  "carbG": 34.5,
  "fiberG": 2.1,
  "sodiumMg": 1350.0,
  "components": [
   {
    "name": "Riêu cua đồng",
    "grams": 50.0
   },
   {
    "name": "Sườn sụn",
    "grams": 70.0
   },
   {
    "name": "Chả cua",
    "grams": 30.0
   },
   {
    "name": "Rau",
    "grams": 50.0
   },
   {
    "name": "Bún",
    "grams": 100.0
   },
   {
    "name": "Nước lẩu",
    "grams": 150.0
   }
  ]
 },
 {
  "code": "VPF-000155",
  "category": "Món Lẩu",
  "name": "Lẩu vịt om sấu",
  "ingredientsText": "Thịt vịt, quả sấu, khoai sọ, bún",
  "servingGrams": 450.0,
  "kcal": 410.0,
  "proteinG": 22.8,
  "fatG": 21.5,
  "carbG": 31.2,
  "fiberG": 2.0,
  "sodiumMg": 1180.0,
  "components": [
   {
    "name": "Thịt vịt",
    "grams": 120.0
   },
   {
    "name": "Quả sấu",
    "grams": 20.0
   },
   {
    "name": "Khoai sọ",
    "grams": 50.0
   },
   {
    "name": "Bún",
    "grams": 100.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   },
   {
    "name": "Nước lẩu",
    "grams": 140.0
   }
  ]
 },
 {
  "code": "VPF-000156",
  "category": "Món Cuốn & Gỏi",
  "name": "Gỏi cuốn tôm thịt",
  "ingredientsText": "Bánh tráng, tôm, thịt luộc, bún",
  "servingGrams": 100.0,
  "kcal": 145.0,
  "proteinG": 8.2,
  "fatG": 3.5,
  "carbG": 20.2,
  "fiberG": 0.8,
  "sodiumMg": 380.0,
  "components": [
   {
    "name": "Bánh tráng",
    "grams": 15.0
   },
   {
    "name": "Tôm",
    "grams": 20.0
   },
   {
    "name": "Thịt luộc",
    "grams": 20.0
   },
   {
    "name": "Bún",
    "grams": 30.0
   },
   {
    "name": "Rau sống",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000157",
  "category": "Món Cuốn & Gỏi",
  "name": "Nem nướng Nha Trang",
  "ingredientsText": "Thịt heo nướng, bánh tráng, rau sống",
  "servingGrams": 150.0,
  "kcal": 310.0,
  "proteinG": 16.8,
  "fatG": 15.2,
  "carbG": 26.5,
  "fiberG": 1.2,
  "sodiumMg": 580.0,
  "components": [
   {
    "name": "Nem nướng",
    "grams": 70.0
   },
   {
    "name": "Bánh tráng",
    "grams": 25.0
   },
   {
    "name": "Rau sống",
    "grams": 35.0
   },
   {
    "name": "Nước chấm",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000158",
  "category": "Món Cuốn & Gỏi",
  "name": "Gỏi ngó sen tôm thịt",
  "ingredientsText": "Ngó sen, tôm, thịt heo, lạc",
  "servingGrams": 150.0,
  "kcal": 165.0,
  "proteinG": 11.2,
  "fatG": 5.2,
  "carbG": 18.5,
  "fiberG": 2.5,
  "sodiumMg": 450.0,
  "components": [
   {
    "name": "Ngó sen",
    "grams": 80.0
   },
   {
    "name": "Tôm",
    "grams": 25.0
   },
   {
    "name": "Thịt heo",
    "grams": 25.0
   },
   {
    "name": "Lạc",
    "grams": 10.0
   },
   {
    "name": "Nước trộn, rau thơm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000159",
  "category": "Món Cuốn & Gỏi",
  "name": "Gỏi gà xé phay",
  "ingredientsText": "Thịt gà xé, hành tây, rau răm",
  "servingGrams": 150.0,
  "kcal": 185.0,
  "proteinG": 16.2,
  "fatG": 8.5,
  "carbG": 10.8,
  "fiberG": 1.8,
  "sodiumMg": 520.0,
  "components": [
   {
    "name": "Thịt gà xé",
    "grams": 80.0
   },
   {
    "name": "Hành tây",
    "grams": 40.0
   },
   {
    "name": "Rau răm",
    "grams": 15.0
   },
   {
    "name": "Nước trộn",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000160",
  "category": "Món Cuốn & Gỏi",
  "name": "Gỏi bò bóp thấu",
  "ingredientsText": "Thịt bò tái, khế chua, chuối chát",
  "servingGrams": 150.0,
  "kcal": 195.0,
  "proteinG": 17.5,
  "fatG": 9.2,
  "carbG": 10.5,
  "fiberG": 2.1,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Thịt bò tái",
    "grams": 80.0
   },
   {
    "name": "Khế chua",
    "grams": 25.0
   },
   {
    "name": "Chuối chát",
    "grams": 25.0
   },
   {
    "name": "Thính, nước trộn",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000161",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh xèo miền Tây",
  "ingredientsText": "Bột gạo, thịt heo, tôm, giá",
  "servingGrams": 180.0,
  "kcal": 355.0,
  "proteinG": 12.8,
  "fatG": 18.5,
  "carbG": 34.2,
  "fiberG": 1.4,
  "sodiumMg": 540.0,
  "components": [
   {
    "name": "Bột gạo pha",
    "grams": 70.0
   },
   {
    "name": "Thịt heo",
    "grams": 30.0
   },
   {
    "name": "Tôm",
    "grams": 25.0
   },
   {
    "name": "Giá đỗ",
    "grams": 35.0
   },
   {
    "name": "Dầu ăn",
    "grams": 15.0
   },
   {
    "name": "Nước cốt dừa",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000162",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh khọt",
  "ingredientsText": "Bột gạo, tôm tươi, mỡ hành",
  "servingGrams": 150.0,
  "kcal": 320.0,
  "proteinG": 10.5,
  "fatG": 16.2,
  "carbG": 32.8,
  "fiberG": 1.0,
  "sodiumMg": 490.0,
  "components": [
   {
    "name": "Bột gạo pha",
    "grams": 80.0
   },
   {
    "name": "Tôm tươi",
    "grams": 35.0
   },
   {
    "name": "Mỡ hành",
    "grams": 15.0
   },
   {
    "name": "Nước cốt dừa",
    "grams": 10.0
   },
   {
    "name": "Dầu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000163",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh cuốn nhân thịt",
  "ingredientsText": "Bánh cuốn, thịt băm, mộc nhĩ",
  "servingGrams": 180.0,
  "kcal": 290.0,
  "proteinG": 8.8,
  "fatG": 10.5,
  "carbG": 40.2,
  "fiberG": 0.6,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Bánh cuốn",
    "grams": 130.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 30.0
   },
   {
    "name": "Mộc nhĩ",
    "grams": 5.0
   },
   {
    "name": "Hành phi",
    "grams": 5.0
   },
   {
    "name": "Nước chấm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000164",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh chưng",
  "ingredientsText": "Gạo nếp, đậu xanh, thịt ba chỉ",
  "servingGrams": 100.0,
  "kcal": 275.0,
  "proteinG": 7.8,
  "fatG": 8.5,
  "carbG": 41.5,
  "fiberG": 1.1,
  "sodiumMg": 180.0,
  "components": [
   {
    "name": "Gạo nếp",
    "grams": 60.0
   },
   {
    "name": "Đậu xanh",
    "grams": 20.0
   },
   {
    "name": "Thịt ba chỉ",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000165",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh bột lọc nhân tôm",
  "ingredientsText": "Bột năng, tôm tươi, thịt ba chỉ",
  "servingGrams": 120.0,
  "kcal": 210.0,
  "proteinG": 7.2,
  "fatG": 6.5,
  "carbG": 30.5,
  "fiberG": 0.5,
  "sodiumMg": 390.0,
  "components": [
   {
    "name": "Bột năng",
    "grams": 70.0
   },
   {
    "name": "Tôm tươi",
    "grams": 25.0
   },
   {
    "name": "Thịt ba chỉ",
    "grams": 15.0
   },
   {
    "name": "Nước chấm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000166",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh mì kẹp thịt",
  "ingredientsText": "Bánh mì, chả lụa, pate, thịt nguội",
  "servingGrams": 150.0,
  "kcal": 410.0,
  "proteinG": 15.5,
  "fatG": 16.2,
  "carbG": 50.8,
  "fiberG": 2.1,
  "sodiumMg": 780.0,
  "components": [
   {
    "name": "Bánh mì",
    "grams": 80.0
   },
   {
    "name": "Chả lụa",
    "grams": 25.0
   },
   {
    "name": "Pate",
    "grams": 15.0
   },
   {
    "name": "Thịt nguội",
    "grams": 15.0
   },
   {
    "name": "Dưa góp, rau",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000167",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh giò nhân thịt",
  "ingredientsText": "Bột gạo, thịt heo băm, mộc nhĩ",
  "servingGrams": 150.0,
  "kcal": 260.0,
  "proteinG": 8.2,
  "fatG": 9.5,
  "carbG": 35.2,
  "fiberG": 0.8,
  "sodiumMg": 420.0,
  "components": [
   {
    "name": "Bột gạo",
    "grams": 100.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 35.0
   },
   {
    "name": "Mộc nhĩ",
    "grams": 5.0
   },
   {
    "name": "Hành, mỡ",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000168",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh bèo Huế",
  "ingredientsText": "Bột gạo, tôm cháy, mỡ hành",
  "servingGrams": 120.0,
  "kcal": 185.0,
  "proteinG": 5.8,
  "fatG": 4.2,
  "carbG": 31.0,
  "fiberG": 0.4,
  "sodiumMg": 380.0,
  "components": [
   {
    "name": "Bánh bèo",
    "grams": 85.0
   },
   {
    "name": "Tôm cháy",
    "grams": 15.0
   },
   {
    "name": "Mỡ hành",
    "grams": 5.0
   },
   {
    "name": "Nước mắm",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000169",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh nậm Huế",
  "ingredientsText": "Bột gạo, tôm thịt băm nhuyễn",
  "servingGrams": 120.0,
  "kcal": 195.0,
  "proteinG": 6.5,
  "fatG": 5.0,
  "carbG": 31.2,
  "fiberG": 0.5,
  "sodiumMg": 410.0,
  "components": [
   {
    "name": "Bột gạo",
    "grams": 90.0
   },
   {
    "name": "Tôm thịt băm",
    "grams": 20.0
   },
   {
    "name": "Nước mắm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000170",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh đúc nóng",
  "ingredientsText": "Bột gạo, thịt băm, mộc nhĩ, nước mắm",
  "servingGrams": 180.0,
  "kcal": 230.0,
  "proteinG": 7.5,
  "fatG": 7.8,
  "carbG": 32.5,
  "fiberG": 0.8,
  "sodiumMg": 450.0,
  "components": [
   {
    "name": "Bánh đúc",
    "grams": 120.0
   },
   {
    "name": "Thịt băm",
    "grams": 30.0
   },
   {
    "name": "Mộc nhĩ",
    "grams": 5.0
   },
   {
    "name": "Nước mắm pha",
    "grams": 25.0
   }
  ]
 },
 {
  "code": "VPF-000171",
  "category": "Món Tráng Miệng",
  "name": "Chè đậu xanh cốt dừa",
  "ingredientsText": "Đậu xanh, đường, nước cốt dừa",
  "servingGrams": 150.0,
  "kcal": 245.0,
  "proteinG": 6.2,
  "fatG": 5.8,
  "carbG": 42.0,
  "fiberG": 1.8,
  "sodiumMg": 45.0,
  "components": [
   {
    "name": "Đậu xanh",
    "grams": 40.0
   },
   {
    "name": "Đường",
    "grams": 20.0
   },
   {
    "name": "Nước cốt dừa",
    "grams": 20.0
   },
   {
    "name": "Nước",
    "grams": 70.0
   }
  ]
 },
 {
  "code": "VPF-000172",
  "category": "Món Tráng Miệng",
  "name": "Chè bưởi",
  "ingredientsText": "Cùi bưởi, đậu xanh, đường, dừa",
  "servingGrams": 150.0,
  "kcal": 220.0,
  "proteinG": 4.5,
  "fatG": 4.2,
  "carbG": 41.0,
  "fiberG": 1.5,
  "sodiumMg": 38.0,
  "components": [
   {
    "name": "Cùi bưởi",
    "grams": 30.0
   },
   {
    "name": "Đậu xanh",
    "grams": 20.0
   },
   {
    "name": "Đường",
    "grams": 25.0
   },
   {
    "name": "Nước cốt dừa",
    "grams": 15.0
   },
   {
    "name": "Bột năng, nước",
    "grams": 60.0
   }
  ]
 },
 {
  "code": "VPF-000173",
  "category": "Món Tráng Miệng",
  "name": "Chè đỗ đen",
  "ingredientsText": "Đậu đen ninh mềm, đường kính",
  "servingGrams": 150.0,
  "kcal": 195.0,
  "proteinG": 5.8,
  "fatG": 0.8,
  "carbG": 41.2,
  "fiberG": 2.4,
  "sodiumMg": 25.0,
  "components": [
   {
    "name": "Đậu đen",
    "grams": 40.0
   },
   {
    "name": "Đường",
    "grams": 25.0
   },
   {
    "name": "Nước",
    "grams": 85.0
   }
  ]
 },
 {
  "code": "VPF-000174",
  "category": "Món Tráng Miệng",
  "name": "Chè trôi nước",
  "ingredientsText": "Bột nếp, nhân đậu xanh, gừng, dừa",
  "servingGrams": 150.0,
  "kcal": 260.0,
  "proteinG": 4.8,
  "fatG": 3.5,
  "carbG": 52.5,
  "fiberG": 1.2,
  "sodiumMg": 32.0,
  "components": [
   {
    "name": "Bột nếp",
    "grams": 50.0
   },
   {
    "name": "Nhân đậu xanh",
    "grams": 25.0
   },
   {
    "name": "Đường, gừng",
    "grams": 30.0
   },
   {
    "name": "Nước cốt dừa",
    "grams": 15.0
   },
   {
    "name": "Nước",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000175",
  "category": "Món Tráng Miệng",
  "name": "Bánh Flan (Caramen)",
  "ingredientsText": "Trứng gà, sữa tươi, đường caramen",
  "servingGrams": 100.0,
  "kcal": 145.0,
  "proteinG": 4.8,
  "fatG": 4.2,
  "carbG": 22.0,
  "fiberG": null,
  "sodiumMg": 65.0,
  "components": [
   {
    "name": "Trứng gà",
    "grams": 40.0
   },
   {
    "name": "Sữa tươi",
    "grams": 45.0
   },
   {
    "name": "Đường caramen",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000176",
  "category": "Món Tráng Miệng",
  "name": "Sữa chua nếp cẩm",
  "ingredientsText": "Sữa chua, nếp cẩm ngâm đường",
  "servingGrams": 150.0,
  "kcal": 180.0,
  "proteinG": 5.2,
  "fatG": 2.8,
  "carbG": 33.5,
  "fiberG": 0.8,
  "sodiumMg": 58.0,
  "components": [
   {
    "name": "Sữa chua",
    "grams": 100.0
   },
   {
    "name": "Nếp cẩm chín",
    "grams": 40.0
   },
   {
    "name": "Đường",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000177",
  "category": "Trái Cây Tươi",
  "name": "Chuối tiêu chín",
  "ingredientsText": "Chuối tiêu tươi",
  "servingGrams": 100.0,
  "kcal": 97.0,
  "proteinG": 1.5,
  "fatG": 0.2,
  "carbG": 22.2,
  "fiberG": 0.8,
  "sodiumMg": 1.0,
  "components": [
   {
    "name": "Chuối tiêu tươi",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000178",
  "category": "Trái Cây Tươi",
  "name": "Xoài chín tươi",
  "ingredientsText": "Xoài chín tươi",
  "servingGrams": 100.0,
  "kcal": 62.0,
  "proteinG": 0.6,
  "fatG": 0.2,
  "carbG": 15.9,
  "fiberG": 1.8,
  "sodiumMg": 2.0,
  "components": [
   {
    "name": "Xoài chín tươi",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000179",
  "category": "Trái Cây Tươi",
  "name": "Cam tươi",
  "ingredientsText": "Cam tươi múi",
  "servingGrams": 100.0,
  "kcal": 37.0,
  "proteinG": 0.9,
  "fatG": 0.1,
  "carbG": 8.3,
  "fiberG": 1.4,
  "sodiumMg": 3.0,
  "components": [
   {
    "name": "Cam tươi múi",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000180",
  "category": "Trái Cây Tươi",
  "name": "Bưởi múi",
  "ingredientsText": "Bưởi múi tươi",
  "servingGrams": 100.0,
  "kcal": 38.0,
  "proteinG": 0.7,
  "fatG": 0.1,
  "carbG": 8.7,
  "fiberG": 0.7,
  "sodiumMg": 2.0,
  "components": [
   {
    "name": "Bưởi múi tươi",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000181",
  "category": "Trái Cây Tươi",
  "name": "Dưa hấu tươi",
  "ingredientsText": "Dưa hấu đỏ tươi",
  "servingGrams": 100.0,
  "kcal": 16.0,
  "proteinG": 1.2,
  "fatG": 0.2,
  "carbG": 2.3,
  "fiberG": 0.5,
  "sodiumMg": 2.0,
  "components": [
   {
    "name": "Dưa hấu đỏ tươi",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000182",
  "category": "Trái Cây Tươi",
  "name": "Thanh long tươi",
  "ingredientsText": "Thanh long ruột trắng",
  "servingGrams": 100.0,
  "kcal": 32.0,
  "proteinG": 1.1,
  "fatG": 0.2,
  "carbG": 6.5,
  "fiberG": 0.8,
  "sodiumMg": 3.0,
  "components": [
   {
    "name": "Thanh long ruột trắng",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000183",
  "category": "Trái Cây Tươi",
  "name": "Vải thiều tươi",
  "ingredientsText": "Vải thiều bóc vỏ",
  "servingGrams": 100.0,
  "kcal": 67.0,
  "proteinG": 0.7,
  "fatG": 0.2,
  "carbG": 15.5,
  "fiberG": 0.6,
  "sodiumMg": 2.0,
  "components": [
   {
    "name": "Vải thiều bóc vỏ",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000184",
  "category": "Trái Cây Tươi",
  "name": "Nhãn tươi",
  "ingredientsText": "Nhãn bóc vỏ",
  "servingGrams": 100.0,
  "kcal": 60.0,
  "proteinG": 0.9,
  "fatG": 0.1,
  "carbG": 14.0,
  "fiberG": 1.0,
  "sodiumMg": 2.0,
  "components": [
   {
    "name": "Nhãn bóc vỏ",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000185",
  "category": "Trái Cây Tươi",
  "name": "Dứa chín (Thơm)",
  "ingredientsText": "Dứa chín tươi gọt mắt",
  "servingGrams": 100.0,
  "kcal": 29.0,
  "proteinG": 0.8,
  "fatG": 0.2,
  "carbG": 6.1,
  "fiberG": 1.4,
  "sodiumMg": 2.0,
  "components": [
   {
    "name": "Dứa chín tươi gọt mắt",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000186",
  "category": "Trái Cây Tươi",
  "name": "Đu đủ chín",
  "ingredientsText": "Đu đủ ruột đỏ chín",
  "servingGrams": 100.0,
  "kcal": 35.0,
  "proteinG": 1.0,
  "fatG": 0.1,
  "carbG": 7.7,
  "fiberG": 0.9,
  "sodiumMg": 4.0,
  "components": [
   {
    "name": "Đu đủ ruột đỏ chín",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000187",
  "category": "Trái Cây Tươi",
  "name": "Ổi tươi",
  "ingredientsText": "Ổi tươi nguyên vỏ",
  "servingGrams": 100.0,
  "kcal": 34.0,
  "proteinG": 1.0,
  "fatG": 0.3,
  "carbG": 6.8,
  "fiberG": 6.0,
  "sodiumMg": 3.0,
  "components": [
   {
    "name": "Ổi tươi nguyên vỏ",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000188",
  "category": "Trái Cây Tươi",
  "name": "Mãn cầu ta (Na)",
  "ingredientsText": "Thịt quả na chín",
  "servingGrams": 100.0,
  "kcal": 66.0,
  "proteinG": 1.6,
  "fatG": 0.3,
  "carbG": 14.5,
  "fiberG": 2.0,
  "sodiumMg": 4.0,
  "components": [
   {
    "name": "Thịt quả na chín",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000189",
  "category": "Trái Cây Tươi",
  "name": "Mít chín",
  "ingredientsText": "Mít múi tươi",
  "servingGrams": 100.0,
  "kcal": 48.0,
  "proteinG": 1.5,
  "fatG": 0.3,
  "carbG": 9.8,
  "fiberG": 1.2,
  "sodiumMg": 3.0,
  "components": [
   {
    "name": "Mít múi tươi",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000190",
  "category": "Trái Cây Tươi",
  "name": "Sầu riêng tươi",
  "ingredientsText": "Cơm sầu riêng vàng",
  "servingGrams": 100.0,
  "kcal": 147.0,
  "proteinG": 2.5,
  "fatG": 5.3,
  "carbG": 23.3,
  "fiberG": 3.8,
  "sodiumMg": 2.0,
  "components": [
   {
    "name": "Cơm sầu riêng vàng",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000191",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Cá trích hộp sốt cà chua",
  "ingredientsText": "Cá trích hộp, sốt cà chua",
  "servingGrams": 100.0,
  "kcal": 198.0,
  "proteinG": 15.8,
  "fatG": 12.5,
  "carbG": 5.2,
  "fiberG": null,
  "sodiumMg": 680.0,
  "components": [
   {
    "name": "Cá trích",
    "grams": 75.0
   },
   {
    "name": "Sốt cà chua",
    "grams": 25.0
   }
  ]
 },
 {
  "code": "VPF-000192",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Cá ngừ đóng hộp",
  "ingredientsText": "Thịt cá ngừ đóng hộp",
  "servingGrams": 100.0,
  "kcal": 127.0,
  "proteinG": 24.2,
  "fatG": 2.8,
  "carbG": 0.0,
  "fiberG": null,
  "sodiumMg": 520.0,
  "components": [
   {
    "name": "Thịt cá ngừ đóng hộp",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000193",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Thịt heo đóng hộp (Spam)",
  "ingredientsText": "Thịt heo chế biến đóng hộp",
  "servingGrams": 100.0,
  "kcal": 310.0,
  "proteinG": 13.5,
  "fatG": 26.8,
  "carbG": 2.5,
  "fiberG": null,
  "sodiumMg": 980.0,
  "components": [
   {
    "name": "Thịt heo chế biến đóng hộp",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000194",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Mít khô sấy",
  "ingredientsText": "Mít sấy khô",
  "servingGrams": 100.0,
  "kcal": 280.0,
  "proteinG": 2.8,
  "fatG": 1.2,
  "carbG": 68.5,
  "fiberG": 5.8,
  "sodiumMg": 15.0,
  "components": [
   {
    "name": "Mít sấy khô",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000195",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Chuối sấy khô",
  "ingredientsText": "Chuối sấy khô",
  "servingGrams": 100.0,
  "kcal": 310.0,
  "proteinG": 3.2,
  "fatG": 1.8,
  "carbG": 74.2,
  "fiberG": 6.2,
  "sodiumMg": 12.0,
  "components": [
   {
    "name": "Chuối sấy khô",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000196",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Nước mắm nhĩ 30 độ đạm",
  "ingredientsText": "Nước mắm cá cơm tinh chất",
  "servingGrams": 100.0,
  "kcal": 38.0,
  "proteinG": 7.8,
  "fatG": 0.1,
  "carbG": 1.2,
  "fiberG": null,
  "sodiumMg": 8200.0,
  "components": [
   {
    "name": "Nước mắm cá cơm tinh chất",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000197",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Mắm tôm bắc",
  "ingredientsText": "Tôm biển ủ muối lên men",
  "servingGrams": 100.0,
  "kcal": 72.0,
  "proteinG": 14.8,
  "fatG": 1.2,
  "carbG": 0.5,
  "fiberG": null,
  "sodiumMg": 7800.0,
  "components": [
   {
    "name": "Tôm biển ủ muối lên men",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000198",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Xì dầu (Nước tương)",
  "ingredientsText": "Đậu tương lên men",
  "servingGrams": 100.0,
  "kcal": 52.0,
  "proteinG": 5.2,
  "fatG": 0.2,
  "carbG": 7.2,
  "fiberG": null,
  "sodiumMg": 5600.0,
  "components": [
   {
    "name": "Đậu tương lên men",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000199",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Tương ớt chinsu",
  "ingredientsText": "Ớt, tỏi, đường, dấm",
  "servingGrams": 100.0,
  "kcal": 95.0,
  "proteinG": 1.2,
  "fatG": 0.8,
  "carbG": 20.8,
  "fiberG": 1.1,
  "sodiumMg": 1850.0,
  "components": [
   {
    "name": "Ớt",
    "grams": 45.0
   },
   {
    "name": "Tỏi",
    "grams": 5.0
   },
   {
    "name": "Đường",
    "grams": 20.0
   },
   {
    "name": "Giấm, nước, tinh bột",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000200",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Dầu ăn thực vật",
  "ingredientsText": "Dầu đậu nành tinh luyện",
  "servingGrams": 100.0,
  "kcal": 898.0,
  "proteinG": 0.0,
  "fatG": 99.8,
  "carbG": 0.0,
  "fiberG": null,
  "sodiumMg": null,
  "components": [
   {
    "name": "Dầu đậu nành tinh luyện",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000201",
  "category": "Lương thực & Ngũ cốc",
  "name": "Gạo lứt đen (Than)",
  "ingredientsText": "Gạo lứt đen nguyên cám",
  "servingGrams": 100.0,
  "kcal": 342.0,
  "proteinG": 8.5,
  "fatG": 2.5,
  "carbG": 71.0,
  "fiberG": 3.8,
  "sodiumMg": 4.0,
  "components": [
   {
    "name": "Gạo lứt đen nguyên cám",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000202",
  "category": "Lương thực & Ngũ cốc",
  "name": "Ngô nếp tươi",
  "ingredientsText": "Bắp ngô nếp trắng",
  "servingGrams": 100.0,
  "kcal": 168.0,
  "proteinG": 3.8,
  "fatG": 1.8,
  "carbG": 35.2,
  "fiberG": 1.5,
  "sodiumMg": 12.0,
  "components": [
   {
    "name": "Bắp ngô nếp trắng",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000203",
  "category": "Lương thực & Ngũ cốc",
  "name": "Củ từ tươi",
  "ingredientsText": "Củ từ gọt vỏ",
  "servingGrams": 100.0,
  "kcal": 92.0,
  "proteinG": 1.5,
  "fatG": 0.1,
  "carbG": 21.5,
  "fiberG": 1.1,
  "sodiumMg": 8.0,
  "components": [
   {
    "name": "Củ từ gọt vỏ",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000204",
  "category": "Lương thực & Ngũ cốc",
  "name": "Củ mỡ tươi",
  "ingredientsText": "Củ mỡ ruột tím",
  "servingGrams": 100.0,
  "kcal": 102.0,
  "proteinG": 1.6,
  "fatG": 0.2,
  "carbG": 23.8,
  "fiberG": 1.3,
  "sodiumMg": 10.0,
  "components": [
   {
    "name": "Củ mỡ ruột tím",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000205",
  "category": "Món Cơm",
  "name": "Cơm niêu nướng",
  "ingredientsText": "Gạo tẻ thơm nấu niêu đất",
  "servingGrams": 150.0,
  "kcal": 420.0,
  "proteinG": 8.2,
  "fatG": 1.8,
  "carbG": 92.5,
  "fiberG": 0.5,
  "sodiumMg": 8.0,
  "components": [
   {
    "name": "Cơm niêu",
    "grams": 150.0
   }
  ]
 },
 {
  "code": "VPF-000206",
  "category": "Món Cơm",
  "name": "Cơm hến Huế",
  "ingredientsText": "Cơm nguội, thịt hến xào, mắm ruốc, bắp chuối",
  "servingGrams": 300.0,
  "kcal": 380.0,
  "proteinG": 15.2,
  "fatG": 8.5,
  "carbG": 61.2,
  "fiberG": 2.5,
  "sodiumMg": 890.0,
  "components": [
   {
    "name": "Cơm nguội",
    "grams": 150.0
   },
   {
    "name": "Thịt hến xào",
    "grams": 40.0
   },
   {
    "name": "Mắm ruốc",
    "grams": 10.0
   },
   {
    "name": "Bắp chuối, rau thơm",
    "grams": 40.0
   },
   {
    "name": "Tóp mỡ, lạc",
    "grams": 15.0
   },
   {
    "name": "Nước hến",
    "grams": 45.0
   }
  ]
 },
 {
  "code": "VPF-000207",
  "category": "Món Cơm",
  "name": "Cơm trộn Hàn Quốc Việt hóa",
  "ingredientsText": "Cơm, thịt bò, trứng, giá đỗ, sốt ớt",
  "servingGrams": 350.0,
  "kcal": 510.0,
  "proteinG": 21.5,
  "fatG": 16.2,
  "carbG": 69.5,
  "fiberG": 2.8,
  "sodiumMg": 780.0,
  "components": [
   {
    "name": "Cơm",
    "grams": 200.0
   },
   {
    "name": "Thịt bò",
    "grams": 50.0
   },
   {
    "name": "Trứng",
    "grams": 40.0
   },
   {
    "name": "Giá đỗ",
    "grams": 30.0
   },
   {
    "name": "Rau củ",
    "grams": 20.0
   },
   {
    "name": "Sốt ớt",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000208",
  "category": "Món Xôi",
  "name": "Xôi vị Miền Tây",
  "ingredientsText": "Gạo nếp, tai vịt, đường, nước cốt dừa",
  "servingGrams": 120.0,
  "kcal": 385.0,
  "proteinG": 6.8,
  "fatG": 8.2,
  "carbG": 71.0,
  "fiberG": 1.2,
  "sodiumMg": 35.0,
  "components": [
   {
    "name": "Gạo nếp (xôi chín)",
    "grams": 90.0
   },
   {
    "name": "Tai vịt (lá dứa)",
    "grams": 5.0
   },
   {
    "name": "Đường",
    "grams": 10.0
   },
   {
    "name": "Nước cốt dừa",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000209",
  "category": "Món Xôi",
  "name": "Xôi cốm Hà Nội",
  "ingredientsText": "Cốm dẹp, hạt sen, dừa nạo, đường",
  "servingGrams": 120.0,
  "kcal": 360.0,
  "proteinG": 7.2,
  "fatG": 4.5,
  "carbG": 72.8,
  "fiberG": 2.1,
  "sodiumMg": 18.0,
  "components": [
   {
    "name": "Cốm dẹp",
    "grams": 70.0
   },
   {
    "name": "Hạt sen",
    "grams": 20.0
   },
   {
    "name": "Dừa nạo",
    "grams": 15.0
   },
   {
    "name": "Đường",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000210",
  "category": "Món Cháo",
  "name": "Cháo cua đồng",
  "ingredientsText": "Gạo, cua đồng xay, rau ngót",
  "servingGrams": 350.0,
  "kcal": 260.0,
  "proteinG": 12.8,
  "fatG": 5.2,
  "carbG": 40.5,
  "fiberG": 1.2,
  "sodiumMg": 590.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 270.0
   },
   {
    "name": "Cua đồng xay",
    "grams": 50.0
   },
   {
    "name": "Rau ngót",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000211",
  "category": "Món Cháo",
  "name": "Cháo tim cật",
  "ingredientsText": "Gạo, tim lợn, cật lợn, hành hoa",
  "servingGrams": 400.0,
  "kcal": 340.0,
  "proteinG": 22.5,
  "fatG": 9.8,
  "carbG": 38.0,
  "fiberG": 0.4,
  "sodiumMg": 780.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 310.0
   },
   {
    "name": "Tim lợn",
    "grams": 40.0
   },
   {
    "name": "Cật lợn",
    "grams": 40.0
   },
   {
    "name": "Hành hoa",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000212",
  "category": "Món Phở",
  "name": "Phở sốt vang",
  "ingredientsText": "Bánh phở, thịt nạm bò sốt vang hầm gấc",
  "servingGrams": 450.0,
  "kcal": 490.0,
  "proteinG": 21.2,
  "fatG": 16.5,
  "carbG": 64.0,
  "fiberG": 0.9,
  "sodiumMg": 1150.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 200.0
   },
   {
    "name": "Nạm bò sốt vang",
    "grams": 80.0
   },
   {
    "name": "Nước sốt vang",
    "grams": 150.0
   },
   {
    "name": "Rau thơm",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000213",
  "category": "Món Phở",
  "name": "Phở xào hải sản",
  "ingredientsText": "Bánh phở xào, tôm, mực, cải ngọt",
  "servingGrams": 350.0,
  "kcal": 520.0,
  "proteinG": 20.8,
  "fatG": 18.2,
  "carbG": 68.0,
  "fiberG": 1.8,
  "sodiumMg": 980.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 210.0
   },
   {
    "name": "Tôm",
    "grams": 40.0
   },
   {
    "name": "Mực",
    "grams": 40.0
   },
   {
    "name": "Cải ngọt",
    "grams": 45.0
   },
   {
    "name": "Dầu ăn",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000214",
  "category": "Món Bún",
  "name": "Bún bung hoa chuối",
  "ingredientsText": "Bún, sườn heo, hoa chuối, mọc",
  "servingGrams": 450.0,
  "kcal": 425.0,
  "proteinG": 19.5,
  "fatG": 14.2,
  "carbG": 54.8,
  "fiberG": 2.5,
  "sodiumMg": 1080.0,
  "components": [
   {
    "name": "Bún",
    "grams": 200.0
   },
   {
    "name": "Sườn heo",
    "grams": 50.0
   },
   {
    "name": "Hoa chuối",
    "grams": 40.0
   },
   {
    "name": "Mọc",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 120.0
   },
   {
    "name": "Rau",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000215",
  "category": "Món Bún",
  "name": "Bún mọc dọc mùng",
  "ingredientsText": "Bún, mọc giò sống, dọc mùng, cà chua",
  "servingGrams": 450.0,
  "kcal": 390.0,
  "proteinG": 17.8,
  "fatG": 12.0,
  "carbG": 52.5,
  "fiberG": 1.8,
  "sodiumMg": 1050.0,
  "components": [
   {
    "name": "Bún",
    "grams": 200.0
   },
   {
    "name": "Mọc giò sống",
    "grams": 50.0
   },
   {
    "name": "Dọc mùng",
    "grams": 40.0
   },
   {
    "name": "Cà chua",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 120.0
   },
   {
    "name": "Rau",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000216",
  "category": "Món Bún",
  "name": "Bún mắm nêm Đ Nẵng",
  "ingredientsText": "Bún, thịt heo quay, mắm nêm, đu đủ bào",
  "servingGrams": 350.0,
  "kcal": 480.0,
  "proteinG": 21.5,
  "fatG": 18.8,
  "carbG": 56.2,
  "fiberG": 2.0,
  "sodiumMg": 1380.0,
  "components": [
   {
    "name": "Bún",
    "grams": 150.0
   },
   {
    "name": "Thịt heo quay",
    "grams": 70.0
   },
   {
    "name": "Mắm nêm pha",
    "grams": 40.0
   },
   {
    "name": "Đu đủ bào",
    "grams": 30.0
   },
   {
    "name": "Rau sống",
    "grams": 60.0
   }
  ]
 },
 {
  "code": "VPF-000217",
  "category": "Món Bún",
  "name": "Bún suông Trà Vinh",
  "ingredientsText": "Bún, chả tôm suông, giò heo, nước dùng",
  "servingGrams": 450.0,
  "kcal": 440.0,
  "proteinG": 22.0,
  "fatG": 13.5,
  "carbG": 57.5,
  "fiberG": 1.2,
  "sodiumMg": 1120.0,
  "components": [
   {
    "name": "Bún",
    "grams": 200.0
   },
   {
    "name": "Chả tôm suông",
    "grams": 50.0
   },
   {
    "name": "Giò heo",
    "grams": 50.0
   },
   {
    "name": "Nước dùng",
    "grams": 130.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000218",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Hủ tiếu mì xá xíu",
  "ingredientsText": "Hủ tiếu, mì trứng, thịt xá xíu",
  "servingGrams": 400.0,
  "kcal": 460.0,
  "proteinG": 21.0,
  "fatG": 14.8,
  "carbG": 60.5,
  "fiberG": 1.0,
  "sodiumMg": 1150.0,
  "components": [
   {
    "name": "Hủ tiếu",
    "grams": 100.0
   },
   {
    "name": "Mì trứng",
    "grams": 80.0
   },
   {
    "name": "Xá xíu",
    "grams": 50.0
   },
   {
    "name": "Nước dùng",
    "grams": 150.0
   },
   {
    "name": "Hẹ, cải",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000219",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Hủ tiếu hấp Miền Tây",
  "ingredientsText": "Hủ tiếu hấp bì, chả giò, thịt nướng",
  "servingGrams": 300.0,
  "kcal": 480.0,
  "proteinG": 18.5,
  "fatG": 19.2,
  "carbG": 58.0,
  "fiberG": 1.5,
  "sodiumMg": 890.0,
  "components": [
   {
    "name": "Bánh hủ tiếu hấp",
    "grams": 150.0
   },
   {
    "name": "Chả giò",
    "grams": 40.0
   },
   {
    "name": "Thịt nướng",
    "grams": 50.0
   },
   {
    "name": "Rau, giá",
    "grams": 40.0
   },
   {
    "name": "Nước mắm",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000220",
  "category": "Món Miến & Bánh Canh",
  "name": "Miến xào lươn giòn",
  "ingredientsText": "Miến xào, lươn chiên giòn, mộc nhĩ",
  "servingGrams": 280.0,
  "kcal": 450.0,
  "proteinG": 18.2,
  "fatG": 15.8,
  "carbG": 58.5,
  "fiberG": 1.5,
  "sodiumMg": 820.0,
  "components": [
   {
    "name": "Miến",
    "grams": 150.0
   },
   {
    "name": "Lươn chiên giòn",
    "grams": 70.0
   },
   {
    "name": "Mộc nhĩ",
    "grams": 15.0
   },
   {
    "name": "Giá, hành",
    "grams": 25.0
   },
   {
    "name": "Dầu",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000221",
  "category": "Món Miến & Bánh Canh",
  "name": "Bánh canh giò heo",
  "ingredientsText": "Bánh canh bột gạo, giò heo chặt",
  "servingGrams": 450.0,
  "kcal": 475.0,
  "proteinG": 21.0,
  "fatG": 18.2,
  "carbG": 56.5,
  "fiberG": 0.8,
  "sodiumMg": 1080.0,
  "components": [
   {
    "name": "Bánh canh bột gạo",
    "grams": 200.0
   },
   {
    "name": "Giò heo",
    "grams": 80.0
   },
   {
    "name": "Nước dùng",
    "grams": 150.0
   },
   {
    "name": "Hành, ngò",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000222",
  "category": "Món Miến & Bánh Canh",
  "name": "Bánh canh chả cá Quy Nhơn",
  "ingredientsText": "Bánh canh, chả cá chiên/hấp, nước dùng",
  "servingGrams": 450.0,
  "kcal": 410.0,
  "proteinG": 20.2,
  "fatG": 10.5,
  "carbG": 58.8,
  "fiberG": 1.0,
  "sodiumMg": 1120.0,
  "components": [
   {
    "name": "Bánh canh",
    "grams": 200.0
   },
   {
    "name": "Chả cá",
    "grams": 80.0
   },
   {
    "name": "Nước dùng",
    "grams": 150.0
   },
   {
    "name": "Hành, ngò",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000223",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt heo xào sả ớt",
  "ingredientsText": "Thịt heo nạc, sả, ớt, nước mắm",
  "servingGrams": 120.0,
  "kcal": 240.0,
  "proteinG": 18.8,
  "fatG": 16.5,
  "carbG": 4.2,
  "fiberG": 0.8,
  "sodiumMg": 680.0,
  "components": [
   {
    "name": "Thịt heo nạc",
    "grams": 100.0
   },
   {
    "name": "Sả",
    "grams": 8.0
   },
   {
    "name": "Ớt",
    "grams": 2.0
   },
   {
    "name": "Nước mắm, dầu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000224",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt heo giả cầy",
  "ingredientsText": "Thịt chân giò heo, riềng, mẻ, mắm tôm",
  "servingGrams": 180.0,
  "kcal": 360.0,
  "proteinG": 22.5,
  "fatG": 26.0,
  "carbG": 8.5,
  "fiberG": 1.2,
  "sodiumMg": 920.0,
  "components": [
   {
    "name": "Chân giò heo",
    "grams": 140.0
   },
   {
    "name": "Riềng",
    "grams": 10.0
   },
   {
    "name": "Mẻ",
    "grams": 15.0
   },
   {
    "name": "Mắm tôm, gia vị",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000225",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Sườn heo nướng BBQ Việt",
  "ingredientsText": "Sườn heo, mật ong, gừng, tỏi",
  "servingGrams": 150.0,
  "kcal": 340.0,
  "proteinG": 21.2,
  "fatG": 22.8,
  "carbG": 12.5,
  "fiberG": 0.3,
  "sodiumMg": 750.0,
  "components": [
   {
    "name": "Sườn heo",
    "grams": 130.0
   },
   {
    "name": "Mật ong",
    "grams": 10.0
   },
   {
    "name": "Gừng, tỏi",
    "grams": 5.0
   },
   {
    "name": "Dầu",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000226",
  "category": "Món Mặn - Thịt Bò",
  "name": "Thịt bò xào khổ qua",
  "ingredientsText": "Thịt bò thăn, khổ qua thái mỏng",
  "servingGrams": 150.0,
  "kcal": 165.0,
  "proteinG": 16.8,
  "fatG": 8.5,
  "carbG": 5.2,
  "fiberG": 1.8,
  "sodiumMg": 410.0,
  "components": [
   {
    "name": "Thịt bò thăn",
    "grams": 70.0
   },
   {
    "name": "Khổ qua",
    "grams": 70.0
   },
   {
    "name": "Dầu, tỏi",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000227",
  "category": "Món Mặn - Thịt Bò",
  "name": "Thịt bò kho gừng",
  "ingredientsText": "Thịt nạc bò, gừng già, nước mắm",
  "servingGrams": 120.0,
  "kcal": 210.0,
  "proteinG": 22.0,
  "fatG": 11.5,
  "carbG": 4.5,
  "fiberG": 0.6,
  "sodiumMg": 780.0,
  "components": [
   {
    "name": "Thịt nạc bò",
    "grams": 100.0
   },
   {
    "name": "Gừng",
    "grams": 8.0
   },
   {
    "name": "Nước mắm, đường",
    "grams": 12.0
   }
  ]
 },
 {
  "code": "VPF-000228",
  "category": "Món Mặn - Gia Cầm",
  "name": "Gà hấp lá chanh",
  "ingredientsText": "Thịt gà ta nguyên con hấp lá chanh",
  "servingGrams": 100.0,
  "kcal": 205.0,
  "proteinG": 20.1,
  "fatG": 13.5,
  "carbG": 0.0,
  "fiberG": null,
  "sodiumMg": 85.0,
  "components": [
   {
    "name": "Thịt gà ta",
    "grams": 95.0
   },
   {
    "name": "Lá chanh",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000229",
  "category": "Món Mặn - Gia Cầm",
  "name": "Gà xào nấm đông cô",
  "ingredientsText": "Thịt gà, nấm đông cô tươi",
  "servingGrams": 150.0,
  "kcal": 220.0,
  "proteinG": 19.5,
  "fatG": 12.8,
  "carbG": 6.8,
  "fiberG": 1.8,
  "sodiumMg": 580.0,
  "components": [
   {
    "name": "Thịt gà",
    "grams": 90.0
   },
   {
    "name": "Nấm đông cô",
    "grams": 50.0
   },
   {
    "name": "Dầu, gia vị",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000230",
  "category": "Món Mặn - Gia Cầm",
  "name": "Vịt xào sả ớt",
  "ingredientsText": "Thịt vịt lọc xương, sả, ớt",
  "servingGrams": 130.0,
  "kcal": 280.0,
  "proteinG": 18.5,
  "fatG": 21.0,
  "carbG": 4.2,
  "fiberG": 0.8,
  "sodiumMg": 690.0,
  "components": [
   {
    "name": "Thịt vịt",
    "grams": 110.0
   },
   {
    "name": "Sả",
    "grams": 10.0
   },
   {
    "name": "Ớt",
    "grams": 2.0
   },
   {
    "name": "Dầu, nước mắm",
    "grams": 8.0
   }
  ]
 },
 {
  "code": "VPF-000231",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá diêu hồng chiên xù",
  "ingredientsText": "Cá diêu hồng nguyên con chiên",
  "servingGrams": 120.0,
  "kcal": 230.0,
  "proteinG": 19.2,
  "fatG": 15.8,
  "carbG": 2.8,
  "fiberG": null,
  "sodiumMg": 120.0,
  "components": [
   {
    "name": "Cá diêu hồng",
    "grams": 105.0
   },
   {
    "name": "Bột chiên xù, dầu",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000232",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá lóc hấp bầu",
  "ingredientsText": "Cá lóc tươi, quả bầu",
  "servingGrams": 200.0,
  "kcal": 145.0,
  "proteinG": 18.8,
  "fatG": 4.5,
  "carbG": 7.2,
  "fiberG": 1.2,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Cá lóc",
    "grams": 110.0
   },
   {
    "name": "Quả bầu",
    "grams": 80.0
   },
   {
    "name": "Gừng, hành",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000233",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá rô kho tộ",
  "ingredientsText": "Cá rô đồng, nước mắm, tiêu",
  "servingGrams": 100.0,
  "kcal": 155.0,
  "proteinG": 17.8,
  "fatG": 6.8,
  "carbG": 5.5,
  "fiberG": null,
  "sodiumMg": 880.0,
  "components": [
   {
    "name": "Cá rô đồng",
    "grams": 85.0
   },
   {
    "name": "Nước mắm, đường",
    "grams": 12.0
   },
   {
    "name": "Tiêu, hành",
    "grams": 3.0
   }
  ]
 },
 {
  "code": "VPF-000234",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Chả mực Hạ Long",
  "ingredientsText": "Thịt mực giã tay, thì là, gia vị",
  "servingGrams": 100.0,
  "kcal": 225.0,
  "proteinG": 16.5,
  "fatG": 15.2,
  "carbG": 5.5,
  "fiberG": 0.2,
  "sodiumMg": 820.0,
  "components": [
   {
    "name": "Thịt mực giã",
    "grams": 90.0
   },
   {
    "name": "Thì là",
    "grams": 3.0
   },
   {
    "name": "Dầu (thấm)",
    "grams": 7.0
   }
  ]
 },
 {
  "code": "VPF-000235",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Tôm xào bông cải",
  "ingredientsText": "Tôm bóc vỏ, bông cải xanh",
  "servingGrams": 150.0,
  "kcal": 135.0,
  "proteinG": 16.2,
  "fatG": 4.2,
  "carbG": 8.0,
  "fiberG": 2.2,
  "sodiumMg": 450.0,
  "components": [
   {
    "name": "Tôm bóc vỏ",
    "grams": 70.0
   },
   {
    "name": "Bông cải xanh",
    "grams": 70.0
   },
   {
    "name": "Dầu, tỏi",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000236",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Càng cua bách hoa",
  "ingredientsText": "Thịt cua, giò sống bọc càng cua",
  "servingGrams": 120.0,
  "kcal": 210.0,
  "proteinG": 18.2,
  "fatG": 12.5,
  "carbG": 6.0,
  "fiberG": 0.3,
  "sodiumMg": 650.0,
  "components": [
   {
    "name": "Thịt cua",
    "grams": 40.0
   },
   {
    "name": "Giò sống (tôm, thịt)",
    "grams": 50.0
   },
   {
    "name": "Bột chiên, dầu",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000237",
  "category": "Món Rau & Xào",
  "name": "Rau mầm xào thịt bò",
  "ingredientsText": "Rau mầm cải đắng, thịt bò",
  "servingGrams": 140.0,
  "kcal": 140.0,
  "proteinG": 12.8,
  "fatG": 7.2,
  "carbG": 6.0,
  "fiberG": 1.9,
  "sodiumMg": 380.0,
  "components": [
   {
    "name": "Rau mầm",
    "grams": 80.0
   },
   {
    "name": "Thịt bò",
    "grams": 50.0
   },
   {
    "name": "Dầu, tỏi",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000238",
  "category": "Món Rau & Xào",
  "name": "Đậu cô ve xào thịt lợn",
  "ingredientsText": "Đậu cô ve tươi, thịt lợn băm",
  "servingGrams": 150.0,
  "kcal": 142.0,
  "proteinG": 8.5,
  "fatG": 8.2,
  "carbG": 8.8,
  "fiberG": 2.4,
  "sodiumMg": 420.0,
  "components": [
   {
    "name": "Đậu cô ve",
    "grams": 100.0
   },
   {
    "name": "Thịt lợn băm",
    "grams": 40.0
   },
   {
    "name": "Dầu ăn",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000239",
  "category": "Món Rau & Xào",
  "name": "Cà bát muối xổi",
  "ingredientsText": "Cà bát tươi, ớt, tỏi, dấm",
  "servingGrams": 100.0,
  "kcal": 28.0,
  "proteinG": 1.2,
  "fatG": 0.2,
  "carbG": 5.3,
  "fiberG": 1.5,
  "sodiumMg": 890.0,
  "components": [
   {
    "name": "Cà bát",
    "grams": 90.0
   },
   {
    "name": "Ớt, tỏi",
    "grams": 4.0
   },
   {
    "name": "Giấm, muối",
    "grams": 6.0
   }
  ]
 },
 {
  "code": "VPF-000240",
  "category": "Món Canh & Súp",
  "name": "Canh tần xá (Cải cúc) thịt băm",
  "ingredientsText": "Rau cải cúc, thịt lợn băm",
  "servingGrams": 250.0,
  "kcal": 78.0,
  "proteinG": 6.5,
  "fatG": 2.2,
  "carbG": 8.0,
  "fiberG": 1.6,
  "sodiumMg": 410.0,
  "components": [
   {
    "name": "Cải cúc",
    "grams": 60.0
   },
   {
    "name": "Thịt lợn băm",
    "grams": 25.0
   },
   {
    "name": "Nước canh",
    "grams": 165.0
   }
  ]
 },
 {
  "code": "VPF-000241",
  "category": "Món Canh & Súp",
  "name": "Canh hẹ nấu đậu hũ thịt băm",
  "ingredientsText": "Rau hẹ, đậu hũ non, thịt băm",
  "servingGrams": 250.0,
  "kcal": 95.0,
  "proteinG": 8.8,
  "fatG": 4.2,
  "carbG": 5.5,
  "fiberG": 1.4,
  "sodiumMg": 430.0,
  "components": [
   {
    "name": "Rau hẹ",
    "grams": 30.0
   },
   {
    "name": "Đậu hũ non",
    "grams": 60.0
   },
   {
    "name": "Thịt băm",
    "grams": 25.0
   },
   {
    "name": "Nước canh",
    "grams": 135.0
   }
  ]
 },
 {
  "code": "VPF-000242",
  "category": "Món Canh & Súp",
  "name": "Canh giò heo hầm đu đủ",
  "ingredientsText": "Giò heo, đu đủ xanh hầm",
  "servingGrams": 300.0,
  "kcal": 280.0,
  "proteinG": 16.5,
  "fatG": 18.2,
  "carbG": 12.5,
  "fiberG": 1.8,
  "sodiumMg": 620.0,
  "components": [
   {
    "name": "Giò heo",
    "grams": 100.0
   },
   {
    "name": "Đu đủ xanh",
    "grams": 70.0
   },
   {
    "name": "Nước hầm",
    "grams": 130.0
   }
  ]
 },
 {
  "code": "VPF-000243",
  "category": "Món Lẩu",
  "name": "Lẩu cá lăng nấu măng chua",
  "ingredientsText": "Cá lăng, măng chua, bún tươi",
  "servingGrams": 450.0,
  "kcal": 360.0,
  "proteinG": 22.8,
  "fatG": 12.5,
  "carbG": 39.0,
  "fiberG": 2.4,
  "sodiumMg": 1350.0,
  "components": [
   {
    "name": "Cá lăng",
    "grams": 120.0
   },
   {
    "name": "Măng chua",
    "grams": 60.0
   },
   {
    "name": "Bún",
    "grams": 100.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   },
   {
    "name": "Nước lẩu",
    "grams": 150.0
   }
  ]
 },
 {
  "code": "VPF-000244",
  "category": "Món Lẩu",
  "name": "Lẩu bò nhúng dấm",
  "ingredientsText": "Thịt bò thăn, nước dấm dừa, bánh tráng",
  "servingGrams": 400.0,
  "kcal": 390.0,
  "proteinG": 28.5,
  "fatG": 14.2,
  "carbG": 36.8,
  "fiberG": 1.5,
  "sodiumMg": 1180.0,
  "components": [
   {
    "name": "Thịt bò thăn",
    "grams": 130.0
   },
   {
    "name": "Bánh tráng",
    "grams": 30.0
   },
   {
    "name": "Rau sống",
    "grams": 50.0
   },
   {
    "name": "Nước dấm dừa (thấm)",
    "grams": 160.0
   },
   {
    "name": "Mắm nêm",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000245",
  "category": "Món Cuốn & Gỏi",
  "name": "Bánh tráng cuốn thịt heo ĐN",
  "ingredientsText": "Bánh tráng, thịt heo quay/luộc, rau mắm",
  "servingGrams": 200.0,
  "kcal": 380.0,
  "proteinG": 16.5,
  "fatG": 18.2,
  "carbG": 37.5,
  "fiberG": 2.2,
  "sodiumMg": 890.0,
  "components": [
   {
    "name": "Bánh tráng",
    "grams": 40.0
   },
   {
    "name": "Thịt heo luộc",
    "grams": 80.0
   },
   {
    "name": "Rau sống",
    "grams": 50.0
   },
   {
    "name": "Mắm nêm",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000246",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh giầy kẹp chả",
  "ingredientsText": "Bánh giầy nếp, chả lụa",
  "servingGrams": 150.0,
  "kcal": 360.0,
  "proteinG": 11.2,
  "fatG": 9.8,
  "carbG": 56.8,
  "fiberG": 0.5,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Bánh giầy",
    "grams": 100.0
   },
   {
    "name": "Chả lụa",
    "grams": 50.0
   }
  ]
 },
 {
  "code": "VPF-000247",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh tôm Hồ Tây",
  "ingredientsText": "Tôm tươi, bột khoai lang chiên",
  "servingGrams": 150.0,
  "kcal": 340.0,
  "proteinG": 11.5,
  "fatG": 16.8,
  "carbG": 35.8,
  "fiberG": 1.1,
  "sodiumMg": 520.0,
  "components": [
   {
    "name": "Tôm tươi",
    "grams": 40.0
   },
   {
    "name": "Khoai lang",
    "grams": 60.0
   },
   {
    "name": "Bột mì",
    "grams": 20.0
   },
   {
    "name": "Dầu (thấm)",
    "grams": 20.0
   },
   {
    "name": "Rau sống",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000248",
  "category": "Món Tráng Miệng",
  "name": "Chè sương sa hạt lựu",
  "ingredientsText": "Sương sa, hạt lựu bột năng, nước cốt dừa",
  "servingGrams": 150.0,
  "kcal": 210.0,
  "proteinG": 2.5,
  "fatG": 4.8,
  "carbG": 39.2,
  "fiberG": 1.0,
  "sodiumMg": 32.0,
  "components": [
   {
    "name": "Sương sa",
    "grams": 40.0
   },
   {
    "name": "Hạt lựu bột năng",
    "grams": 30.0
   },
   {
    "name": "Nước cốt dừa",
    "grams": 20.0
   },
   {
    "name": "Đường",
    "grams": 20.0
   },
   {
    "name": "Nước, đá",
    "grams": 40.0
   }
  ]
 },
 {
  "code": "VPF-000249",
  "category": "Trái Cây Tươi",
  "name": "Chôm chôm tươi",
  "ingredientsText": "Chôm chôm bóc vỏ",
  "servingGrams": 100.0,
  "kcal": 82.0,
  "proteinG": 0.9,
  "fatG": 0.2,
  "carbG": 20.8,
  "fiberG": 0.9,
  "sodiumMg": 2.0,
  "components": [
   {
    "name": "Chôm chôm bóc vỏ",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000250",
  "category": "Trái Cây Tươi",
  "name": "Hồng xiêm (Sô-pô-chê)",
  "ingredientsText": "Hồng xiêm chín mềm",
  "servingGrams": 100.0,
  "kcal": 83.0,
  "proteinG": 0.4,
  "fatG": 1.1,
  "carbG": 19.9,
  "fiberG": 5.3,
  "sodiumMg": 12.0,
  "components": [
   {
    "name": "Hồng xiêm chín mềm",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000251",
  "category": "Lương thực & Ngũ cốc",
  "name": "Ý dĩ (Hạt cườm)",
  "ingredientsText": "Hạt ý dĩ khô",
  "servingGrams": 100.0,
  "kcal": 382.0,
  "proteinG": 13.0,
  "fatG": 3.1,
  "carbG": 75.5,
  "fiberG": 3.2,
  "sodiumMg": 8.0,
  "components": [
   {
    "name": "Hạt ý dĩ khô",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000252",
  "category": "Lương thực & Ngũ cốc",
  "name": "Hạt kề tươi",
  "ingredientsText": "Hạt kê vàng xát vỏ",
  "servingGrams": 100.0,
  "kcal": 361.0,
  "proteinG": 9.8,
  "fatG": 3.5,
  "carbG": 72.8,
  "fiberG": 3.0,
  "sodiumMg": 6.0,
  "components": [
   {
    "name": "Hạt kê vàng xát vỏ",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000253",
  "category": "Món Cơm",
  "name": "Cơm chiên trái dừa",
  "ingredientsText": "Cơm, tôm, cơm dừa, hạt sen",
  "servingGrams": 280.0,
  "kcal": 495.0,
  "proteinG": 15.8,
  "fatG": 19.5,
  "carbG": 64.2,
  "fiberG": 2.1,
  "sodiumMg": 620.0,
  "components": [
   {
    "name": "Cơm",
    "grams": 170.0
   },
   {
    "name": "Tôm",
    "grams": 40.0
   },
   {
    "name": "Cơm dừa",
    "grams": 30.0
   },
   {
    "name": "Hạt sen",
    "grams": 20.0
   },
   {
    "name": "Dầu",
    "grams": 15.0
   },
   {
    "name": "Rau củ",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000254",
  "category": "Món Cơm",
  "name": "Cơm cháy chà bông",
  "ingredientsText": "Cơm cháy giòn, chà bông heo, mỡ hành",
  "servingGrams": 150.0,
  "kcal": 460.0,
  "proteinG": 14.2,
  "fatG": 18.5,
  "carbG": 59.2,
  "fiberG": 0.8,
  "sodiumMg": 850.0,
  "components": [
   {
    "name": "Cơm cháy",
    "grams": 110.0
   },
   {
    "name": "Chà bông",
    "grams": 25.0
   },
   {
    "name": "Mỡ hành",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000255",
  "category": "Món Xôi",
  "name": "Xôi bắp (Xôi ngô)",
  "ingredientsText": "Gạo nếp, bắp hầm, đậu xanh, mỡ hành",
  "servingGrams": 180.0,
  "kcal": 410.0,
  "proteinG": 8.5,
  "fatG": 10.2,
  "carbG": 71.0,
  "fiberG": 2.8,
  "sodiumMg": 210.0,
  "components": [
   {
    "name": "Gạo nếp (xôi chín)",
    "grams": 100.0
   },
   {
    "name": "Bắp hầm",
    "grams": 40.0
   },
   {
    "name": "Đậu xanh",
    "grams": 25.0
   },
   {
    "name": "Mỡ hành",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000256",
  "category": "Món Xôi",
  "name": "Xôi dừa ngọt",
  "ingredientsText": "Gạo nếp, dừa nạo, đường, mè rang",
  "servingGrams": 120.0,
  "kcal": 390.0,
  "proteinG": 6.2,
  "fatG": 12.8,
  "carbG": 62.5,
  "fiberG": 1.8,
  "sodiumMg": 25.0,
  "components": [
   {
    "name": "Gạo nếp (xôi chín)",
    "grams": 85.0
   },
   {
    "name": "Dừa nạo",
    "grams": 20.0
   },
   {
    "name": "Đường",
    "grams": 10.0
   },
   {
    "name": "Mè rang",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000257",
  "category": "Món Cháo",
  "name": "Cháo bò băm",
  "ingredientsText": "Gạo tẻ, thịt bò băm, hành gừng",
  "servingGrams": 350.0,
  "kcal": 290.0,
  "proteinG": 17.5,
  "fatG": 7.2,
  "carbG": 38.8,
  "fiberG": 0.4,
  "sodiumMg": 650.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 290.0
   },
   {
    "name": "Thịt bò băm",
    "grams": 50.0
   },
   {
    "name": "Hành, gừng",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000258",
  "category": "Món Cháo",
  "name": "Cháo hàu sữa",
  "ingredientsText": "Gạo tẻ, thịt hàu sữa tươi, hành phi",
  "servingGrams": 350.0,
  "kcal": 280.0,
  "proteinG": 13.5,
  "fatG": 8.2,
  "carbG": 38.0,
  "fiberG": 0.5,
  "sodiumMg": 580.0,
  "components": [
   {
    "name": "Cháo gạo",
    "grams": 285.0
   },
   {
    "name": "Thịt hàu sữa",
    "grams": 50.0
   },
   {
    "name": "Hành phi",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000259",
  "category": "Món Phở",
  "name": "Phở tái chín gầu",
  "ingredientsText": "Bánh phở, bò tái, bò chín, nạm gầu",
  "servingGrams": 450.0,
  "kcal": 510.0,
  "proteinG": 22.5,
  "fatG": 18.2,
  "carbG": 64.0,
  "fiberG": 0.8,
  "sodiumMg": 1180.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 200.0
   },
   {
    "name": "Bò tái",
    "grams": 30.0
   },
   {
    "name": "Bò chín",
    "grams": 30.0
   },
   {
    "name": "Nạm gầu",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 145.0
   },
   {
    "name": "Hành, rau",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000260",
  "category": "Món Phở",
  "name": "Phở áp chảo",
  "ingredientsText": "Bánh phở chiên giòn, thịt bò xào rau",
  "servingGrams": 350.0,
  "kcal": 560.0,
  "proteinG": 21.5,
  "fatG": 22.8,
  "carbG": 67.2,
  "fiberG": 1.8,
  "sodiumMg": 950.0,
  "components": [
   {
    "name": "Bánh phở chiên",
    "grams": 150.0
   },
   {
    "name": "Thịt bò",
    "grams": 70.0
   },
   {
    "name": "Rau cải, cà chua",
    "grams": 80.0
   },
   {
    "name": "Dầu ăn",
    "grams": 20.0
   },
   {
    "name": "Sốt",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000261",
  "category": "Món Bún",
  "name": "Bún hến Huế",
  "ingredientsText": "Bún tươi, thịt hến xào, mắm ruốc, rau thơm",
  "servingGrams": 350.0,
  "kcal": 360.0,
  "proteinG": 14.8,
  "fatG": 7.5,
  "carbG": 58.2,
  "fiberG": 2.2,
  "sodiumMg": 920.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 170.0
   },
   {
    "name": "Thịt hến xào",
    "grams": 50.0
   },
   {
    "name": "Mắm ruốc",
    "grams": 10.0
   },
   {
    "name": "Rau thơm, bắp chuối",
    "grams": 60.0
   },
   {
    "name": "Lạc, tóp mỡ",
    "grams": 15.0
   },
   {
    "name": "Nước hến",
    "grams": 45.0
   }
  ]
 },
 {
  "code": "VPF-000262",
  "category": "Món Bún",
  "name": "Bún sườn chua",
  "ingredientsText": "Bún tươi, sườn heo, dọc mùng, quả sấu",
  "servingGrams": 450.0,
  "kcal": 410.0,
  "proteinG": 18.5,
  "fatG": 12.8,
  "carbG": 55.0,
  "fiberG": 1.8,
  "sodiumMg": 1080.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 200.0
   },
   {
    "name": "Sườn heo",
    "grams": 60.0
   },
   {
    "name": "Dọc mùng",
    "grams": 30.0
   },
   {
    "name": "Quả sấu",
    "grams": 15.0
   },
   {
    "name": "Nước dùng",
    "grams": 135.0
   },
   {
    "name": "Rau",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000263",
  "category": "Món Bún",
  "name": "Bún bò Nam Bộ",
  "ingredientsText": "Bún tươi, thịt bò xào tỏi, lạc, giá đỗ",
  "servingGrams": 350.0,
  "kcal": 460.0,
  "proteinG": 20.2,
  "fatG": 16.5,
  "carbG": 57.8,
  "fiberG": 2.1,
  "sodiumMg": 850.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 150.0
   },
   {
    "name": "Thịt bò xào",
    "grams": 80.0
   },
   {
    "name": "Lạc rang",
    "grams": 15.0
   },
   {
    "name": "Giá đỗ, rau sống",
    "grams": 60.0
   },
   {
    "name": "Nước mắm pha",
    "grams": 45.0
   }
  ]
 },
 {
  "code": "VPF-000264",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Hủ tiếu mực",
  "ingredientsText": "Hủ tiếu, mực tươi, thịt băm, hành hẹ",
  "servingGrams": 450.0,
  "kcal": 395.0,
  "proteinG": 19.8,
  "fatG": 7.8,
  "carbG": 61.2,
  "fiberG": 1.0,
  "sodiumMg": 1120.0,
  "components": [
   {
    "name": "Hủ tiếu",
    "grams": 180.0
   },
   {
    "name": "Mực tươi",
    "grams": 50.0
   },
   {
    "name": "Thịt băm",
    "grams": 30.0
   },
   {
    "name": "Nước lèo",
    "grams": 170.0
   },
   {
    "name": "Hành hẹ",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000265",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Mỳ vịt tiềm",
  "ingredientsText": "Mỳ trứng, đùi vịt tiềm thuốc bắc, cải thìa",
  "servingGrams": 500.0,
  "kcal": 580.0,
  "proteinG": 26.5,
  "fatG": 24.2,
  "carbG": 63.8,
  "fiberG": 2.0,
  "sodiumMg": 1250.0,
  "components": [
   {
    "name": "Mỳ trứng",
    "grams": 150.0
   },
   {
    "name": "Đùi vịt tiềm",
    "grams": 150.0
   },
   {
    "name": "Cải thìa",
    "grams": 40.0
   },
   {
    "name": "Nước tiềm",
    "grams": 160.0
   }
  ]
 },
 {
  "code": "VPF-000266",
  "category": "Món Miến & Bánh Canh",
  "name": "Miến xào hải sản",
  "ingredientsText": "Miến xào, tôm, mực, giá đỗ, cần tây",
  "servingGrams": 300.0,
  "kcal": 440.0,
  "proteinG": 19.2,
  "fatG": 14.5,
  "carbG": 58.2,
  "fiberG": 2.0,
  "sodiumMg": 880.0,
  "components": [
   {
    "name": "Miến",
    "grams": 150.0
   },
   {
    "name": "Tôm",
    "grams": 40.0
   },
   {
    "name": "Mực",
    "grams": 40.0
   },
   {
    "name": "Giá đỗ",
    "grams": 30.0
   },
   {
    "name": "Cần tây",
    "grams": 20.0
   },
   {
    "name": "Dầu",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000267",
  "category": "Món Miến & Bánh Canh",
  "name": "Bánh canh ghẹ",
  "ingredientsText": "Bánh canh, thịt ghẹ tươi, chả cá",
  "servingGrams": 450.0,
  "kcal": 410.0,
  "proteinG": 21.5,
  "fatG": 8.8,
  "carbG": 61.0,
  "fiberG": 0.9,
  "sodiumMg": 1080.0,
  "components": [
   {
    "name": "Bánh canh",
    "grams": 200.0
   },
   {
    "name": "Thịt ghẹ",
    "grams": 50.0
   },
   {
    "name": "Chả cá",
    "grams": 40.0
   },
   {
    "name": "Nước dùng",
    "grams": 140.0
   },
   {
    "name": "Hành, ngò",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000268",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt heo xào mắm quẹt",
  "ingredientsText": "Thịt ba chỉ thái mỏng, mắm quẹt",
  "servingGrams": 120.0,
  "kcal": 320.0,
  "proteinG": 14.2,
  "fatG": 26.5,
  "carbG": 6.2,
  "fiberG": null,
  "sodiumMg": 980.0,
  "components": [
   {
    "name": "Thịt ba chỉ",
    "grams": 100.0
   },
   {
    "name": "Mắm quẹt",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000269",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Chả đút khuôn (Chả quế)",
  "ingredientsText": "Thịt heo quết mịn, bột quế nướng",
  "servingGrams": 100.0,
  "kcal": 245.0,
  "proteinG": 16.0,
  "fatG": 18.5,
  "carbG": 3.2,
  "fiberG": null,
  "sodiumMg": 820.0,
  "components": [
   {
    "name": "Thịt heo quết",
    "grams": 95.0
   },
   {
    "name": "Bột quế, gia vị",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000270",
  "category": "Món Mặn - Thịt Bò",
  "name": "Bò nướng lá lốt",
  "ingredientsText": "Thịt bò băm, lá lốt cuốn nướng",
  "servingGrams": 120.0,
  "kcal": 255.0,
  "proteinG": 18.2,
  "fatG": 17.5,
  "carbG": 5.8,
  "fiberG": 1.1,
  "sodiumMg": 520.0,
  "components": [
   {
    "name": "Thịt bò băm",
    "grams": 95.0
   },
   {
    "name": "Lá lốt",
    "grams": 15.0
   },
   {
    "name": "Mỡ chài, dầu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000271",
  "category": "Món Mặn - Thịt Bò",
  "name": "Bò cuộn nấm kim chi",
  "ingredientsText": "Thịt bò thái mỏng cuộn nấm kim châm",
  "servingGrams": 150.0,
  "kcal": 190.0,
  "proteinG": 19.5,
  "fatG": 10.2,
  "carbG": 4.8,
  "fiberG": 1.5,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Thịt bò thái mỏng",
    "grams": 100.0
   },
   {
    "name": "Nấm kim châm",
    "grams": 45.0
   },
   {
    "name": "Dầu, sốt",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000272",
  "category": "Món Mặn - Gia Cầm",
  "name": "Gà xào sả ớt",
  "ingredientsText": "Thịt gà chặt cắn, sả, ớt tươi",
  "servingGrams": 130.0,
  "kcal": 245.0,
  "proteinG": 19.2,
  "fatG": 16.0,
  "carbG": 6.0,
  "fiberG": 0.8,
  "sodiumMg": 710.0,
  "components": [
   {
    "name": "Thịt gà",
    "grams": 110.0
   },
   {
    "name": "Sả",
    "grams": 8.0
   },
   {
    "name": "Ớt",
    "grams": 2.0
   },
   {
    "name": "Dầu, nước mắm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000273",
  "category": "Món Mặn - Gia Cầm",
  "name": "Cánh gà chiên bơ tỏi",
  "ingredientsText": "Cánh gà, bơ, tỏi phi giòn",
  "servingGrams": 130.0,
  "kcal": 330.0,
  "proteinG": 18.5,
  "fatG": 23.5,
  "carbG": 11.2,
  "fiberG": null,
  "sodiumMg": 780.0,
  "components": [
   {
    "name": "Cánh gà",
    "grams": 105.0
   },
   {
    "name": "Bơ",
    "grams": 10.0
   },
   {
    "name": "Tỏi phi",
    "grams": 10.0
   },
   {
    "name": "Bột",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000274",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá basa kho tộ",
  "ingredientsText": "Thịt cá basa, nước mắm, mỡ",
  "servingGrams": 120.0,
  "kcal": 210.0,
  "proteinG": 16.2,
  "fatG": 14.8,
  "carbG": 3.2,
  "fiberG": null,
  "sodiumMg": 790.0,
  "components": [
   {
    "name": "Thịt cá basa",
    "grams": 100.0
   },
   {
    "name": "Nước mắm, đường",
    "grams": 12.0
   },
   {
    "name": "Mỡ",
    "grams": 8.0
   }
  ]
 },
 {
  "code": "VPF-000275",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá lóc nướng trui",
  "ingredientsText": "Cá lóc nguyên con nướng rơm",
  "servingGrams": 120.0,
  "kcal": 150.0,
  "proteinG": 20.2,
  "fatG": 7.2,
  "carbG": 0.0,
  "fiberG": null,
  "sodiumMg": 180.0,
  "components": [
   {
    "name": "Cá lóc",
    "grams": 115.0
   },
   {
    "name": "Muối ớt",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000276",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Tôm kho đánh",
  "ingredientsText": "Tôm bóc vỏ, gạch tôm kho sệt",
  "servingGrams": 100.0,
  "kcal": 155.0,
  "proteinG": 18.2,
  "fatG": 6.5,
  "carbG": 5.8,
  "fiberG": null,
  "sodiumMg": 820.0,
  "components": [
   {
    "name": "Tôm bóc vỏ",
    "grams": 85.0
   },
   {
    "name": "Gạch tôm, nước kho",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000277",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Mực hấp gừng",
  "ingredientsText": "Mực tươi, gừng thái chỉ, hành lá",
  "servingGrams": 120.0,
  "kcal": 110.0,
  "proteinG": 18.0,
  "fatG": 1.8,
  "carbG": 5.2,
  "fiberG": 0.4,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Mực tươi",
    "grams": 105.0
   },
   {
    "name": "Gừng",
    "grams": 8.0
   },
   {
    "name": "Hành lá",
    "grams": 7.0
   }
  ]
 },
 {
  "code": "VPF-000278",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Sò điệp nướng mỡ hành",
  "ingredientsText": "Thịt sò điệp, mỡ hành, lạc",
  "servingGrams": 120.0,
  "kcal": 175.0,
  "proteinG": 14.5,
  "fatG": 11.2,
  "carbG": 4.2,
  "fiberG": 0.5,
  "sodiumMg": 490.0,
  "components": [
   {
    "name": "Thịt sò điệp",
    "grams": 90.0
   },
   {
    "name": "Mỡ hành",
    "grams": 20.0
   },
   {
    "name": "Lạc",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000279",
  "category": "Món Rau & Xào",
  "name": "Đậu hũ dồn thịt sốt cà",
  "ingredientsText": "Đậu hũ, thịt heo băm, cà chua",
  "servingGrams": 160.0,
  "kcal": 185.0,
  "proteinG": 12.8,
  "fatG": 12.0,
  "carbG": 6.5,
  "fiberG": 1.1,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Đậu hũ",
    "grams": 80.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 40.0
   },
   {
    "name": "Cà chua",
    "grams": 30.0
   },
   {
    "name": "Dầu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000280",
  "category": "Món Rau & Xào",
  "name": "Bắp cải xào thịt heo",
  "ingredientsText": "Bắp cải tươi, thịt heo nạc",
  "servingGrams": 150.0,
  "kcal": 125.0,
  "proteinG": 7.8,
  "fatG": 7.5,
  "carbG": 6.8,
  "fiberG": 1.8,
  "sodiumMg": 380.0,
  "components": [
   {
    "name": "Bắp cải",
    "grams": 100.0
   },
   {
    "name": "Thịt heo nạc",
    "grams": 40.0
   },
   {
    "name": "Dầu ăn",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000281",
  "category": "Món Canh & Súp",
  "name": "Canh tần xá nấu nghêu",
  "ingredientsText": "Cải cúc, thịt nghêu tươi",
  "servingGrams": 250.0,
  "kcal": 82.0,
  "proteinG": 8.5,
  "fatG": 2.1,
  "carbG": 7.2,
  "fiberG": 1.5,
  "sodiumMg": 520.0,
  "components": [
   {
    "name": "Cải cúc",
    "grams": 60.0
   },
   {
    "name": "Thịt nghêu",
    "grams": 40.0
   },
   {
    "name": "Nước canh",
    "grams": 150.0
   }
  ]
 },
 {
  "code": "VPF-000282",
  "category": "Món Canh & Súp",
  "name": "Canh mìn chèn (Măng chua cá)",
  "ingredientsText": "Cá biển, măng chua, cà chua",
  "servingGrams": 250.0,
  "kcal": 125.0,
  "proteinG": 12.2,
  "fatG": 4.8,
  "carbG": 8.2,
  "fiberG": 1.8,
  "sodiumMg": 580.0,
  "components": [
   {
    "name": "Cá biển",
    "grams": 70.0
   },
   {
    "name": "Măng chua",
    "grams": 50.0
   },
   {
    "name": "Cà chua",
    "grams": 30.0
   },
   {
    "name": "Nước canh",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000283",
  "category": "Món Lẩu",
  "name": "Lẩu mắm U Minh",
  "ingredientsText": "Mắm cá sặc, cá lóc, lợn quay, rau đắng",
  "servingGrams": 450.0,
  "kcal": 430.0,
  "proteinG": 25.8,
  "fatG": 17.2,
  "carbG": 42.5,
  "fiberG": 3.5,
  "sodiumMg": 1720.0,
  "components": [
   {
    "name": "Mắm cá sặc",
    "grams": 25.0
   },
   {
    "name": "Cá lóc",
    "grams": 60.0
   },
   {
    "name": "Lợn quay",
    "grams": 50.0
   },
   {
    "name": "Rau đắng, rau lẩu",
    "grams": 70.0
   },
   {
    "name": "Bún",
    "grams": 100.0
   },
   {
    "name": "Nước lẩu",
    "grams": 145.0
   }
  ]
 },
 {
  "code": "VPF-000284",
  "category": "Món Cuốn & Gỏi",
  "name": "Gỏi cá trích Kiên Giang",
  "ingredientsText": "Thịt cá trích tươi, dừa nạo, giấm",
  "servingGrams": 150.0,
  "kcal": 210.0,
  "proteinG": 18.5,
  "fatG": 12.8,
  "carbG": 5.2,
  "fiberG": 1.2,
  "sodiumMg": 520.0,
  "components": [
   {
    "name": "Thịt cá trích",
    "grams": 90.0
   },
   {
    "name": "Dừa nạo",
    "grams": 20.0
   },
   {
    "name": "Bánh tráng, rau",
    "grams": 30.0
   },
   {
    "name": "Giấm, nước chấm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000285",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh căn Nha Trang",
  "ingredientsText": "Bột gạo, trứng cút/tôm, mỡ hành",
  "servingGrams": 150.0,
  "kcal": 280.0,
  "proteinG": 11.2,
  "fatG": 12.5,
  "carbG": 30.5,
  "fiberG": 0.8,
  "sodiumMg": 450.0,
  "components": [
   {
    "name": "Bột gạo",
    "grams": 90.0
   },
   {
    "name": "Trứng cút/tôm",
    "grams": 35.0
   },
   {
    "name": "Mỡ hành",
    "grams": 15.0
   },
   {
    "name": "Nước chấm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000286",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh cống Sóc Trăng",
  "ingredientsText": "Bột đậu đậu xanh, tôm nguyên con",
  "servingGrams": 150.0,
  "kcal": 350.0,
  "proteinG": 12.5,
  "fatG": 18.2,
  "carbG": 34.0,
  "fiberG": 1.8,
  "sodiumMg": 510.0,
  "components": [
   {
    "name": "Bột mì + đậu xanh",
    "grams": 70.0
   },
   {
    "name": "Tôm nguyên con",
    "grams": 30.0
   },
   {
    "name": "Thịt heo",
    "grams": 15.0
   },
   {
    "name": "Dầu (thấm)",
    "grams": 20.0
   },
   {
    "name": "Khoai môn",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000287",
  "category": "Món Tráng Miệng",
  "name": "Chè bà ba Miền Tây",
  "ingredientsText": "Khoai khoai môn, đậu xanh, nước cốt dừa",
  "servingGrams": 150.0,
  "kcal": 260.0,
  "proteinG": 4.5,
  "fatG": 7.2,
  "carbG": 44.5,
  "fiberG": 2.1,
  "sodiumMg": 38.0,
  "components": [
   {
    "name": "Khoai môn, khoai lang",
    "grams": 40.0
   },
   {
    "name": "Đậu xanh",
    "grams": 20.0
   },
   {
    "name": "Nước cốt dừa",
    "grams": 25.0
   },
   {
    "name": "Đường",
    "grams": 20.0
   },
   {
    "name": "Bột năng, nước",
    "grams": 45.0
   }
  ]
 },
 {
  "code": "VPF-000288",
  "category": "Trái Cây Tươi",
  "name": "Măng đắng tươi",
  "ingredientsText": "Măng đắng tươi luộc",
  "servingGrams": 100.0,
  "kcal": 22.0,
  "proteinG": 1.8,
  "fatG": 0.2,
  "carbG": 3.2,
  "fiberG": 2.1,
  "sodiumMg": 5.0,
  "components": [
   {
    "name": "Măng đắng tươi luộc",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000289",
  "category": "Trái Cây Tươi",
  "name": "Thị chín",
  "ingredientsText": "Thị vàng chín thơm",
  "servingGrams": 100.0,
  "kcal": 68.0,
  "proteinG": 0.8,
  "fatG": 0.3,
  "carbG": 15.6,
  "fiberG": 2.5,
  "sodiumMg": 4.0,
  "components": [
   {
    "name": "Thị vàng chín thơm",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000290",
  "category": "Trái Cây Tươi",
  "name": "Sấu quả tươi",
  "ingredientsText": "Sấu quả tươi gọt vỏ",
  "servingGrams": 100.0,
  "kcal": 32.0,
  "proteinG": 1.2,
  "fatG": 0.2,
  "carbG": 6.4,
  "fiberG": 1.8,
  "sodiumMg": 3.0,
  "components": [
   {
    "name": "Sấu quả tươi gọt vỏ",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000291",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Mắm ruốc Huế",
  "ingredientsText": "Tép biển ủ muối lên men",
  "servingGrams": 100.0,
  "kcal": 85.0,
  "proteinG": 15.5,
  "fatG": 1.5,
  "carbG": 2.1,
  "fiberG": null,
  "sodiumMg": 8100.0,
  "components": [
   {
    "name": "Tép biển ủ muối lên men",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000292",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Mắm cá linh",
  "ingredientsText": "Cá linh muối xối",
  "servingGrams": 100.0,
  "kcal": 110.0,
  "proteinG": 16.8,
  "fatG": 3.2,
  "carbG": 3.5,
  "fiberG": null,
  "sodiumMg": 8500.0,
  "components": [
   {
    "name": "Cá linh muối xối",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000293",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Tương Bần",
  "ingredientsText": "Đậu tương, xôi nếp lên men",
  "servingGrams": 100.0,
  "kcal": 115.0,
  "proteinG": 8.2,
  "fatG": 2.8,
  "carbG": 14.2,
  "fiberG": 1.2,
  "sodiumMg": 4200.0,
  "components": [
   {
    "name": "Đậu tương, xôi nếp lên men",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000294",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Chao đỏ (Đậu hũ nhĩ)",
  "ingredientsText": "Đậu hũ lên men rượu đỏ",
  "servingGrams": 100.0,
  "kcal": 142.0,
  "proteinG": 10.5,
  "fatG": 8.2,
  "carbG": 6.5,
  "fiberG": 0.8,
  "sodiumMg": 2800.0,
  "components": [
   {
    "name": "Đậu hũ lên men rượu đỏ",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000295",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Bơ đậu phụng (Lạc)",
  "ingredientsText": "Hạt lạc nghiền mịn",
  "servingGrams": 100.0,
  "kcal": 588.0,
  "proteinG": 25.0,
  "fatG": 50.0,
  "carbG": 20.0,
  "fiberG": 6.0,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Hạt lạc nghiền mịn",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000296",
  "category": "Lương thực & Ngũ cốc",
  "name": "Yến mạch hạt cán",
  "ingredientsText": "Hạt yến mạch nhập khẩu",
  "servingGrams": 100.0,
  "kcal": 389.0,
  "proteinG": 16.9,
  "fatG": 6.9,
  "carbG": 66.3,
  "fiberG": 10.6,
  "sodiumMg": 2.0,
  "components": [
   {
    "name": "Hạt yến mạch nhập khẩu",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000297",
  "category": "Lương thực & Ngũ cốc",
  "name": "Hạt dẻ trùng khánh",
  "ingredientsText": "Hạt dẻ hấp luộc",
  "servingGrams": 100.0,
  "kcal": 210.0,
  "proteinG": 4.2,
  "fatG": 1.2,
  "carbG": 45.5,
  "fiberG": 3.5,
  "sodiumMg": 5.0,
  "components": [
   {
    "name": "Hạt dẻ hấp luộc",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000298",
  "category": "Món Cơm",
  "name": "Cơm cháy sốt hải sản",
  "ingredientsText": "Cơm cháy giòn, sốt tôm mực",
  "servingGrams": 250.0,
  "kcal": 450.0,
  "proteinG": 15.2,
  "fatG": 14.8,
  "carbG": 64.0,
  "fiberG": 1.2,
  "sodiumMg": 820.0,
  "components": [
   {
    "name": "Cơm cháy",
    "grams": 140.0
   },
   {
    "name": "Tôm",
    "grams": 35.0
   },
   {
    "name": "Mực",
    "grams": 35.0
   },
   {
    "name": "Sốt",
    "grams": 40.0
   }
  ]
 },
 {
  "code": "VPF-000299",
  "category": "Món Phở",
  "name": "Phở bò xào giòn",
  "ingredientsText": "Bánh phở chiên giòn, bò xào sốt",
  "servingGrams": 350.0,
  "kcal": 580.0,
  "proteinG": 22.0,
  "fatG": 24.5,
  "carbG": 67.5,
  "fiberG": 1.5,
  "sodiumMg": 980.0,
  "components": [
   {
    "name": "Bánh phở chiên",
    "grams": 150.0
   },
   {
    "name": "Thịt bò",
    "grams": 70.0
   },
   {
    "name": "Rau cải",
    "grams": 70.0
   },
   {
    "name": "Dầu ăn",
    "grams": 25.0
   },
   {
    "name": "Sốt",
    "grams": 35.0
   }
  ]
 },
 {
  "code": "VPF-000300",
  "category": "Món Bún",
  "name": "Bún ốc mọc",
  "ingredientsText": "Bún, thịt ốc nhồi, mọc giò sống",
  "servingGrams": 450.0,
  "kcal": 390.0,
  "proteinG": 17.8,
  "fatG": 10.2,
  "carbG": 56.8,
  "fiberG": 1.2,
  "sodiumMg": 1150.0,
  "components": [
   {
    "name": "Bún",
    "grams": 200.0
   },
   {
    "name": "Thịt ốc nhồi",
    "grams": 40.0
   },
   {
    "name": "Mọc giò sống",
    "grams": 40.0
   },
   {
    "name": "Nước dùng",
    "grams": 150.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000301",
  "category": "Món Bún",
  "name": "Bún bò gân",
  "ingredientsText": "Bún to, gân bò hầm mềm, nước dùng spicy",
  "servingGrams": 450.0,
  "kcal": 460.0,
  "proteinG": 21.5,
  "fatG": 13.8,
  "carbG": 62.5,
  "fiberG": 1.0,
  "sodiumMg": 1280.0,
  "components": [
   {
    "name": "Bún to",
    "grams": 200.0
   },
   {
    "name": "Gân bò",
    "grams": 70.0
   },
   {
    "name": "Nước dùng",
    "grams": 160.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000302",
  "category": "Món Bún",
  "name": "Bún bò tái nạm",
  "ingredientsText": "Bún to, bò tái, nạm bò",
  "servingGrams": 450.0,
  "kcal": 470.0,
  "proteinG": 23.0,
  "fatG": 14.2,
  "carbG": 62.8,
  "fiberG": 1.0,
  "sodiumMg": 1310.0,
  "components": [
   {
    "name": "Bún to",
    "grams": 200.0
   },
   {
    "name": "Bò tái",
    "grams": 40.0
   },
   {
    "name": "Nạm bò",
    "grams": 40.0
   },
   {
    "name": "Nước dùng",
    "grams": 150.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000303",
  "category": "Món Bún",
  "name": "Bún lòng heo (Bún đèo)",
  "ingredientsText": "Bún tươi, lòng heo, dồi luộc",
  "servingGrams": 400.0,
  "kcal": 430.0,
  "proteinG": 20.8,
  "fatG": 15.5,
  "carbG": 52.0,
  "fiberG": 0.8,
  "sodiumMg": 1120.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 180.0
   },
   {
    "name": "Lòng heo",
    "grams": 50.0
   },
   {
    "name": "Dồi luộc",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 120.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000304",
  "category": "Món Bún",
  "name": "Bún hải sản",
  "ingredientsText": "Bún tươi, tôm, bề bề, mực, cải ngọt",
  "servingGrams": 450.0,
  "kcal": 420.0,
  "proteinG": 22.5,
  "fatG": 9.8,
  "carbG": 60.5,
  "fiberG": 1.8,
  "sodiumMg": 1180.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 200.0
   },
   {
    "name": "Tôm",
    "grams": 35.0
   },
   {
    "name": "Bề bề",
    "grams": 30.0
   },
   {
    "name": "Mực",
    "grams": 30.0
   },
   {
    "name": "Cải ngọt",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 125.0
   }
  ]
 },
 {
  "code": "VPF-000305",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Hủ tiếu bò kho",
  "ingredientsText": "Hủ tiếu, thịt bò hầm củ xả, cà rốt",
  "servingGrams": 450.0,
  "kcal": 495.0,
  "proteinG": 22.8,
  "fatG": 16.2,
  "carbG": 64.5,
  "fiberG": 1.8,
  "sodiumMg": 1250.0,
  "components": [
   {
    "name": "Hủ tiếu",
    "grams": 180.0
   },
   {
    "name": "Thịt bò kho",
    "grams": 80.0
   },
   {
    "name": "Cà rốt",
    "grams": 30.0
   },
   {
    "name": "Nước kho",
    "grams": 140.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000307",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Mỳ xào bò",
  "ingredientsText": "Mỳ sợi xào, thịt bò thăn, rau cải",
  "servingGrams": 350.0,
  "kcal": 520.0,
  "proteinG": 21.8,
  "fatG": 18.5,
  "carbG": 66.8,
  "fiberG": 1.9,
  "sodiumMg": 950.0,
  "components": [
   {
    "name": "Mỳ trứng",
    "grams": 180.0
   },
   {
    "name": "Thịt bò thăn",
    "grams": 70.0
   },
   {
    "name": "Rau cải",
    "grams": 70.0
   },
   {
    "name": "Dầu ăn",
    "grams": 20.0
   },
   {
    "name": "Sốt",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000308",
  "category": "Món Miến & Bánh Canh",
  "name": "Miến xào lòng gà",
  "ingredientsText": "Miến xào, tim gan mề gà, mộc nhĩ",
  "servingGrams": 300.0,
  "kcal": 410.0,
  "proteinG": 18.5,
  "fatG": 12.8,
  "carbG": 55.2,
  "fiberG": 1.8,
  "sodiumMg": 850.0,
  "components": [
   {
    "name": "Miến",
    "grams": 150.0
   },
   {
    "name": "Tim, gan, mề gà",
    "grams": 70.0
   },
   {
    "name": "Mộc nhĩ",
    "grams": 15.0
   },
   {
    "name": "Hành, giá",
    "grams": 45.0
   },
   {
    "name": "Dầu",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000309",
  "category": "Món Miến & Bánh Canh",
  "name": "Bánh canh cá lóc",
  "ingredientsText": "Bánh canh gạo, thịt cá lóc rim hành",
  "servingGrams": 450.0,
  "kcal": 385.0,
  "proteinG": 18.2,
  "fatG": 7.8,
  "carbG": 60.5,
  "fiberG": 0.8,
  "sodiumMg": 1020.0,
  "components": [
   {
    "name": "Bánh canh gạo",
    "grams": 200.0
   },
   {
    "name": "Cá lóc",
    "grams": 60.0
   },
   {
    "name": "Hành phi",
    "grams": 10.0
   },
   {
    "name": "Nước dùng",
    "grams": 160.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000310",
  "category": "Món Miến & Bánh Canh",
  "name": "Bánh canh chả cá Nha Trang",
  "ingredientsText": "Bánh canh, chả cá thu chiên",
  "servingGrams": 450.0,
  "kcal": 410.0,
  "proteinG": 20.0,
  "fatG": 10.8,
  "carbG": 58.2,
  "fiberG": 0.9,
  "sodiumMg": 1090.0,
  "components": [
   {
    "name": "Bánh canh",
    "grams": 200.0
   },
   {
    "name": "Chả cá thu",
    "grams": 80.0
   },
   {
    "name": "Nước dùng",
    "grams": 150.0
   },
   {
    "name": "Hành, ngò",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000311",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt lợn luộc chấm mắm tôm",
  "ingredientsText": "Thịt ba chỉ luộc, mắm tôm, rau sống",
  "servingGrams": 130.0,
  "kcal": 290.0,
  "proteinG": 15.2,
  "fatG": 22.8,
  "carbG": 4.2,
  "fiberG": 1.0,
  "sodiumMg": 950.0,
  "components": [
   {
    "name": "Thịt ba chỉ luộc",
    "grams": 100.0
   },
   {
    "name": "Mắm tôm pha",
    "grams": 10.0
   },
   {
    "name": "Rau sống",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000312",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt heo nướng sả",
  "ingredientsText": "Thịt nạc heo ướp sả nướng than",
  "servingGrams": 120.0,
  "kcal": 260.0,
  "proteinG": 19.2,
  "fatG": 17.5,
  "carbG": 5.0,
  "fiberG": 0.8,
  "sodiumMg": 680.0,
  "components": [
   {
    "name": "Thịt nạc heo",
    "grams": 105.0
   },
   {
    "name": "Sả",
    "grams": 10.0
   },
   {
    "name": "Dầu, gia vị",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000313",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Mắm quẹt tôm thịt",
  "ingredientsText": "Thịt ba chỉ thái hạt lựu, tôm khô, mắm",
  "servingGrams": 100.0,
  "kcal": 310.0,
  "proteinG": 12.8,
  "fatG": 24.5,
  "carbG": 9.8,
  "fiberG": null,
  "sodiumMg": 1350.0,
  "components": [
   {
    "name": "Thịt ba chỉ",
    "grams": 60.0
   },
   {
    "name": "Tôm khô",
    "grams": 15.0
   },
   {
    "name": "Mắm ruốc",
    "grams": 20.0
   },
   {
    "name": "Đường, tỏi, ớt",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000314",
  "category": "Món Mặn - Thịt Bò",
  "name": "Thịt bò xào muống",
  "ingredientsText": "Thịt bò, rau muống, tỏi",
  "servingGrams": 160.0,
  "kcal": 165.0,
  "proteinG": 15.8,
  "fatG": 8.5,
  "carbG": 6.2,
  "fiberG": 1.8,
  "sodiumMg": 430.0,
  "components": [
   {
    "name": "Thịt bò",
    "grams": 70.0
   },
   {
    "name": "Rau muống",
    "grams": 80.0
   },
   {
    "name": "Tỏi, dầu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000315",
  "category": "Món Mặn - Thịt Bò",
  "name": "Bò né Sài Gòn",
  "ingredientsText": "Thịt bò thăn, pate, trứng ốp la, bơ",
  "servingGrams": 200.0,
  "kcal": 420.0,
  "proteinG": 24.5,
  "fatG": 28.0,
  "carbG": 17.5,
  "fiberG": 0.5,
  "sodiumMg": 820.0,
  "components": [
   {
    "name": "Thịt bò thăn",
    "grams": 90.0
   },
   {
    "name": "Pate",
    "grams": 25.0
   },
   {
    "name": "Trứng gà ốp la",
    "grams": 50.0
   },
   {
    "name": "Bơ",
    "grams": 10.0
   },
   {
    "name": "Bánh mì",
    "grams": 25.0
   }
  ]
 },
 {
  "code": "VPF-000316",
  "category": "Món Mặn - Gia Cầm",
  "name": "Gà luộc xé phay",
  "ingredientsText": "Thịt gà ta luộc, hành tây, rau răm",
  "servingGrams": 120.0,
  "kcal": 210.0,
  "proteinG": 19.8,
  "fatG": 12.5,
  "carbG": 4.2,
  "fiberG": 1.2,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Thịt gà ta luộc",
    "grams": 90.0
   },
   {
    "name": "Hành tây",
    "grams": 20.0
   },
   {
    "name": "Rau răm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000317",
  "category": "Món Mặn - Gia Cầm",
  "name": "Gà rang muối",
  "ingredientsText": "Thịt gà chặt cắn, bột gạo nếp rang muối",
  "servingGrams": 130.0,
  "kcal": 290.0,
  "proteinG": 20.5,
  "fatG": 18.2,
  "carbG": 11.2,
  "fiberG": null,
  "sodiumMg": 880.0,
  "components": [
   {
    "name": "Thịt gà",
    "grams": 105.0
   },
   {
    "name": "Bột nếp rang",
    "grams": 15.0
   },
   {
    "name": "Muối, dầu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000319",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá diêu hồng sốt cà chua",
  "ingredientsText": "Cá diêu hồng, cà chua tươi",
  "servingGrams": 160.0,
  "kcal": 210.0,
  "proteinG": 18.8,
  "fatG": 10.2,
  "carbG": 8.8,
  "fiberG": 0.8,
  "sodiumMg": 590.0,
  "components": [
   {
    "name": "Cá diêu hồng",
    "grams": 110.0
   },
   {
    "name": "Cà chua",
    "grams": 40.0
   },
   {
    "name": "Dầu, hành",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000320",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá cơm rim khô mặn ngọt",
  "ingredientsText": "Cá cơm khô, đường, mắm, ớt",
  "servingGrams": 80.0,
  "kcal": 195.0,
  "proteinG": 21.2,
  "fatG": 5.8,
  "carbG": 14.5,
  "fiberG": null,
  "sodiumMg": 1120.0,
  "components": [
   {
    "name": "Cá cơm khô",
    "grams": 60.0
   },
   {
    "name": "Đường",
    "grams": 10.0
   },
   {
    "name": "Nước mắm",
    "grams": 5.0
   },
   {
    "name": "Ớt, tỏi, dầu",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000321",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Tôm rim nước cốt dừa",
  "ingredientsText": "Tôm đồng/sú, nước cốt dừa",
  "servingGrams": 100.0,
  "kcal": 185.0,
  "proteinG": 16.5,
  "fatG": 11.8,
  "carbG": 3.2,
  "fiberG": 0.5,
  "sodiumMg": 620.0,
  "components": [
   {
    "name": "Tôm",
    "grams": 75.0
   },
   {
    "name": "Nước cốt dừa",
    "grams": 20.0
   },
   {
    "name": "Hành, gia vị",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000322",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Mực nhồi thịt sốt cà chua",
  "ingredientsText": "Mực ống, thịt heo băm, cà chua",
  "servingGrams": 180.0,
  "kcal": 250.0,
  "proteinG": 21.0,
  "fatG": 14.2,
  "carbG": 9.8,
  "fiberG": 0.8,
  "sodiumMg": 720.0,
  "components": [
   {
    "name": "Mực ống",
    "grams": 100.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 40.0
   },
   {
    "name": "Cà chua",
    "grams": 30.0
   },
   {
    "name": "Dầu, hành",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000323",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Tôm rang muối hồng kong",
  "ingredientsText": "Tôm thẻ, muối ớt, tỏi phi",
  "servingGrams": 110.0,
  "kcal": 165.0,
  "proteinG": 18.8,
  "fatG": 7.2,
  "carbG": 6.2,
  "fiberG": 0.2,
  "sodiumMg": 850.0,
  "components": [
   {
    "name": "Tôm thẻ",
    "grams": 95.0
   },
   {
    "name": "Muối ớt",
    "grams": 5.0
   },
   {
    "name": "Tỏi phi, dầu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000324",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cua lột chiên giòn",
  "ingredientsText": "Cua lột, bột chiên giòn",
  "servingGrams": 120.0,
  "kcal": 230.0,
  "proteinG": 16.2,
  "fatG": 15.8,
  "carbG": 6.2,
  "fiberG": 0.3,
  "sodiumMg": 580.0,
  "components": [
   {
    "name": "Cua lột",
    "grams": 95.0
   },
   {
    "name": "Bột chiên, dầu",
    "grams": 25.0
   }
  ]
 },
 {
  "code": "VPF-000325",
  "category": "Món Rau & Xào",
  "name": "Đậu hũ sốt Tứ Xuyên Việt",
  "ingredientsText": "Đậu hũ non, thịt băm, sa tế",
  "servingGrams": 180.0,
  "kcal": 195.0,
  "proteinG": 12.2,
  "fatG": 13.5,
  "carbG": 6.2,
  "fiberG": 0.8,
  "sodiumMg": 580.0,
  "components": [
   {
    "name": "Đậu hũ non",
    "grams": 110.0
   },
   {
    "name": "Thịt băm",
    "grams": 40.0
   },
   {
    "name": "Sa tế, dầu",
    "grams": 15.0
   },
   {
    "name": "Nước sốt",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000326",
  "category": "Món Rau & Xào",
  "name": "Cải thìa xào dầu hàu",
  "ingredientsText": "Cải thìa, tỏi, dầu hàu",
  "servingGrams": 150.0,
  "kcal": 85.0,
  "proteinG": 2.8,
  "fatG": 5.2,
  "carbG": 6.5,
  "fiberG": 1.9,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Cải thìa",
    "grams": 130.0
   },
   {
    "name": "Dầu hàu",
    "grams": 8.0
   },
   {
    "name": "Tỏi, dầu",
    "grams": 12.0
   }
  ]
 },
 {
  "code": "VPF-000328",
  "category": "Món Canh & Súp",
  "name": "Canh mương chua cá ngừ",
  "ingredientsText": "Cá ngừ, măng chua, dứa",
  "servingGrams": 250.0,
  "kcal": 145.0,
  "proteinG": 14.8,
  "fatG": 5.8,
  "carbG": 8.5,
  "fiberG": 1.8,
  "sodiumMg": 620.0,
  "components": [
   {
    "name": "Cá ngừ",
    "grams": 70.0
   },
   {
    "name": "Măng chua",
    "grams": 40.0
   },
   {
    "name": "Dứa",
    "grams": 30.0
   },
   {
    "name": "Nước canh",
    "grams": 110.0
   }
  ]
 },
 {
  "code": "VPF-000329",
  "category": "Món Lẩu",
  "name": "Lẩu nấm thiên nhiên",
  "ingredientsText": "Các loại nấm tươi, nước hầm củ quả",
  "servingGrams": 400.0,
  "kcal": 210.0,
  "proteinG": 12.5,
  "fatG": 3.8,
  "carbG": 31.5,
  "fiberG": 4.2,
  "sodiumMg": 890.0,
  "components": [
   {
    "name": "Các loại nấm",
    "grams": 150.0
   },
   {
    "name": "Nước hầm củ quả",
    "grams": 150.0
   },
   {
    "name": "Bún",
    "grams": 80.0
   },
   {
    "name": "Rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000330",
  "category": "Món Cuốn & Gỏi",
  "name": "Gỏi ngó sen tôm thịt bò",
  "ingredientsText": "Ngó sen, tôm, bò tái, lạc",
  "servingGrams": 150.0,
  "kcal": 175.0,
  "proteinG": 13.5,
  "fatG": 5.8,
  "carbG": 17.2,
  "fiberG": 2.4,
  "sodiumMg": 480.0,
  "components": [
   {
    "name": "Ngó sen",
    "grams": 75.0
   },
   {
    "name": "Tôm",
    "grams": 25.0
   },
   {
    "name": "Bò tái",
    "grams": 30.0
   },
   {
    "name": "Lạc",
    "grams": 10.0
   },
   {
    "name": "Nước trộn",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000332",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh ít nhân tôm thịt",
  "ingredientsText": "Bột nếp, tôm, thịt heo băm",
  "servingGrams": 120.0,
  "kcal": 240.0,
  "proteinG": 8.2,
  "fatG": 8.5,
  "carbG": 32.5,
  "fiberG": 0.6,
  "sodiumMg": 420.0,
  "components": [
   {
    "name": "Bột nếp",
    "grams": 80.0
   },
   {
    "name": "Tôm",
    "grams": 20.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 15.0
   },
   {
    "name": "Mỡ hành",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000333",
  "category": "Món Tráng Miệng",
  "name": "Chè hạt sen nhãn lồng",
  "ingredientsText": "Hạt sen, nhãn tươi, đường phèn",
  "servingGrams": 150.0,
  "kcal": 210.0,
  "proteinG": 3.8,
  "fatG": 0.5,
  "carbG": 47.8,
  "fiberG": 1.8,
  "sodiumMg": 22.0,
  "components": [
   {
    "name": "Hạt sen",
    "grams": 40.0
   },
   {
    "name": "Nhãn",
    "grams": 40.0
   },
   {
    "name": "Đường phèn",
    "grams": 25.0
   },
   {
    "name": "Nước",
    "grams": 45.0
   }
  ]
 },
 {
  "code": "VPF-000334",
  "category": "Trái Cây Tươi",
  "name": "Chanh dây tươi (Mắc ca)",
  "ingredientsText": "Dịch quả chanh dây tươi",
  "servingGrams": 100.0,
  "kcal": 48.0,
  "proteinG": 1.2,
  "fatG": 0.4,
  "carbG": 9.8,
  "fiberG": 3.2,
  "sodiumMg": 6.0,
  "components": [
   {
    "name": "Dịch quả chanh dây tươi",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000335",
  "category": "Trái Cây Tươi",
  "name": "Măng đắng luộc",
  "ingredientsText": "Măng đắng tươi luộc chấm chẩm chéo",
  "servingGrams": 100.0,
  "kcal": 24.0,
  "proteinG": 1.9,
  "fatG": 0.2,
  "carbG": 3.5,
  "fiberG": 2.2,
  "sodiumMg": 8.0,
  "components": [
   {
    "name": "Măng đắng tươi luộc chấm chẩm chéo",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000336",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Dầu hào Lee Kum Kee",
  "ingredientsText": "Chiết xuất hàu, đường, muối",
  "servingGrams": 100.0,
  "kcal": 115.0,
  "proteinG": 1.5,
  "fatG": 0.2,
  "carbG": 26.8,
  "fiberG": null,
  "sodiumMg": 4200.0,
  "components": [
   {
    "name": "Chiết xuất hàu, đường, muối",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000337",
  "category": "Lương thực & Ngũ cốc",
  "name": "Bột mì đa dụng",
  "ingredientsText": "Tinh bột lúa mì",
  "servingGrams": 100.0,
  "kcal": 357.0,
  "proteinG": 10.8,
  "fatG": 1.2,
  "carbG": 75.8,
  "fiberG": 0.8,
  "sodiumMg": 5.0,
  "components": [
   {
    "name": "Tinh bột lúa mì",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000338",
  "category": "Món Cơm",
  "name": "Cơm chiên đùi gà quay",
  "ingredientsText": "Cơm chiên, đùi gà quay giòn",
  "servingGrams": 350.0,
  "kcal": 580.0,
  "proteinG": 26.5,
  "fatG": 22.0,
  "carbG": 68.5,
  "fiberG": 1.2,
  "sodiumMg": 850.0,
  "components": [
   {
    "name": "Cơm chiên",
    "grams": 200.0
   },
   {
    "name": "Đùi gà quay",
    "grams": 130.0
   },
   {
    "name": "Dưa leo, cà chua",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000339",
  "category": "Món Phở",
  "name": "Phở tái chín bắp bò",
  "ingredientsText": "Bánh phở, bắp bò tái chín",
  "servingGrams": 450.0,
  "kcal": 460.0,
  "proteinG": 22.8,
  "fatG": 12.5,
  "carbG": 64.2,
  "fiberG": 0.8,
  "sodiumMg": 1120.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 200.0
   },
   {
    "name": "Bắp bò",
    "grams": 70.0
   },
   {
    "name": "Nước dùng",
    "grams": 165.0
   },
   {
    "name": "Hành, rau",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000340",
  "category": "Món Bún",
  "name": "Bún chả giò (Nem rán)",
  "ingredientsText": "Bún tươi, nem rán chiên giòn, rau mắm",
  "servingGrams": 350.0,
  "kcal": 490.0,
  "proteinG": 16.5,
  "fatG": 21.0,
  "carbG": 58.8,
  "fiberG": 1.8,
  "sodiumMg": 880.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 150.0
   },
   {
    "name": "Nem rán",
    "grams": 90.0
   },
   {
    "name": "Rau sống, đồ chua",
    "grams": 50.0
   },
   {
    "name": "Nước mắm pha",
    "grams": 50.0
   },
   {
    "name": "Lạc, mỡ hành",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000341",
  "category": "Món Bún",
  "name": "Bún chả cá Quy Nhơn",
  "ingredientsText": "Bún tươi, chả cá thu/nhồng, sứa tươi",
  "servingGrams": 450.0,
  "kcal": 395.0,
  "proteinG": 20.5,
  "fatG": 9.2,
  "carbG": 57.5,
  "fiberG": 1.2,
  "sodiumMg": 1090.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 200.0
   },
   {
    "name": "Chả cá",
    "grams": 70.0
   },
   {
    "name": "Sứa",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 130.0
   },
   {
    "name": "Rau sống",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000342",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Hủ tiếu mì thập cẩm",
  "ingredientsText": "Hủ tiếu, mì trứng, thịt băm, tôm, gan",
  "servingGrams": 450.0,
  "kcal": 480.0,
  "proteinG": 22.5,
  "fatG": 15.2,
  "carbG": 63.2,
  "fiberG": 1.1,
  "sodiumMg": 1210.0,
  "components": [
   {
    "name": "Hủ tiếu",
    "grams": 100.0
   },
   {
    "name": "Mì trứng",
    "grams": 80.0
   },
   {
    "name": "Thịt băm",
    "grams": 30.0
   },
   {
    "name": "Tôm",
    "grams": 30.0
   },
   {
    "name": "Gan",
    "grams": 20.0
   },
   {
    "name": "Nước lèo",
    "grams": 170.0
   },
   {
    "name": "Hẹ",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000343",
  "category": "Món Miến & Bánh Canh",
  "name": "Miến nước thịt băm mộc nhĩ",
  "ingredientsText": "Miến, thịt heo băm, mộc nhĩ",
  "servingGrams": 400.0,
  "kcal": 360.0,
  "proteinG": 15.2,
  "fatG": 9.5,
  "carbG": 53.5,
  "fiberG": 0.8,
  "sodiumMg": 980.0,
  "components": [
   {
    "name": "Miến",
    "grams": 150.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 50.0
   },
   {
    "name": "Mộc nhĩ",
    "grams": 10.0
   },
   {
    "name": "Nước dùng",
    "grams": 170.0
   },
   {
    "name": "Hành, rau",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000344",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt ba chỉ nướng riềng mẻ",
  "ingredientsText": "Thịt ba chỉ, riềng, mẻ, nước mắm",
  "servingGrams": 130.0,
  "kcal": 350.0,
  "proteinG": 16.2,
  "fatG": 29.5,
  "carbG": 4.8,
  "fiberG": 0.8,
  "sodiumMg": 720.0,
  "components": [
   {
    "name": "Thịt ba chỉ",
    "grams": 110.0
   },
   {
    "name": "Riềng",
    "grams": 7.0
   },
   {
    "name": "Mẻ",
    "grams": 8.0
   },
   {
    "name": "Nước mắm",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000345",
  "category": "Món Mặn - Thịt Bò",
  "name": "Bò né bơ tỏi",
  "ingredientsText": "Thịt bò thăn, bơ tỏi, khoai tây chiên",
  "servingGrams": 220.0,
  "kcal": 460.0,
  "proteinG": 23.5,
  "fatG": 31.0,
  "carbG": 21.5,
  "fiberG": 1.2,
  "sodiumMg": 890.0,
  "components": [
   {
    "name": "Thịt bò thăn",
    "grams": 100.0
   },
   {
    "name": "Bơ tỏi",
    "grams": 15.0
   },
   {
    "name": "Khoai tây chiên",
    "grams": 80.0
   },
   {
    "name": "Sốt, rau",
    "grams": 25.0
   }
  ]
 },
 {
  "code": "VPF-000346",
  "category": "Món Mặn - Gia Cầm",
  "name": "Đùi gà nướng mật ong",
  "ingredientsText": "Đùi gà ta, mật ong, dầu hàu",
  "servingGrams": 150.0,
  "kcal": 330.0,
  "proteinG": 22.0,
  "fatG": 21.5,
  "carbG": 12.2,
  "fiberG": null,
  "sodiumMg": 750.0,
  "components": [
   {
    "name": "Đùi gà ta",
    "grams": 135.0
   },
   {
    "name": "Mật ong",
    "grams": 8.0
   },
   {
    "name": "Dầu hàu",
    "grams": 7.0
   }
  ]
 },
 {
  "code": "VPF-000347",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá basa sốt cà chua",
  "ingredientsText": "Thịt cá basa khúc, cà chua tươi",
  "servingGrams": 160.0,
  "kcal": 220.0,
  "proteinG": 17.5,
  "fatG": 13.8,
  "carbG": 8.2,
  "fiberG": 0.8,
  "sodiumMg": 620.0,
  "components": [
   {
    "name": "Cá basa khúc",
    "grams": 110.0
   },
   {
    "name": "Cà chua",
    "grams": 40.0
   },
   {
    "name": "Dầu, hành",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000348",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Tôm rang thịt ba chỉ",
  "ingredientsText": "Tôm đồng, thịt ba chỉ kho mặn ngọt",
  "servingGrams": 130.0,
  "kcal": 280.0,
  "proteinG": 18.2,
  "fatG": 20.5,
  "carbG": 6.2,
  "fiberG": null,
  "sodiumMg": 890.0,
  "components": [
   {
    "name": "Tôm đồng",
    "grams": 60.0
   },
   {
    "name": "Thịt ba chỉ",
    "grams": 60.0
   },
   {
    "name": "Nước mắm, đường",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000349",
  "category": "Món Rau & Xào",
  "name": "Đậu hũ chiên sả ớt",
  "ingredientsText": "Đậu hũ rán vàng, sả, ớt băm",
  "servingGrams": 120.0,
  "kcal": 195.0,
  "proteinG": 11.5,
  "fatG": 14.2,
  "carbG": 4.8,
  "fiberG": 1.2,
  "sodiumMg": 490.0,
  "components": [
   {
    "name": "Đậu hũ",
    "grams": 100.0
   },
   {
    "name": "Sả",
    "grams": 10.0
   },
   {
    "name": "Ớt",
    "grams": 2.0
   },
   {
    "name": "Dầu (thấm)",
    "grams": 8.0
   }
  ]
 },
 {
  "code": "VPF-000351",
  "category": "Món Lẩu",
  "name": "Lẩu riêu cua bắp bò",
  "ingredientsText": "Cua đồng, bắp bò thăn, rau lẩu",
  "servingGrams": 450.0,
  "kcal": 410.0,
  "proteinG": 25.2,
  "fatG": 16.8,
  "carbG": 38.5,
  "fiberG": 2.2,
  "sodiumMg": 1290.0,
  "components": [
   {
    "name": "Riêu cua đồng",
    "grams": 50.0
   },
   {
    "name": "Bắp bò",
    "grams": 80.0
   },
   {
    "name": "Rau lẩu",
    "grams": 70.0
   },
   {
    "name": "Bún",
    "grams": 100.0
   },
   {
    "name": "Nước lẩu",
    "grams": 150.0
   }
  ]
 },
 {
  "code": "VPF-000352",
  "category": "Món Cuốn & Gỏi",
  "name": "Gỏi tai heo dưa chuột",
  "ingredientsText": "Tai heo luộc, dưa chuột, lạc rang",
  "servingGrams": 150.0,
  "kcal": 175.0,
  "proteinG": 9.8,
  "fatG": 10.5,
  "carbG": 11.2,
  "fiberG": 2.1,
  "sodiumMg": 460.0,
  "components": [
   {
    "name": "Tai heo luộc",
    "grams": 60.0
   },
   {
    "name": "Dưa chuột",
    "grams": 60.0
   },
   {
    "name": "Lạc rang",
    "grams": 10.0
   },
   {
    "name": "Rau thơm, nước trộn",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000354",
  "category": "Món Tráng Miệng",
  "name": "Chè đậu đỏ cốt dừa",
  "ingredientsText": "Đậu đỏ, đường, nước cốt dừa",
  "servingGrams": 150.0,
  "kcal": 235.0,
  "proteinG": 6.0,
  "fatG": 5.2,
  "carbG": 41.0,
  "fiberG": 2.2,
  "sodiumMg": 40.0,
  "components": [
   {
    "name": "Đậu đỏ",
    "grams": 40.0
   },
   {
    "name": "Đường",
    "grams": 20.0
   },
   {
    "name": "Nước cốt dừa",
    "grams": 20.0
   },
   {
    "name": "Nước",
    "grams": 70.0
   }
  ]
 },
 {
  "code": "VPF-000355",
  "category": "Trái Cây Tươi",
  "name": "Dâu tây tươi",
  "ingredientsText": "Dâu tây tươi mọng",
  "servingGrams": 100.0,
  "kcal": 32.0,
  "proteinG": 0.7,
  "fatG": 0.3,
  "carbG": 7.7,
  "fiberG": 2.0,
  "sodiumMg": 1.0,
  "components": [
   {
    "name": "Dâu tây tươi mọng",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000356",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Tương đen (Hổ xì)",
  "ingredientsText": "Đậu tương đen lên men",
  "servingGrams": 100.0,
  "kcal": 145.0,
  "proteinG": 7.2,
  "fatG": 3.5,
  "carbG": 21.0,
  "fiberG": 1.8,
  "sodiumMg": 3800.0,
  "components": [
   {
    "name": "Đậu tương đen lên men",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000357",
  "category": "Lương thực & Ngũ cốc",
  "name": "Bột gạo tẻ",
  "ingredientsText": "Bột gạo tẻ xay mịn",
  "servingGrams": 100.0,
  "kcal": 345.0,
  "proteinG": 7.2,
  "fatG": 0.8,
  "carbG": 77.0,
  "fiberG": 0.3,
  "sodiumMg": 4.0,
  "components": [
   {
    "name": "Bột gạo tẻ xay mịn",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000358",
  "category": "Món Cơm",
  "name": "Cơm chiên đùi gà sốt mắm",
  "ingredientsText": "Cơm chiên, đùi gà chiên nước mắm",
  "servingGrams": 350.0,
  "kcal": 610.0,
  "proteinG": 27.2,
  "fatG": 23.5,
  "carbG": 71.0,
  "fiberG": 1.1,
  "sodiumMg": 920.0,
  "components": [
   {
    "name": "Cơm chiên",
    "grams": 200.0
   },
   {
    "name": "Đùi gà chiên nước mắm",
    "grams": 130.0
   },
   {
    "name": "Dưa leo, cà chua",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000359",
  "category": "Món Phở",
  "name": "Phở nạm gầu gân bò",
  "ingredientsText": "Bánh phở, nạm gầu, gân bò",
  "servingGrams": 450.0,
  "kcal": 520.0,
  "proteinG": 23.5,
  "fatG": 18.8,
  "carbG": 63.8,
  "fiberG": 0.8,
  "sodiumMg": 1210.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 200.0
   },
   {
    "name": "Nạm gầu",
    "grams": 50.0
   },
   {
    "name": "Gân bò",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 155.0
   },
   {
    "name": "Hành, rau",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000360",
  "category": "Món Bún",
  "name": "Bún chả chìa Hải Phòng",
  "ingredientsText": "Bún, chả chìa nướng cút tre",
  "servingGrams": 400.0,
  "kcal": 480.0,
  "proteinG": 21.0,
  "fatG": 19.5,
  "carbG": 55.0,
  "fiberG": 1.2,
  "sodiumMg": 920.0,
  "components": [
   {
    "name": "Bún",
    "grams": 180.0
   },
   {
    "name": "Chả chìa nướng",
    "grams": 90.0
   },
   {
    "name": "Nước chấm",
    "grams": 100.0
   },
   {
    "name": "Rau sống",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000361",
  "category": "Món Bún",
  "name": "Bún mắm sọc",
  "ingredientsText": "Bún tươi, mắm sặc, thịt quay, cà tím",
  "servingGrams": 450.0,
  "kcal": 485.0,
  "proteinG": 23.2,
  "fatG": 15.5,
  "carbG": 62.8,
  "fiberG": 2.5,
  "sodiumMg": 1580.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 200.0
   },
   {
    "name": "Mắm cá sặc",
    "grams": 20.0
   },
   {
    "name": "Thịt quay",
    "grams": 50.0
   },
   {
    "name": "Tôm",
    "grams": 30.0
   },
   {
    "name": "Cà tím",
    "grams": 30.0
   },
   {
    "name": "Nước lèo",
    "grams": 100.0
   },
   {
    "name": "Rau sống",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000362",
  "category": "Món Hủ Tiếu & Mỳ",
  "name": "Hủ tiếu khô sườn phay",
  "ingredientsText": "Hủ tiếu trộn, sườn heo, nước lèo",
  "servingGrams": 400.0,
  "kcal": 450.0,
  "proteinG": 20.8,
  "fatG": 14.2,
  "carbG": 59.5,
  "fiberG": 1.0,
  "sodiumMg": 980.0,
  "components": [
   {
    "name": "Hủ tiếu",
    "grams": 180.0
   },
   {
    "name": "Sườn heo",
    "grams": 70.0
   },
   {
    "name": "Thịt băm",
    "grams": 30.0
   },
   {
    "name": "Nước lèo (chén riêng)",
    "grams": 100.0
   },
   {
    "name": "Hẹ, giá",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000363",
  "category": "Món Miến & Bánh Canh",
  "name": "Bánh canh giò nạc",
  "ingredientsText": "Bánh canh, giò nạc luộc, chả heo",
  "servingGrams": 450.0,
  "kcal": 440.0,
  "proteinG": 22.0,
  "fatG": 13.8,
  "carbG": 57.0,
  "fiberG": 0.8,
  "sodiumMg": 1050.0,
  "components": [
   {
    "name": "Bánh canh",
    "grams": 200.0
   },
   {
    "name": "Giò nạc",
    "grams": 60.0
   },
   {
    "name": "Chả heo",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 140.0
   },
   {
    "name": "Hành, ngò",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000364",
  "category": "Món Mặn - Thịt Lợn",
  "name": "Thịt lợn nướng lá móc mật",
  "ingredientsText": "Thịt heo nạc, lá móc mật, gia vị",
  "servingGrams": 130.0,
  "kcal": 280.0,
  "proteinG": 18.5,
  "fatG": 19.8,
  "carbG": 4.2,
  "fiberG": 0.9,
  "sodiumMg": 690.0,
  "components": [
   {
    "name": "Thịt heo nạc",
    "grams": 120.0
   },
   {
    "name": "Lá/hạt móc mật",
    "grams": 5.0
   },
   {
    "name": "Gia vị",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000365",
  "category": "Món Mặn - Thịt Bò",
  "name": "Bò nhúng dấm cuốn bánh tráng",
  "ingredientsText": "Thịt bò tái, dấm dừa, rau sống",
  "servingGrams": 180.0,
  "kcal": 290.0,
  "proteinG": 22.5,
  "fatG": 11.2,
  "carbG": 24.5,
  "fiberG": 1.8,
  "sodiumMg": 780.0,
  "components": [
   {
    "name": "Thịt bò tái",
    "grams": 80.0
   },
   {
    "name": "Bánh tráng",
    "grams": 30.0
   },
   {
    "name": "Rau sống",
    "grams": 50.0
   },
   {
    "name": "Mắm nêm",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000366",
  "category": "Món Mặn - Gia Cầm",
  "name": "Gà xé phay bóp rau răm",
  "ingredientsText": "Thịt gà xé, hành tây, rau răm",
  "servingGrams": 130.0,
  "kcal": 195.0,
  "proteinG": 18.2,
  "fatG": 9.8,
  "carbG": 8.2,
  "fiberG": 1.4,
  "sodiumMg": 510.0,
  "components": [
   {
    "name": "Thịt gà xé",
    "grams": 80.0
   },
   {
    "name": "Hành tây",
    "grams": 30.0
   },
   {
    "name": "Rau răm",
    "grams": 10.0
   },
   {
    "name": "Nước trộn",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000367",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá hú sốt cà chua",
  "ingredientsText": "Thịt cá hú khúc, cà chua tươi",
  "servingGrams": 150.0,
  "kcal": 210.0,
  "proteinG": 16.8,
  "fatG": 12.5,
  "carbG": 7.8,
  "fiberG": 0.8,
  "sodiumMg": 610.0,
  "components": [
   {
    "name": "Cá hú khúc",
    "grams": 105.0
   },
   {
    "name": "Cà chua",
    "grams": 35.0
   },
   {
    "name": "Dầu, hành",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000368",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Mực nhồi thịt hấp gừng",
  "ingredientsText": "Mực ống nhồi thịt heo, gừng",
  "servingGrams": 160.0,
  "kcal": 195.0,
  "proteinG": 19.2,
  "fatG": 9.8,
  "carbG": 7.2,
  "fiberG": 0.5,
  "sodiumMg": 590.0,
  "components": [
   {
    "name": "Mực ống",
    "grams": 100.0
   },
   {
    "name": "Thịt heo nhồi",
    "grams": 45.0
   },
   {
    "name": "Gừng, hành",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000370",
  "category": "Món Canh & Súp",
  "name": "Canh mướp đắng (Khổ qua) tôm tươi",
  "ingredientsText": "Mướp đắng, tôm tươi băm",
  "servingGrams": 250.0,
  "kcal": 85.0,
  "proteinG": 7.8,
  "fatG": 1.5,
  "carbG": 9.2,
  "fiberG": 1.8,
  "sodiumMg": 410.0,
  "components": [
   {
    "name": "Mướp đắng",
    "grams": 80.0
   },
   {
    "name": "Tôm băm",
    "grams": 30.0
   },
   {
    "name": "Nước canh",
    "grams": 140.0
   }
  ]
 },
 {
  "code": "VPF-000371",
  "category": "Món Lẩu",
  "name": "Lẩu riêu cua bắp bò sườn sụn",
  "ingredientsText": "Cua đồng, bắp bò, sườn sụn",
  "servingGrams": 450.0,
  "kcal": 440.0,
  "proteinG": 26.8,
  "fatG": 19.5,
  "carbG": 38.0,
  "fiberG": 2.2,
  "sodiumMg": 1380.0,
  "components": [
   {
    "name": "Riêu cua đồng",
    "grams": 50.0
   },
   {
    "name": "Bắp bò",
    "grams": 60.0
   },
   {
    "name": "Sườn sụn",
    "grams": 50.0
   },
   {
    "name": "Rau lẩu",
    "grams": 50.0
   },
   {
    "name": "Bún",
    "grams": 100.0
   },
   {
    "name": "Nước lẩu",
    "grams": 140.0
   }
  ]
 },
 {
  "code": "VPF-000372",
  "category": "Món Cuốn & Gỏi",
  "name": "Gỏi đu đủ tôm thịt",
  "ingredientsText": "Đu đủ xanh bào, tôm, thịt heo, lạc",
  "servingGrams": 150.0,
  "kcal": 160.0,
  "proteinG": 10.5,
  "fatG": 4.8,
  "carbG": 18.2,
  "fiberG": 2.2,
  "sodiumMg": 420.0,
  "components": [
   {
    "name": "Đu đủ xanh bào",
    "grams": 80.0
   },
   {
    "name": "Tôm",
    "grams": 25.0
   },
   {
    "name": "Thịt heo",
    "grams": 25.0
   },
   {
    "name": "Lạc",
    "grams": 10.0
   },
   {
    "name": "Nước trộn, rau thơm",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000373",
  "category": "Món Ăn Vặt & Bánh",
  "name": "Bánh rán nhân thịt",
  "ingredientsText": "Bột nếp, thịt heo băm, mộc nhĩ chiên",
  "servingGrams": 120.0,
  "kcal": 320.0,
  "proteinG": 7.2,
  "fatG": 16.5,
  "carbG": 35.8,
  "fiberG": 0.8,
  "sodiumMg": 390.0,
  "components": [
   {
    "name": "Bột nếp",
    "grams": 70.0
   },
   {
    "name": "Thịt heo băm",
    "grams": 25.0
   },
   {
    "name": "Mộc nhĩ",
    "grams": 5.0
   },
   {
    "name": "Dầu (thấm)",
    "grams": 20.0
   }
  ]
 },
 {
  "code": "VPF-000374",
  "category": "Món Tráng Miệng",
  "name": "Chè khúc bạch",
  "ingredientsText": "Khúc bạch phô mai, hạnh nhân, nhãn",
  "servingGrams": 150.0,
  "kcal": 230.0,
  "proteinG": 4.2,
  "fatG": 12.5,
  "carbG": 25.0,
  "fiberG": 0.5,
  "sodiumMg": 45.0,
  "components": [
   {
    "name": "Khúc bạch (sữa, phô mai, gelatin)",
    "grams": 70.0
   },
   {
    "name": "Nhãn",
    "grams": 40.0
   },
   {
    "name": "Hạnh nhân",
    "grams": 10.0
   },
   {
    "name": "Nước đường",
    "grams": 30.0
   }
  ]
 },
 {
  "code": "VPF-000375",
  "category": "Trái Cây Tươi",
  "name": "Nho xanh ninh thuận",
  "ingredientsText": "Nho xanh tươi quả",
  "servingGrams": 100.0,
  "kcal": 68.0,
  "proteinG": 0.6,
  "fatG": 0.2,
  "carbG": 16.8,
  "fiberG": 0.9,
  "sodiumMg": 2.0,
  "components": [
   {
    "name": "Nho xanh tươi quả",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000376",
  "category": "Gia Vị & Đồ Đóng Hộp",
  "name": "Muối tôm Tây Ninh",
  "ingredientsText": "Muối, tôm khô, ớt, tỏi",
  "servingGrams": 100.0,
  "kcal": 115.0,
  "proteinG": 8.5,
  "fatG": 1.2,
  "carbG": 17.5,
  "fiberG": null,
  "sodiumMg": 24500.0,
  "components": [
   {
    "name": "Muối",
    "grams": 60.0
   },
   {
    "name": "Tôm khô",
    "grams": 25.0
   },
   {
    "name": "Ớt",
    "grams": 10.0
   },
   {
    "name": "Tỏi",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000377",
  "category": "Lương thực & Ngũ cốc",
  "name": "Bột nếp lọc",
  "ingredientsText": "Bột nếp tinh chế",
  "servingGrams": 100.0,
  "kcal": 348.0,
  "proteinG": 6.8,
  "fatG": 0.6,
  "carbG": 78.5,
  "fiberG": 0.2,
  "sodiumMg": 3.0,
  "components": [
   {
    "name": "Bột nếp tinh chế",
    "grams": 100.0
   }
  ]
 },
 {
  "code": "VPF-000378",
  "category": "Món Cơm",
  "name": "Cơm chiên hải sản sốt XO",
  "ingredientsText": "Cơm, tôm, mực, sốt XO",
  "servingGrams": 250.0,
  "kcal": 480.0,
  "proteinG": 17.5,
  "fatG": 16.2,
  "carbG": 62.0,
  "fiberG": 1.4,
  "sodiumMg": 850.0,
  "components": [
   {
    "name": "Cơm",
    "grams": 170.0
   },
   {
    "name": "Tôm",
    "grams": 30.0
   },
   {
    "name": "Mực",
    "grams": 30.0
   },
   {
    "name": "Sốt XO",
    "grams": 10.0
   },
   {
    "name": "Dầu",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000379",
  "category": "Món Phở",
  "name": "Phở tái gầu bắp bò",
  "ingredientsText": "Bánh phở, tái, gầu, bắp bò",
  "servingGrams": 450.0,
  "kcal": 490.0,
  "proteinG": 22.0,
  "fatG": 16.5,
  "carbG": 63.5,
  "fiberG": 0.8,
  "sodiumMg": 1180.0,
  "components": [
   {
    "name": "Bánh phở",
    "grams": 200.0
   },
   {
    "name": "Bò tái",
    "grams": 30.0
   },
   {
    "name": "Gầu",
    "grams": 30.0
   },
   {
    "name": "Bắp bò",
    "grams": 30.0
   },
   {
    "name": "Nước dùng",
    "grams": 145.0
   },
   {
    "name": "Hành, rau",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000380",
  "category": "Món Bún",
  "name": "Bún mọc sườn chua",
  "ingredientsText": "Bún tươi, mọc, sườn heo, quả sấu",
  "servingGrams": 450.0,
  "kcal": 435.0,
  "proteinG": 19.2,
  "fatG": 14.8,
  "carbG": 54.2,
  "fiberG": 1.6,
  "sodiumMg": 1120.0,
  "components": [
   {
    "name": "Bún tươi",
    "grams": 200.0
   },
   {
    "name": "Mọc",
    "grams": 40.0
   },
   {
    "name": "Sườn heo",
    "grams": 50.0
   },
   {
    "name": "Quả sấu",
    "grams": 15.0
   },
   {
    "name": "Nước dùng",
    "grams": 135.0
   },
   {
    "name": "Rau",
    "grams": 10.0
   }
  ]
 },
 {
  "code": "VPF-000502",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá hú kho tộ mỡ hành đậm đà",
  "ingredientsText": "Thịt cá hú, nước mắm kho tộ",
  "servingGrams": 110.0,
  "kcal": 198.0,
  "proteinG": 16.5,
  "fatG": 12.8,
  "carbG": 5.2,
  "fiberG": null,
  "sodiumMg": 815.0,
  "components": [
   {
    "name": "Thịt cá hú",
    "grams": 95.0
   },
   {
    "name": "Nước mắm, đường",
    "grams": 10.0
   },
   {
    "name": "Mỡ hành",
    "grams": 5.0
   }
  ]
 },
 {
  "code": "VPF-000503",
  "category": "Món Mặn - Cá & Hải Sản",
  "name": "Cá diêu hồng hấp hồng kông xì dầu dầu hào",
  "ingredientsText": "Thịt cá diêu hồng, xì dầu, dầu hào, gừng",
  "servingGrams": 150.0,
  "kcal": 178.0,
  "proteinG": 18.8,
  "fatG": 8.2,
  "carbG": 6.5,
  "fiberG": 0.5,
  "sodiumMg": 625.0,
  "components": [
   {
    "name": "Thịt cá diêu hồng",
    "grams": 120.0
   },
   {
    "name": "Xì dầu, dầu hào",
    "grams": 15.0
   },
   {
    "name": "Gừng, hành",
    "grams": 15.0
   }
  ]
 },
 {
  "code": "VPF-000526",
  "category": "Món Cơm",
  "name": "Cơm tấm sườn bì chả trứng đầy đủ Sài Gòn",
  "ingredientsText": "Gạo tấm, sườn heo nướng, bì, chả trứng hấp",
  "servingGrams": 350.0,
  "kcal": 615.0,
  "proteinG": 27.8,
  "fatG": 23.5,
  "carbG": 71.2,
  "fiberG": 1.5,
  "sodiumMg": 892.0,
  "components": [
   {
    "name": "Cơm tấm chín",
    "grams": 180.0
   },
   {
    "name": "Sườn heo nướng",
    "grams": 80.0
   },
   {
    "name": "Bì heo",
    "grams": 30.0
   },
   {
    "name": "Chả trứng hấp",
    "grams": 40.0
   },
   {
    "name": "Nước mắm pha",
    "grams": 20.0
   }
  ]
 }
]
