-- ============================================================================
-- NutriBoost — một tuần dữ liệu mẫu cho MỘT khách hàng
--
-- TỆP NÀY ĐƯỢC SINH TỰ ĐỘNG. Đừng sửa tay:
--   npm run make:week -- khach@example.com --emit-sql
--
-- Cách dùng: Supabase Studio → SQL Editor → dán toàn bộ tệp → Run.
--
-- Đặc tính:
--   • Thay thế đúng 7 ngày gần nhất của khách, nên chạy lại vẫn ra một tuần.
--   • Món ăn trỏ tới `foods` thật theo `slug`, không phải bản ghi mồ côi.
--   • Tổng ngày do `refresh_daily_summary` tính, không phải số chép tay.
-- ============================================================================

do $$
declare
  v_email text := 'khach@example.com';  -- ĐỔI DÒNG NÀY thành email khách của bạn
  v_user uuid;
  v_today date := current_date;
  v_meal uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(v_email);

  if v_user is null then
    raise exception 'Không tìm thấy tài khoản % — tài khoản được tạo ở lần đăng nhập đầu tiên.', v_email;
  end if;

  -- Hồ sơ tối thiểu: chỉ tạo khi chưa có, không ghi đè hồ sơ khách đã tự thiết lập.
  insert into public.profiles (id, full_name) values (v_user, 'Minh')
  on conflict (id) do nothing;

  insert into public.health_profiles (
    user_id, sex, date_of_birth, height_cm, activity_level, goal, rate_kg_per_week
  )
  values (v_user, 'male', '1994-01-01', 172, 'light', 'lose', 0.35)
  on conflict (user_id) do nothing;

  -- Dọn tuần cũ trước khi nạp, để chạy lại không sinh ra hai bữa cho một ngày.
  delete from public.meal_logs where user_id = v_user and local_date >= v_today - 6;
  delete from public.activity_logs where user_id = v_user and local_date >= v_today - 6;
  delete from public.body_metrics where user_id = v_user and measured_on >= v_today - 6;
  delete from public.daily_summaries where user_id = v_user and local_date >= v_today - 6;
  delete from public.energy_targets where user_id = v_user and effective_from >= v_today - 6;

  -- Cân nặng theo ngày.
  insert into public.body_metrics (user_id, measured_on, weight_kg) values
    (v_user, v_today - 6, 74.2),
    (v_user, v_today - 5, 74),
    (v_user, v_today - 4, 74.1),
    (v_user, v_today - 3, 73.9),
    (v_user, v_today - 2, 74),
    (v_user, v_today - 1, 73.8),
    (v_user, v_today - 0, 73.8);

  -- Mục tiêu năng lượng, hiệu lực từ đầu tuần.
  insert into public.energy_targets (
    user_id, effective_from, bmr_kcal, tdee_kcal, target_kcal,
    protein_g, carb_g, fat_g, formula_version, inputs, floors_applied
  )
  values (
    v_user, v_today - 6, 1662, 2285, 1900,
    135, 215, 55, 'nutriboost-energy-1.0.0',
    '{"sex":"male","dateOfBirth":"1994-01-01","heightCm":172,"weightKg":74.2,"activityLevel":"light","goal":"lose","rateKgPerWeek":0.35}'::jsonb,
    '{}'::text[]
  );

  -- Ngày 1/7 (v_today - 6), 1747 kcal
  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 6) + time '07:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 6, 'breakfast', 'ai_chat', 'Sáng nay mình ăn phở bò với cà phê sữa đá',
    643, 31.4, 106, 10, ((v_today - 6) + time '07:00') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'pho-bo'), 'Phở bò', 400, 548, 28.8, 90, 7.6, 0.4, 0, 536, 'ai'),
    (v_meal, (select id from public.foods where slug = 'ca-phe-sua-da'), 'Cà phê sữa đá', 200, 95, 2.6, 16, 2.4, 0, 0, 36, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 6) + time '12:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 6, 'lunch', 'ai_chat', 'Trưa ăn cơm tấm sườn và canh rau muống',
    574, 38.6, 67.7, 15.3, ((v_today - 6) + time '12:00') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-tam-suon'), 'Cơm tấm sườn', 350, 461, 25.6, 60.9, 11.5, 1.1, 0, 599, 'ai'),
    (v_meal, (select id from public.foods where slug = 'canh-rau-muong'), 'Canh rau muống', 250, 113, 13, 6.8, 3.8, 3.5, 0, 665, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 6) + time '16:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 6, 'snack', 'ai_chat', 'Xế chiều làm hũ sữa chua chuối',
    97, 4, 15.3, 2.2, ((v_today - 6) + time '16:00') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'sua-chua-chuoi'), 'Sữa chua chuối', 130, 97, 4, 15.3, 2.2, 1.3, 0, 38, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 6) + time '18:30') at time zone 'Asia/Ho_Chi_Minh', v_today - 6, 'dinner', 'ai_chat', 'Tối ăn cơm với cá basa kho và rau muống xào tỏi',
    433, 32.2, 48, 12.1, ((v_today - 6) + time '18:30') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-trang'), 'Cơm trắng', 150, 195, 4.1, 42.3, 0.5, 0.6, 0, 8, 'ai'),
    (v_meal, (select id from public.foods where slug = 'ca-basa'), 'Cá basa', 150, 131, 24, 0, 3.8, 0, 0, 90, 'ai'),
    (v_meal, (select id from public.foods where slug = 'rau-muong-xao-toi'), 'Rau muống xào tỏi', 150, 107, 4.1, 5.7, 7.8, 2.6, 0, 56, 'ai');

  -- Vận động
  insert into public.activity_logs (
    user_id, performed_at, local_date, activity_code, minutes, met, kcal_burned, source
  )
  values (
    v_user, ((v_today - 6) + time '18:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 6, 'walking', 35, 3.5, 159, 'manual'
  );

  -- Ngày 2/7 (v_today - 5), 1748 kcal
  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 5) + time '07:15') at time zone 'Asia/Ho_Chi_Minh', v_today - 5, 'breakfast', 'ai_chat', 'Sáng ăn bánh mì thịt, uống sinh tố chuối sữa',
    420, 19.2, 62.4, 9.9, ((v_today - 5) + time '07:15') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'banh-mi-thit'), 'Bánh mì thịt', 138, 278, 14.8, 39.2, 6.2, 0.1, 0, 378, 'ai'),
    (v_meal, (select id from public.foods where slug = 'sinh-to-chuoi-sua'), 'Sinh tố chuối sữa', 184, 142, 4.4, 23.2, 3.7, 2.2, 0, 46, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 5) + time '12:10') at time zone 'Asia/Ho_Chi_Minh', v_today - 5, 'lunch', 'ai_chat', 'Trưa ăn bún bò Huế, thêm hai cuốn gỏi cuốn',
    628, 41, 90.6, 10.6, ((v_today - 5) + time '12:10') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'bun-bo-hue'), 'Bún bò Huế', 350, 487, 28, 73.9, 8.4, 0, 0, 749, 'ai'),
    (v_meal, (select id from public.foods where slug = 'goi-cuon'), 'Gỏi cuốn', 138, 141, 13, 16.7, 2.2, 0.6, 0, 81, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 5) + time '15:30') at time zone 'Asia/Ho_Chi_Minh', v_today - 5, 'snack', 'ai_chat', 'Chiều luộc một củ khoai lang',
    164, 1.5, 38.5, 0.3, ((v_today - 5) + time '15:30') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'khoai-lang-luoc'), 'Khoai lang luộc', 138, 164, 1.5, 38.5, 0.3, 1.8, 0, 15, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 5) + time '19:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 5, 'dinner', 'ai_chat', 'Tối ăn cơm gà và rau muống xào tỏi',
    536, 26.6, 56.5, 22.1, ((v_today - 5) + time '19:00') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-ga'), 'Cơm gà', 276, 437, 22.9, 51.3, 14.9, 0.8, 0, 411, 'ai'),
    (v_meal, (select id from public.foods where slug = 'rau-muong-xao-toi'), 'Rau muống xào tỏi', 138, 99, 3.7, 5.2, 7.2, 2.3, 0, 51, 'ai');

  -- Ngày 3/7 (v_today - 4), 1937 kcal
  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 4) + time '06:45') at time zone 'Asia/Ho_Chi_Minh', v_today - 4, 'breakfast', 'ai_chat', 'Sáng ăn cơm rang trứng, uống sữa tươi không đường',
    527, 18.7, 67.2, 19.5, ((v_today - 4) + time '06:45') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-rang-trung'), 'Cơm rang trứng', 265, 398, 11.9, 57, 12.5, 0.8, 0, 387, 'ai'),
    (v_meal, (select id from public.foods where slug = 'sua-tuoi-khong-duong'), 'Sữa tươi không đường', 212, 129, 6.8, 10.2, 7, 0, 0, 95, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 4) + time '12:20') at time zone 'Asia/Ho_Chi_Minh', v_today - 4, 'lunch', 'ai_chat', 'Trưa ăn cơm trứng với đậu hũ chiên',
    665, 26.6, 71, 29.4, ((v_today - 4) + time '12:20') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-trung'), 'Cơm trứng', 318, 480, 15.9, 67.4, 14.9, 1, 0, 474, 'ai'),
    (v_meal, (select id from public.foods where slug = 'dau-hu-chien'), 'Đậu hũ chiên', 127, 185, 10.7, 3.6, 14.5, 0, 0, 11, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 4) + time '16:15') at time zone 'Asia/Ho_Chi_Minh', v_today - 4, 'snack', 'ai_chat', 'Chiều ăn sữa chua chuối',
    103, 4.3, 16.3, 2.3, ((v_today - 4) + time '16:15') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'sua-chua-chuoi'), 'Sữa chua chuối', 138, 103, 4.3, 16.3, 2.3, 1.4, 0, 40, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 4) + time '18:45') at time zone 'Asia/Ho_Chi_Minh', v_today - 4, 'dinner', 'ai_chat', 'Tối ăn cơm với thịt gà ta và canh rau muống',
    642, 50.4, 52, 25.3, ((v_today - 4) + time '18:45') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-trang'), 'Cơm trắng', 159, 207, 4.3, 44.8, 0.5, 0.6, 0, 8, 'ai'),
    (v_meal, (select id from public.foods where slug = 'thit-ga-ta'), 'Thịt gà ta', 159, 316, 32.3, 0, 20.8, 0, 0, 111, 'ai'),
    (v_meal, (select id from public.foods where slug = 'canh-rau-muong'), 'Canh rau muống', 265, 119, 13.8, 7.2, 4, 3.7, 0, 705, 'ai');

  -- Vận động
  insert into public.activity_logs (
    user_id, performed_at, local_date, activity_code, minutes, met, kcal_burned, source
  )
  values (
    v_user, ((v_today - 4) + time '18:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 4, 'walking', 45, 3.5, 204, 'manual'
  );

  -- Ngày 4/7 (v_today - 3), 1676 kcal
  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 3) + time '07:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 3, 'breakfast', 'ai_chat', 'Sáng nay mình ăn phở bò với cà phê sữa đá',
    617, 30.1, 101.8, 9.6, ((v_today - 3) + time '07:00') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'pho-bo'), 'Phở bò', 384, 526, 27.6, 86.4, 7.3, 0.4, 0, 515, 'ai'),
    (v_meal, (select id from public.foods where slug = 'ca-phe-sua-da'), 'Cà phê sữa đá', 192, 91, 2.5, 15.4, 2.3, 0, 0, 35, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 3) + time '12:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 3, 'lunch', 'ai_chat', 'Trưa ăn cơm tấm sườn và canh rau muống',
    551, 37, 65, 14.7, ((v_today - 3) + time '12:00') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-tam-suon'), 'Cơm tấm sườn', 336, 443, 24.5, 58.5, 11.1, 1, 0, 575, 'ai'),
    (v_meal, (select id from public.foods where slug = 'canh-rau-muong'), 'Canh rau muống', 240, 108, 12.5, 6.5, 3.6, 3.4, 0, 638, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 3) + time '16:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 3, 'snack', 'ai_chat', 'Xế chiều làm hũ sữa chua chuối',
    93, 3.9, 14.8, 2.1, ((v_today - 3) + time '16:00') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'sua-chua-chuoi'), 'Sữa chua chuối', 125, 93, 3.9, 14.8, 2.1, 1.3, 0, 36, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 3) + time '18:30') at time zone 'Asia/Ho_Chi_Minh', v_today - 3, 'dinner', 'ai_chat', 'Tối ăn cơm với cá basa kho và rau muống xào tỏi',
    415, 30.8, 46.1, 11.5, ((v_today - 3) + time '18:30') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-trang'), 'Cơm trắng', 144, 187, 3.9, 40.6, 0.4, 0.6, 0, 7, 'ai'),
    (v_meal, (select id from public.foods where slug = 'ca-basa'), 'Cá basa', 144, 125, 23, 0, 3.6, 0, 0, 86, 'ai'),
    (v_meal, (select id from public.foods where slug = 'rau-muong-xao-toi'), 'Rau muống xào tỏi', 144, 103, 3.9, 5.5, 7.5, 2.4, 0, 53, 'ai');

  -- Vận động
  insert into public.activity_logs (
    user_id, performed_at, local_date, activity_code, minutes, met, kcal_burned, source
  )
  values (
    v_user, ((v_today - 3) + time '18:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 3, 'cycling', 30, 6.8, 264, 'manual'
  );

  -- Ngày 5/7 (v_today - 2), 2050 kcal
  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 2) + time '07:15') at time zone 'Asia/Ho_Chi_Minh', v_today - 2, 'breakfast', 'ai_chat', 'Sáng ăn bánh mì thịt, uống sinh tố chuối sữa',
    493, 22.5, 73.2, 11.6, ((v_today - 2) + time '07:15') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'banh-mi-thit'), 'Bánh mì thịt', 162, 327, 17.3, 46, 7.3, 0.2, 0, 444, 'ai'),
    (v_meal, (select id from public.foods where slug = 'sinh-to-chuoi-sua'), 'Sinh tố chuối sữa', 216, 166, 5.2, 27.2, 4.3, 2.6, 0, 54, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 2) + time '12:10') at time zone 'Asia/Ho_Chi_Minh', v_today - 2, 'lunch', 'ai_chat', 'Trưa ăn bún bò Huế, thêm hai cuốn gỏi cuốn',
    735, 48, 106.1, 12.4, ((v_today - 2) + time '12:10') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'bun-bo-hue'), 'Bún bò Huế', 410, 570, 32.8, 86.5, 9.8, 0, 0, 877, 'ai'),
    (v_meal, (select id from public.foods where slug = 'goi-cuon'), 'Gỏi cuốn', 162, 165, 15.2, 19.6, 2.6, 0.6, 0, 96, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 2) + time '15:30') at time zone 'Asia/Ho_Chi_Minh', v_today - 2, 'snack', 'ai_chat', 'Chiều luộc một củ khoai lang',
    193, 1.8, 45.2, 0.3, ((v_today - 2) + time '15:30') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'khoai-lang-luoc'), 'Khoai lang luộc', 162, 193, 1.8, 45.2, 0.3, 2.1, 0, 18, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 2) + time '19:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 2, 'dinner', 'ai_chat', 'Tối ăn cơm gà và rau muống xào tỏi',
    629, 31.3, 66.5, 25.9, ((v_today - 2) + time '19:00') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-ga'), 'Cơm gà', 324, 513, 26.9, 60.3, 17.5, 1, 0, 483, 'ai'),
    (v_meal, (select id from public.foods where slug = 'rau-muong-xao-toi'), 'Rau muống xào tỏi', 162, 116, 4.4, 6.2, 8.4, 2.8, 0, 60, 'ai');

  -- Ngày 6/7 (v_today - 1), 1645 kcal
  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 1) + time '06:45') at time zone 'Asia/Ho_Chi_Minh', v_today - 1, 'breakfast', 'ai_chat', 'Sáng ăn cơm rang trứng, uống sữa tươi không đường',
    448, 15.9, 57, 16.5, ((v_today - 1) + time '06:45') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-rang-trung'), 'Cơm rang trứng', 225, 338, 10.1, 48.4, 10.6, 0.7, 0, 329, 'ai'),
    (v_meal, (select id from public.foods where slug = 'sua-tuoi-khong-duong'), 'Sữa tươi không đường', 180, 110, 5.8, 8.6, 5.9, 0, 0, 81, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 1) + time '12:20') at time zone 'Asia/Ho_Chi_Minh', v_today - 1, 'lunch', 'ai_chat', 'Trưa ăn cơm trứng với đậu hũ chiên',
    564, 22.6, 60.2, 25, ((v_today - 1) + time '12:20') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-trung'), 'Cơm trứng', 270, 407, 13.5, 57.2, 12.7, 0.8, 0, 402, 'ai'),
    (v_meal, (select id from public.foods where slug = 'dau-hu-chien'), 'Đậu hũ chiên', 108, 157, 9.1, 3, 12.3, 0, 0, 10, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 1) + time '16:15') at time zone 'Asia/Ho_Chi_Minh', v_today - 1, 'snack', 'ai_chat', 'Chiều ăn sữa chua chuối',
    87, 3.6, 13.8, 2, ((v_today - 1) + time '16:15') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'sua-chua-chuoi'), 'Sữa chua chuối', 117, 87, 3.6, 13.8, 2, 1.2, 0, 34, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 1) + time '18:45') at time zone 'Asia/Ho_Chi_Minh', v_today - 1, 'dinner', 'ai_chat', 'Tối ăn cơm với thịt gà ta và canh rau muống',
    546, 42.7, 44.2, 21.5, ((v_today - 1) + time '18:45') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-trang'), 'Cơm trắng', 135, 176, 3.6, 38.1, 0.4, 0.5, 0, 7, 'ai'),
    (v_meal, (select id from public.foods where slug = 'thit-ga-ta'), 'Thịt gà ta', 135, 269, 27.4, 0, 17.7, 0, 0, 95, 'ai'),
    (v_meal, (select id from public.foods where slug = 'canh-rau-muong'), 'Canh rau muống', 225, 101, 11.7, 6.1, 3.4, 3.2, 0, 599, 'ai');

  -- Vận động
  insert into public.activity_logs (
    user_id, performed_at, local_date, activity_code, minutes, met, kcal_burned, source
  )
  values (
    v_user, ((v_today - 1) + time '18:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 1, 'walking', 40, 3.5, 181, 'manual'
  );

  -- Ngày 7/7 (v_today - 0), 1782 kcal
  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 0) + time '07:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 0, 'breakfast', 'ai_chat', 'Sáng nay mình ăn phở bò với cà phê sữa đá',
    656, 32.1, 108.1, 10.2, ((v_today - 0) + time '07:00') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'pho-bo'), 'Phở bò', 408, 559, 29.4, 91.8, 7.8, 0.4, 0, 547, 'ai'),
    (v_meal, (select id from public.foods where slug = 'ca-phe-sua-da'), 'Cà phê sữa đá', 204, 97, 2.7, 16.3, 2.4, 0, 0, 37, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 0) + time '12:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 0, 'lunch', 'ai_chat', 'Trưa ăn cơm tấm sườn và canh rau muống',
    586, 39.4, 69, 15.6, ((v_today - 0) + time '12:00') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-tam-suon'), 'Cơm tấm sườn', 357, 471, 26.1, 62.1, 11.8, 1.1, 0, 610, 'ai'),
    (v_meal, (select id from public.foods where slug = 'canh-rau-muong'), 'Canh rau muống', 255, 115, 13.3, 6.9, 3.8, 3.6, 0, 678, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 0) + time '16:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 0, 'snack', 'ai_chat', 'Xế chiều làm hũ sữa chua chuối',
    99, 4.1, 15.7, 2.3, ((v_today - 0) + time '16:00') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'sua-chua-chuoi'), 'Sữa chua chuối', 133, 99, 4.1, 15.7, 2.3, 1.3, 0, 39, 'ai');

  insert into public.meal_logs (
    user_id, eaten_at, local_date, meal_type, source, raw_input,
    total_kcal, total_protein_g, total_carb_g, total_fat_g, confirmed_at
  )
  values (
    v_user, ((v_today - 0) + time '18:30') at time zone 'Asia/Ho_Chi_Minh', v_today - 0, 'dinner', 'ai_chat', 'Tối ăn cơm với cá basa kho và rau muống xào tỏi',
    441, 32.7, 48.9, 12.3, ((v_today - 0) + time '18:30') at time zone 'Asia/Ho_Chi_Minh'
  ) returning id into v_meal;

  insert into public.meal_log_items (
    meal_log_id, food_id, display_name, grams, kcal, protein_g, carb_g, fat_g,
    fiber_g, sugar_g, sodium_mg, match_method
  ) values
    (v_meal, (select id from public.foods where slug = 'com-trang'), 'Cơm trắng', 153, 199, 4.1, 43.1, 0.5, 0.6, 0, 8, 'ai'),
    (v_meal, (select id from public.foods where slug = 'ca-basa'), 'Cá basa', 153, 133, 24.5, 0, 3.8, 0, 0, 92, 'ai'),
    (v_meal, (select id from public.foods where slug = 'rau-muong-xao-toi'), 'Rau muống xào tỏi', 153, 109, 4.1, 5.8, 8, 2.6, 0, 57, 'ai');

  -- Vận động
  insert into public.activity_logs (
    user_id, performed_at, local_date, activity_code, minutes, met, kcal_burned, source
  )
  values (
    v_user, ((v_today - 0) + time '18:00') at time zone 'Asia/Ho_Chi_Minh', v_today - 0, 'strength', 45, 5, 291, 'manual'
  );

  -- Tổng hợp ngày: kcal nạp vào, kcal đốt, độ tuân thủ, chuỗi ngày.
  -- Tính bằng hàm của CSDL chứ không chép tay, để khớp với đường ghi thật của ứng dụng.
  perform public.refresh_daily_summary(v_user, v_today - 6);
  perform public.refresh_daily_summary(v_user, v_today - 5);
  perform public.refresh_daily_summary(v_user, v_today - 4);
  perform public.refresh_daily_summary(v_user, v_today - 3);
  perform public.refresh_daily_summary(v_user, v_today - 2);
  perform public.refresh_daily_summary(v_user, v_today - 1);
  perform public.refresh_daily_summary(v_user, v_today - 0);

  raise notice 'Đã nạp 7 ngày dữ liệu mẫu cho %', v_email;
end $$;
