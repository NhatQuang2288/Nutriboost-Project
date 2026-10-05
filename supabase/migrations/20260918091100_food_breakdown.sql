-- ============================================================================
-- Thành phần của món, để trợ lý đọc từ CSDL thay vì từ danh mục cố định trong mã.
--
-- `dish_components` chỉ lưu được thành phần trỏ tới một nguyên liệu CÓ SỐ LIỆU trên 100 g (khoá
-- ngoại tới `foods`). Món lấy từ bảng VDD có nguyên liệu như "Nước dùng xương" hay "Hành, rau
-- thơm" không có hàng nào trong `foods`, nên không nhét vừa — và gram của chúng là số ƯỚC TÍNH.
-- Vì vậy thành phần để hiển thị nằm riêng trong một cột jsonb:
--
--   [{ "name": "Bánh phở", "grams": 200, "ingredientSlug": "pho-tuoi" }, ...]
--
-- `ingredientSlug` chỉ có khi nguyên liệu đó có số trên 100 g (để tính kcal riêng khi khách đổi
-- gram). Số dinh dưỡng của MÓN không đọc từ cột này: nó nằm ở các cột `*_per_100g`/`*_g`.
--
-- Cột này chỉ phục vụ HIỂN THỊ và chỉnh khối lượng. Quyền đọc kế thừa `foods_select_all`.
-- ============================================================================

alter table public.foods
  add column components jsonb,
  add column components_estimated boolean not null default false;

alter table public.foods
  add constraint foods_components_is_array
  check (components is null or jsonb_typeof(components) = 'array');

comment on column public.foods.components is
  'Thành phần để hiển thị: [{name, grams, ingredientSlug?}], gram ứng với một khẩu phần tham khảo.';
comment on column public.foods.components_estimated is
  'true khi gram từng thành phần là số ước tính (món lấy từ bảng VDD), không phải số gốc.';
