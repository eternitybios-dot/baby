# すくすくログ — 実装方針・設計書

## 1. 実装方針

- **モバイルファースト（375px基準）**の夫婦向け育児記録 Web アプリ。片手操作・3タップ以内のクイック記録を最優先。
- **Next.js App Router + Supabase（Auth / Postgres / Storage / Realtime / RLS）**で本番利用可能な CRUD・共有を実現する。
- UI は見た目だけのモックにせず、**Supabase 実データ**へ接続できる構造で段階実装する。
- データ分離はフロントの非表示ではなく **RLS で強制**。サービスロールキーはサーバー専用。
- タイムゾーンは **Asia/Tokyo** を前提。日付・集計は date-fns-tz 相当の扱い（date-fns + 明示的 TZ）で統一。
- TypeScript `strict`、Zod + React Hook Form、サーバー側でも同一スキーマで検証。

### 初期仮定（停止せず進めるための合理的デフォルト）

| 項目 | 仮定 |
|------|------|
| 1家族あたりの赤ちゃん | 当面1人（DBは複数可） |
| 家族メンバー | オーナー1 + メンバー（パートナー等） |
| 招待 | 6桁英数字コード、有効期限7日、使用回数1回 |
| ソフトデリート | `deleted_at` を全主要テーブルで使用 |
| 認証 | Email + Password（Magic Link は後続） |
| ロケール | 日本語 UI / JST |
| デプロイ | Vercel + Supabase クラウド |

---

## 2. MVP の範囲

**MVP（フェーズ1〜4相当）で必須**

- 認証（登録 / ログイン / ログアウト / パスワード再設定 / セッション保持）
- 家族作成・招待コード参加・メンバー表示
- 赤ちゃんプロフィール登録・編集
- ホーム（月齢、最終授乳/おむつ経過、睡眠状態、今日の集計、未解決困り事）
- クイック記録: 授乳（母乳左右/ミルク量）、睡眠開始・終了、おむつ（尿/便/両方）
- 今日のタイムライン、記録の編集・削除（確認ダイアログ）
- Realtime でパートナー操作をほぼ即時反映
- RLS による家族単位の厳密分離

**MVP 直後（フェーズ5）**

- 成長記録 + 推移グラフ
- 困り事 / 習慣
- 各種グラフ（7日/30日/任意）
- Vitest / RTL / Playwright の主要テスト
- README（環境変数・Supabase・マイグレーション・テスト）

**後続（MVP外）**

- プッシュ通知、複数赤ちゃん切替 UI 強化、エクスポート、オフライン対応

---

## 3. 推奨フォルダ構成

```
/
├── app/                          # App Router
│   ├── (auth)/                   # ログイン・登録・パスワード再設定
│   ├── (app)/                    # 認証後シェル（下部ナビ）
│   │   ├── home/
│   │   ├── records/
│   │   ├── growth/
│   │   ├── concerns/
│   │   ├── habits/
│   │   ├── charts/
│   │   ├── family/
│   │   ├── baby/
│   │   └── settings/
│   ├── api/                      # Route Handlers（必要時）
│   ├── auth/callback/            # Supabase Auth コールバック
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── layout/                   # BottomNav, AppShell, Header
│   ├── home/
│   ├── records/
│   ├── charts/
│   ├── forms/
│   └── shared/                   # EmptyState, Loading, ConfirmDialog
├── features/                     # ドメイン単位のロジック
│   ├── auth/
│   ├── family/
│   ├── baby/
│   ├── care-records/
│   ├── growth/
│   ├── concerns/
│   ├── habits/
│   └── charts/
├── lib/
│   ├── supabase/                 # client, server, middleware, admin
│   ├── utils.ts
│   ├── date.ts                   # JST ヘルパー
│   └── constants.ts
├── types/
├── schemas/                      # Zod スキーマ
├── hooks/
├── supabase/
│   └── migrations/               # SQL マイグレーション
├── tests/                        # unit / e2e
├── docs/
└── public/
```

---

## 4. 画面一覧

| 画面 | パス | 概要 |
|------|------|------|
| スプラッシュ/ランディング | `/` | 未ログイン誘導、ログイン済はホームへ |
| ログイン | `/login` | Email/Password |
| 新規登録 | `/signup` | |
| パスワード再設定 | `/forgot-password`, `/reset-password` | |
| オンボーディング | `/onboarding` | 家族作成 or 招待参加 → 赤ちゃん登録 |
| ホーム | `/home` | サマリー・クイック入力・タイムライン |
| クイック記録シート | `/home` 上の BottomSheet | 3タップ保存 |
| 記録詳細/編集 | `/records/[id]` | |
| 記録一覧 | `/records` | 日付フィルタ |
| 成長 | `/growth` | 一覧・登録・グラフ |
| 困り事 | `/concerns`, `/concerns/[id]` | |
| 習慣 | `/habits`, `/habits/[id]` | |
| グラフ | `/charts` | 期間切替 |
| 家族 | `/family` | 招待・メンバー・権限 |
| 赤ちゃん設定 | `/baby` | プロフィール編集 |
| 設定 | `/settings` | ログアウト等 |

