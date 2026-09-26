/**
 * Kiểu dữ liệu Supabase.
 *
 * ĐÂY LÀ BẢN VIẾT TAY, chỉ phủ các bảng và hàm mà Release 1 dùng.
 * Khi đã có Supabase project thật, chạy `npm run db:types` để sinh lại đầy đủ:
 *
 *     supabase gen types typescript --local > packages/db/src/database.types.ts
 *
 * Sau khi sinh lại, file này sẽ có thêm `Relationships` và các bảng cho Release 2.
 * Đừng sửa tay bản sinh tự động.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ---------------------------------------------------------------------------
// Enum — phải khớp chính xác các `create type` trong migration 001
// ---------------------------------------------------------------------------

export type UserRole = 'client' | 'pt' | 'admin'
export type SexType = 'male' | 'female'
export type ActivityLevelDb = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type GoalType = 'lose' | 'maintain' | 'gain'
export type MedicalFlagDb =
  | 'diabetes'
  | 'hypertension'
  | 'heart_disease'
  | 'kidney_disease'
  | 'liver_disease'
  | 'pregnancy'
  | 'breastfeeding'
  | 'eating_disorder'
  | 'gout'
  | 'thyroid'
export type FoodKind = 'ingredient' | 'dish'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type LogSource = 'ai_chat' | 'quick_chip' | 'repeat' | 'manual' | 'photo' | 'voice'
export type MatchMethod = 'exact' | 'trigram' | 'ai' | 'user'
export type PlanStatus = 'draft' | 'active' | 'archived'
export type PlanItemStatus = 'suggested' | 'accepted' | 'swapped' | 'skipped'
export type AiPurpose =
  'parse_meal' | 'estimate_meal' | 'generate_plan' | 'chat' | 'insight' | 'title'
export type AiCallStatus = 'ok' | 'error' | 'rate_limited' | 'blocked' | 'timeout'
export type ConsentKind = 'terms' | 'health_data' | 'ai_processing'
export type ChatRole = 'user' | 'assistant' | 'system' | 'tool'

/** Khuôn chung cho mỗi bảng, khớp cấu trúc Supabase sinh ra. */
interface TableDefinition<Row, Insert, Update> {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

// ---------------------------------------------------------------------------
// Hồ sơ
// ---------------------------------------------------------------------------

export interface ProfilesRow {
  id: string
  role: UserRole
  full_name: string | null
  timezone: string
  locale: string
  onboarded_at: string | null
  created_at: string
  updated_at: string
}

export interface HealthProfilesRow {
  user_id: string
  sex: SexType
  date_of_birth: string
  height_cm: number
  activity_level: ActivityLevelDb
  goal: GoalType
  target_weight_kg: number | null
  rate_kg_per_week: number
  dietary_prefs: string[]
  allergies: string[]
  medical_flags: MedicalFlagDb[]
  updated_at: string
}

export interface ConsentsRow {
  id: string
  user_id: string
  kind: ConsentKind
  version: string
  accepted_at: string
  revoked_at: string | null
}

export interface BodyMetricsRow {
  id: string
  user_id: string
  measured_on: string
  weight_kg: number
  waist_cm: number | null
  source: LogSource
  created_at: string
}

export interface EnergyTargetsRow {
  id: string
  user_id: string
  effective_from: string
  bmr_kcal: number
  tdee_kcal: number
  target_kcal: number
  protein_g: number
  carb_g: number
  fat_g: number
  formula_version: string
  inputs: Json
  floors_applied: string[]
  created_at: string
}

// ---------------------------------------------------------------------------
// Danh mục thực phẩm
// ---------------------------------------------------------------------------

export interface FoodsRow {
  id: string
  slug: string
  name_vi: string
  name_en: string | null
  kind: FoodKind
  category: string | null
  serving_name: string | null
  serving_grams: number | null
  kcal_per_100g: number
  protein_g: number
  carb_g: number
  fat_g: number
  fiber_g: number
  sugar_g: number
  sodium_mg: number
  source_ref: string | null
  verified: boolean
  verified_by: string | null
  name_key: string
  created_at: string
  updated_at: string
}

export interface FoodAliasesRow {
  id: string
  food_id: string
  alias: string
  alias_key: string
}

export interface DishComponentsRow {
  dish_id: string
  ingredient_id: string
  grams: number
}

// ---------------------------------------------------------------------------
// Nhật ký
// ---------------------------------------------------------------------------

export interface AiCallsRow {
  id: string
  user_id: string | null
  purpose: AiPurpose
  model: string
  prompt_version: string
  input_tokens: number
  output_tokens: number
  cached_tokens: number
  cost_usd: number
  latency_ms: number
  status: AiCallStatus
  error_code: string | null
  cache_hit: boolean
  created_at: string
}

export interface MealLogsRow {
  id: string
  user_id: string
  eaten_at: string
  local_date: string
  meal_type: MealType
  source: LogSource
  raw_input: string | null
  ai_call_id: string | null
  ai_confidence: number | null
  total_kcal: number
  total_protein_g: number
  total_carb_g: number
  total_fat_g: number
  confirmed_at: string | null
  created_at: string
}

export interface MealLogItemsRow {
  id: string
  meal_log_id: string
  food_id: string | null
  display_name: string
  grams: number
  kcal: number
  protein_g: number
  carb_g: number
  fat_g: number
  match_method: MatchMethod
  match_score: number | null
  created_at: string
}

export interface ActivityLogsRow {
  id: string
  user_id: string
  performed_at: string
  local_date: string
  activity_code: string
  minutes: number
  met: number
  kcal_burned: number
  source: LogSource
  created_at: string
}

// ---------------------------------------------------------------------------
// Kế hoạch
// ---------------------------------------------------------------------------

export interface PlansRow {
  id: string
  user_id: string
  week_start: string
  status: PlanStatus
  ai_call_id: string | null
  accepted_at: string | null
  created_at: string
}

export interface PlanItemsRow {
  id: string
  plan_id: string
  plan_date: string
  meal_type: MealType
  food_id: string | null
  display_name: string
  grams: number
  kcal: number
  protein_g: number
  carb_g: number
  fat_g: number
  status: PlanItemStatus
  rationale: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Trợ lý
// ---------------------------------------------------------------------------

export interface ChatThreadsRow {
  id: string
  user_id: string
  title: string
  title_source: 'default' | 'ai' | 'user'
  pinned: boolean
  last_message_at: string
  archived_at: string | null
  created_at: string
}

export interface ChatMessagesRow {
  id: string
  thread_id: string
  user_id: string
  role: ChatRole
  parts: Json
  text_content: string | null
  ai_call_id: string | null
  created_at: string
}

export interface AiInsightsRow {
  id: string
  user_id: string
  local_date: string
  headline: string
  action_text: string | null
  severity: 'info' | 'warning' | 'refer'
  payload: Json
  ai_call_id: string | null
  created_at: string
}

export interface DailySummariesRow {
  user_id: string
  local_date: string
  kcal_in: number
  kcal_out: number
  protein_g: number
  carb_g: number
  fat_g: number
  target_kcal: number | null
  adherence_pct: number | null
  streak_days: number
  updated_at: string
}

export interface PtClientsRow {
  pt_id: string
  client_id: string
  status: 'pending' | 'active' | 'ended'
  started_at: string
  ended_at: string | null
}

export interface AnalyticsEventsRow {
  id: number
  user_id: string | null
  name: string
  props: Json
  created_at: string
}

// ---------------------------------------------------------------------------
// Cơ sở dữ liệu
// ---------------------------------------------------------------------------

export interface SearchFoodsResult {
  food_id: string
  name_vi: string
  kind: FoodKind
  category: string | null
  serving_name: string | null
  serving_grams: number | null
  kcal_per_100g: number
  protein_g: number
  carb_g: number
  fat_g: number
  score: number
  matched_on: 'name' | 'alias'
}

export interface Database {
  public: {
    Tables: {
      profiles: TableDefinition<
        ProfilesRow,
        {
          id: string
          role?: UserRole
          full_name?: string | null
          timezone?: string
          locale?: string
          onboarded_at?: string | null
        },
        Partial<ProfilesRow>
      >
      health_profiles: TableDefinition<
        HealthProfilesRow,
        {
          user_id: string
          sex: SexType
          date_of_birth: string
          height_cm: number
          activity_level?: ActivityLevelDb
          goal?: GoalType
          target_weight_kg?: number | null
          rate_kg_per_week?: number
          dietary_prefs?: string[]
          allergies?: string[]
          medical_flags?: MedicalFlagDb[]
        },
        Partial<HealthProfilesRow>
      >
      consents: TableDefinition<
        ConsentsRow,
        { user_id: string; kind: ConsentKind; version: string; revoked_at?: string | null },
        Partial<ConsentsRow>
      >
      body_metrics: TableDefinition<
        BodyMetricsRow,
        {
          user_id: string
          measured_on: string
          weight_kg: number
          waist_cm?: number | null
          source?: LogSource
        },
        Partial<BodyMetricsRow>
      >
      energy_targets: TableDefinition<
        EnergyTargetsRow,
        {
          user_id: string
          effective_from: string
          bmr_kcal: number
          tdee_kcal: number
          target_kcal: number
          protein_g: number
          carb_g: number
          fat_g: number
          formula_version: string
          inputs?: Json
          floors_applied?: string[]
        },
        Partial<EnergyTargetsRow>
      >
      foods: TableDefinition<
        FoodsRow,
        Omit<FoodsRow, 'id' | 'created_at' | 'updated_at' | 'name_key'> & { id?: string },
        Partial<FoodsRow>
      >
      food_aliases: TableDefinition<
        FoodAliasesRow,
        { food_id: string; alias: string },
        Partial<FoodAliasesRow>
      >
      dish_components: TableDefinition<
        DishComponentsRow,
        { dish_id: string; ingredient_id: string; grams: number },
        Partial<DishComponentsRow>
      >
      ai_calls: TableDefinition<
        AiCallsRow,
        {
          user_id?: string | null
          purpose: AiPurpose
          model: string
          prompt_version: string
          input_tokens?: number
          output_tokens?: number
          cached_tokens?: number
          cost_usd?: number
          latency_ms?: number
          status?: AiCallStatus
          error_code?: string | null
          cache_hit?: boolean
        },
        Partial<AiCallsRow>
      >
      meal_logs: TableDefinition<
        MealLogsRow,
        {
          user_id: string
          eaten_at?: string
          local_date: string
          meal_type: MealType
          source?: LogSource
          raw_input?: string | null
          ai_call_id?: string | null
          ai_confidence?: number | null
          total_kcal?: number
          total_protein_g?: number
          total_carb_g?: number
          total_fat_g?: number
          confirmed_at?: string | null
        },
        Partial<MealLogsRow>
      >
      meal_log_items: TableDefinition<
        MealLogItemsRow,
        {
          meal_log_id: string
          food_id?: string | null
          display_name: string
          grams: number
          kcal?: number
          protein_g?: number
          carb_g?: number
          fat_g?: number
          match_method?: MatchMethod
          match_score?: number | null
        },
        Partial<MealLogItemsRow>
      >
      activity_logs: TableDefinition<
        ActivityLogsRow,
        {
          user_id: string
          performed_at?: string
          local_date: string
          activity_code: string
          minutes: number
          met: number
          kcal_burned: number
          source?: LogSource
        },
        Partial<ActivityLogsRow>
      >
      plans: TableDefinition<
        PlansRow,
        { user_id: string; week_start: string; status?: PlanStatus; ai_call_id?: string | null },
        Partial<PlansRow>
      >
      plan_items: TableDefinition<
        PlanItemsRow,
        {
          plan_id: string
          plan_date: string
          meal_type: MealType
          food_id?: string | null
          display_name: string
          grams: number
          kcal?: number
          protein_g?: number
          carb_g?: number
          fat_g?: number
          status?: PlanItemStatus
          rationale?: string | null
        },
        Partial<PlanItemsRow>
      >
      chat_threads: TableDefinition<
        ChatThreadsRow,
        {
          user_id: string
          title?: string
          title_source?: 'default' | 'ai' | 'user'
          pinned?: boolean
          last_message_at?: string
          archived_at?: string | null
        },
        Partial<ChatThreadsRow>
      >
      chat_messages: TableDefinition<
        ChatMessagesRow,
        {
          thread_id: string
          user_id: string
          role: ChatRole
          parts?: Json
          text_content?: string | null
          ai_call_id?: string | null
        },
        Partial<ChatMessagesRow>
      >
      ai_insights: TableDefinition<
        AiInsightsRow,
        {
          user_id: string
          local_date: string
          headline: string
          action_text?: string | null
          severity?: 'info' | 'warning' | 'refer'
          payload?: Json
          ai_call_id?: string | null
        },
        Partial<AiInsightsRow>
      >
      daily_summaries: TableDefinition<
        DailySummariesRow,
        {
          user_id: string
          local_date: string
          kcal_in?: number
          kcal_out?: number
          protein_g?: number
          carb_g?: number
          fat_g?: number
          target_kcal?: number | null
          adherence_pct?: number | null
          streak_days?: number
        },
        Partial<DailySummariesRow>
      >
      pt_clients: TableDefinition<
        PtClientsRow,
        { pt_id: string; client_id: string; status?: 'pending' | 'active' | 'ended' },
        Partial<PtClientsRow>
      >
      analytics_events: TableDefinition<
        AnalyticsEventsRow,
        { user_id?: string | null; name: string; props?: Json },
        Partial<AnalyticsEventsRow>
      >
    }
    Views: {
      dish_nutrients: {
        Row: {
          dish_id: string
          total_grams: number
          kcal: number
          protein_g: number
          carb_g: number
          fat_g: number
          fiber_g: number
          sodium_mg: number
        }
        Relationships: []
      }
    }
    Functions: {
      search_foods: {
        Args: { query: string; match_limit?: number }
        Returns: SearchFoodsResult[]
      }
      refresh_daily_summary: {
        Args: { p_user_id: string; p_local_date: string }
        Returns: undefined
      }
      claim_ai_quota: {
        Args: { p_user_id: string; p_purpose: AiPurpose; p_limit: number }
        Returns: boolean
      }
      recompute_dish_nutrients: {
        Args: { p_dish_id: string }
        Returns: undefined
      }
      purge_user_data: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: {
      user_role: UserRole
      sex_type: SexType
      activity_level: ActivityLevelDb
      goal_type: GoalType
      medical_flag: MedicalFlagDb
      food_kind: FoodKind
      meal_type: MealType
      log_source: LogSource
      match_method: MatchMethod
      plan_status: PlanStatus
      plan_item_status: PlanItemStatus
      ai_purpose: AiPurpose
      ai_call_status: AiCallStatus
      consent_kind: ConsentKind
      chat_role: ChatRole
    }
    CompositeTypes: Record<string, never>
  }
}

/** Tiện ích lấy kiểu Row của một bảng. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

/** Tiện ích lấy kiểu Insert của một bảng. */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

/** Tiện ích lấy kiểu Update của một bảng. */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
