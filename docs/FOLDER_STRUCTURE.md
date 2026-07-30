# すくすくログ — フォルダ構成ガイド

実装方針の詳細は `docs/IMPLEMENTATION_PLAN.md` を参照。

```
/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 未認証: login / signup / password
│   ├── (app)/                    # 認証後シェル（下部ナビ想定）
│   │   ├── home/ records/ growth/ concerns/ habits/
│   │   ├── charts/ family/ baby/ settings/ onboarding/
│   ├── auth/callback/            # Supabase Auth コールバック
│   ├── api/                      # Route Handlers（必要時）
│   ├── layout.tsx                # ルートレイアウト + フォント
│   ├── page.tsx                  # 初期プレースホルダー
│   └── globals.css               # デザインシステム
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── layout/ home/ records/ charts/ forms/ shared/
├── features/                     # ドメインロジック（auth, family, baby, ...）
├── lib/                          # utils, date, constants, supabase/
├── types/ schemas/ hooks/
├── supabase/migrations/          # SQL（次フェーズ）
├── tests/unit/ tests/e2e/
└── docs/
```

## 依存追加理由（初期構築時点）

| パッケージ | 理由 |
|------------|------|
| `@supabase/supabase-js` / `@supabase/ssr` | Auth・DB・Realtime・Storage、App Router Cookie セッション |
| `zod` / `react-hook-form` / `@hookform/resolvers` | フォーム検証（クライアント・サーバー共通スキーマ） |
| `date-fns` / `date-fns-tz` | 日付操作と Asia/Tokyo 変換 |
| `lucide-react` | アイコン（色だけに頼らない UI） |
| `recharts` | 成長・育児グラフ |
| `sonner` | 操作結果トースト |
| `vaul` | モバイル向けクイック記録 Drawer |
| `class-variance-authority` / `clsx` / `tailwind-merge` | shadcn 標準ユーティリティ |
| `shadcn` / `@base-ui/react` / `tw-animate-css` | shadcn/ui v4 初期化に伴う依存 |