下部ナビ: **ホーム / 記録 / （中央FAB） / グラフ / もっと**

---

## 5. データベース設計案

### テーブル

**profiles** — `auth.users` と 1:1  
`id (uuid PK = auth.uid)`, `display_name`, `avatar_url`, `created_at`, `updated_at`

**families**  
`id`, `name`, `owner_id`, `invite_code`, `invite_code_expires_at`, `created_at`, `updated_at`

**family_members**  
`id`, `family_id`, `user_id`, `role ('owner'|'member')`, `joined_at`, `left_at`  
UNIQUE(`family_id`,`user_id`) where active

**babies**  
`id`, `family_id`, `name`, `nickname`, `birth_date`, `sex`, `avatar_path`, `birth_weight_g`, `birth_height_cm`, `memo`, `created_at`, `updated_at`, `deleted_at`

**care_records**（共通）  
`id`, `family_id`, `baby_id`, `user_id`, `record_type`, `recorded_at`, `started_at`, `ended_at`, `note`, `metadata_json`, `created_at`, `updated_at`, `deleted_at`

**種類別（検索・集計用に分離）**

- `feeding_details`: `care_record_id`, `feeding_type (breast_left|breast_right|breast_both|formula|pumped|solid)`, `amount_ml`, `duration_minutes`, `side`
- `sleep_details`: `care_record_id`, `quality`, `is_night`
- `diaper_details`: `care_record_id`, `diaper_type (urine|stool|both)`, `stool_color`, `stool_consistency`
- `temperature_details`, `medicine_details`, `symptom_details`, `bath_details` 等は同パターン

**growth_records**  
`id`, `family_id`, `baby_id`, `user_id`, `measured_at`, `weight_g`, `height_cm`, `head_circumference_cm`, `note`, `photo_path`, `created_at`, `updated_at`, `deleted_at`

**concerns**  
`id`, `family_id`, `baby_id`, `user_id`, `title`, `category`, `body`, `severity (1-5)`, `action_taken`, `result`, `status (open|in_progress|watching|resolved)`, `occurred_at`, `created_at`, `updated_at`, `deleted_at`

**habits**  
`id`, `family_id`, `baby_id`, `user_id`, `name`, `category`, `body`, `likely_time_of_day`, `frequency`, `effective_response`, `last_confirmed_at`, `status (active|inactive)`, `created_at`, `updated_at`, `deleted_at`

**attachments**  
`id`, `family_id`, `entity_type`, `entity_id`, `storage_path`, `mime_type`, `created_by`, `created_at`, `deleted_at`

### インデックス（例）

- `care_records (family_id, baby_id, recorded_at DESC) WHERE deleted_at IS NULL`
- `care_records (family_id, baby_id, record_type, recorded_at)`
- `family_members (user_id) WHERE left_at IS NULL`
- `families (invite_code)`

---

## 6. RLS 設計方針

ヘルパー関数:

```sql
is_family_member(family_id uuid) → boolean  -- left_at IS NULL
is_family_owner(family_id uuid) → boolean
```

方針:

- 全テーブルで RLS ENABLE
- SELECT/INSERT/UPDATE: `is_family_member(family_id)`
- soft delete 含む UPDATE もメンバー可（オーナー制限が必要な設定系のみ owner）
- `families` の UPDATE・メンバー削除・招待再発行: **owner のみ**
- `family_members` INSERT: 招待コード検証 RPC 経由、または owner 招待フロー
- 退出後 (`left_at` 設定) は `is_family_member` が false → アクセス不可
- Storage バケット `baby-media`: パス `family_id/...`、ポリシーで同一 family のみ

フロントに service role は置かない。必要なら Server Actions / Route Handler のみ。

---

## 7. 主要コンポーネント一覧

| コンポーネント | 役割 |
|----------------|------|
| `AppShell` | 認証後レイアウト・下部ナビ |
| `BottomNav` | 4タブ + 中央 FAB |
| `QuickRecordFab` | 記録メニュー起動 |
| `QuickRecordSheet` | 授乳/睡眠/おむつクイック UI |
| `HomeSummaryCards` | 経過時間・今日の集計 |
| `TimelineList` / `TimelineItem` | 今日の記録 |
| `RecordForm` | 詳細編集 |
| `ConfirmDialog` | 削除確認 |
| `EmptyState` / `LoadingState` / `ErrorState` | 状態表示 |
| `BabyHeader` | 名前・月齢 |
| `GrowthChart` / `CareCharts` | Recharts |
| `FamilyInviteCard` | 招待コード |
| `AuthForm` | ログイン/登録 |

