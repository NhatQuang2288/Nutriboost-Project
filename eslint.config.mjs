import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Thư viện icon bị cấm.
 *
 * Quy tắc sản phẩm: toàn bộ icon phải là SVG tự vẽ trong
 * `apps/web/src/components/icons/`. Đây là cổng kiểm soát ở CI, không phải quy ước miệng.
 */
const FORBIDDEN_ICON_PACKAGES = [
  'lucide-react',
  'react-icons',
  '@heroicons/react',
  '@radix-ui/react-icons',
  'phosphor-react',
  '@tabler/icons-react',
  'react-feather',
  'feather-icons',
]

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.npm-cache/**',
      '**/dist/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      // Trình duyệt Playwright cài trong workspace — không phải mã của dự án.
      '**/.playwright-browsers/**',
      '**/next-env.d.ts',
      '**/*.config.{js,mjs,ts}',
    ],
  },

  js.configs.recommended,
  tseslint.configs.recommended,

  /*
   * Script chạy bằng Node (`scripts/*.mjs`).
   * Không thuộc nhóm `**\/*.{ts,tsx}` nên cần khai báo global riêng, nếu không
   * `process` và `console` sẽ bị báo là chưa định nghĩa.
   */
  {
    files: ['**/*.mjs', '**/*.cjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,

      // Dự án dùng App Router, không có thư mục `pages/`. Tắt quy tắc này để
      // tránh cảnh báo "Pages directory cannot be found" ở mỗi lần chạy lint.
      '@next/next/no-html-link-for-pages': 'off',

      // Cấm dùng thư viện icon, và cấm gọi thẳng SDK AI ngoài packages/ai.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...FORBIDDEN_ICON_PACKAGES.map((name) => ({
              name,
              message:
                'Không dùng thư viện icon. Hãy thêm SVG tự vẽ vào apps/web/src/components/icons/.',
            })),
            {
              name: 'ai',
              message: 'Mọi lời gọi AI phải đi qua @nutriboost/ai (AI Gateway).',
            },
            {
              name: '@ai-sdk/google',
              message: 'Mọi lời gọi AI phải đi qua @nutriboost/ai (AI Gateway).',
            },
          ],
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },

  // packages/ai được phép gọi SDK AI trực tiếp — đây là cửa duy nhất.
  {
    files: ['packages/ai/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: FORBIDDEN_ICON_PACKAGES.map((name) => ({
            name,
            message: 'Không dùng thư viện icon.',
          })),
        },
      ],
    },
  },

  /*
   * Ngoại lệ hẹp cho lớp trợ lý phía trình duyệt.
   *
   * `DefaultChatTransport` là transport của giao diện chat, không phải SDK gọi model —
   * nó chỉ định dạng request và đọc stream về. Việc gọi model vẫn nằm ở server, trong
   * `@nutriboost/ai`.
   *
   * `@ai-sdk/google` VẪN BỊ CẤM ở đây: không có đường nào để trình duyệt chạm tới model.
   */
  {
    files: ['apps/web/src/components/assistant/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...FORBIDDEN_ICON_PACKAGES.map((name) => ({
              name,
              message: 'Không dùng thư viện icon.',
            })),
            {
              name: '@ai-sdk/google',
              message:
                'Không bao giờ gọi model từ trình duyệt. Mọi lời gọi phải đi qua @nutriboost/ai ở server.',
            },
          ],
        },
      ],
    },
  },

  // File cấu hình và script được phép dùng console.
  {
    files: ['**/*.config.{js,mjs,ts}', 'packages/seed/**/*.ts', 'packages/ai/src/eval/**/*.ts'],
    rules: { 'no-console': 'off' },
  },

  prettier,
)