---

## 8. 状態管理方針

- **サーバー状態**: Supabase + React Query 相当は使わず、まずは **Server Components で取得** + Client で mutation。Realtime 購読は Client Hook。
- 追加依存として **`@tanstack/react-query`** を採用候補（キャッシュ・楽観更新・ロールバックが容易）。採用する場合は README に理由記載。
- **ローカル UI 状態**: `useState` / URL searchParams（シート開閉・期間）。
- **グローバル**: `FamilyProvider` / `BabyProvider`（選択中 family/baby）。過剰な Redux は使わない。
- 楽観更新時は失敗でロールバック + トースト。

---

## 9. リアルタイム同期方針

- `care_records`, `growth_records`, `concerns`, `habits` を `postgres_changes` で購読（`family_id` フィルタ）。
- ホーム・タイムラインは insert/update/delete でリスト再検証またはパッチ。
- 競合は **last-write-wins**（`updated_at`）。睡眠の開始/終了など同一レコード更新は Realtime で双方に反映。
- タブ非表示時は購読維持（モバイル短時間想定）。長時間は reconnect。

---

## 10. テスト方針

| 層 | ツール | 対象 |
|----|--------|------|
| Unit | Vitest | date ヘルパー、集計、Zod、月齢計算 |
| Component | RTL | QuickRecord、TimelineItem、フォーム検証 |
| E2E | Playwright | 登録→家族→赤ちゃん→クイック記録（可能な範囲） |
| SQL | 手動/ドキュメント | RLS ポリシー検証手順を README に記載 |

CI 想定: `lint` → `typecheck` → `vitest` → `playwright`（要 env）。

---

## 11. 想定される技術的リスク

| リスク | 対策 |
|--------|------|
| RLS の穴（抜け道クエリ） | ヘルパー関数集約、ポリシーテスト手順、退出後の検証 |
| Realtime と楽観更新の二重反映 | 一時 ID / サーバー ID 照合、dedupe |
| JST と UTC のずれ（集計境界） | DB は timestamptz、集計は JST 日境界で変換 |
| 睡眠の未終了レコード | 「睡眠中」は `ended_at IS NULL`、二重開始防止 |
| Storage 公開 URL 漏洩 | private bucket + signed URL または RLS |
| Supabase 未設定環境 | デモモードではなく、設定ガイド + 型安全なクライアント境界 |
| モバイル 100vh / キーボード | `dvh`、シート UI 調整 |

---

## 12. 実装フェーズ一覧

| フェーズ | 内容 | 完了条件 |
|----------|------|----------|
| **1** | Next.js / Tailwind / shadcn / デザインシステム / レイアウト骨格 | ビルド・型チェック通過、375px シェル表示 |
| **2** | Supabase クライアント、マイグレーション SQL、RLS、Storage ポリシー | SQL 適用可能、型生成または手動 types |
| **3** | 認証、家族、赤ちゃん CRUD | 実 DB で登録〜共有まで可能 |
| **4** | ホーム、クイック入力、タイムライン、編集削除、Realtime | 3タップ記録・共有動作 |
| **5** | 成長・困り事・習慣・グラフ・テスト・README | MVP 完成、デプロイ手順明記 |

---

## 追加依存ライブラリ（予定）と理由

| ライブラリ | 理由 |
|------------|------|
| `@supabase/ssr` | App Router での Cookie セッション |
| `@supabase/supabase-js` | 公式クライアント |
| `sonner` | トースト（shadcn 推奨パターン） |
| `date-fns-tz` | JST 明示変換（date-fns 単体では TZ 不足） |
| `@tanstack/react-query` | クライアントキャッシュ・楽観更新（フェーズ4で導入検討） |
| `vaul` | モバイル向け Drawer（クイック記録シート） |
| `clsx` / `tailwind-merge` / `class-variance-authority` | shadcn 標準 |
| `next-themes` | 不要（ライト固定）。導入しない |

---

## デザインシステム（色）

```css
--background: #F7F3EE;      /* アイボリー */
--foreground: #4A4038;
--primary: #D4A5A5;         /* くすみピンク */
--secondary: #B8D4C8;       /* 淡いミント */
--accent: #F0D9A5;          /* 柔らかいイエロー */
--card: #FFFCFA;
--muted: #EDE6DF;
--destructive: #C97B84;
```
