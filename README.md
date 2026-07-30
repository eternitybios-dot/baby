# すくすくログ

夫婦がそれぞれのスマートフォンから赤ちゃんの育児情報を素早く記録し、ほぼリアルタイムで共有できる Web アプリです。

## 現状

- Next.js（App Router）+ TypeScript strict + Tailwind CSS v4 + shadcn/ui
- モバイルファースト UI（ホーム / カレンダー / グラフ / 設定 / 成長 / 困り事 / 習慣）
- 下部ナビ + 中央記録ボタン + クイック記録ボトムシート
- **モックデータ層**経由で表示（UI とデータ取得を分離済み）
- 認証・Supabase・永続化は **未接続**（次フェーズ）

設計詳細: [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md)  
フォルダ構成: [`docs/FOLDER_STRUCTURE.md`](./docs/FOLDER_STRUCTURE.md)

## 前提

- Node.js 20+
- npm

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと `/home` へリダイレクトされます。

画面幅 375px 想定。PC では中央 max 480px で表示されます。

## 主な画面

| パス | 内容 |
|------|------|
| `/home` | サマリー・クイック入力・タイムライン |
| `/calendar` | 月カレンダー + 今日の記録 |
| `/charts` | 睡眠・授乳・ミルク・おむつ・体重グラフ |
| `/settings` | 家族・赤ちゃん・各機能への導線 |
| `/growth` `/concerns` `/habits` `/records` | 各詳細画面 |

中央の **記録** ボタン、またはホームのクイック入力からボトムシートが開きます。

## データ層（Supabase 差し替え前提）

- 型: `types/domain.ts`
- モック: `lib/data/mock/home.ts`
- 抽象: `lib/data/source.ts`（`CareDataSource`）
- UI 向け API: `lib/data/queries.ts`

画面は `fetch*` 関数だけを呼び、モック／Supabase の実装詳細に依存しません。

## 環境変数

| 変数 | 公開範囲 | 説明 |
|------|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | クライアント可 | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | クライアント可 | anon / public key（RLS 前提） |
| `SUPABASE_SERVICE_ROLE_KEY` | **サーバーのみ** | サービスロール（フロントに置かない） |
| `NEXT_PUBLIC_APP_URL` | クライアント可 | Auth リダイレクト用アプリ URL |

UI 確認時点では未設定でも起動できます。

## スクリプト

```bash
npm run dev       # 開発サーバー
npm run build     # 本番ビルド
npm run start     # 本番サーバー
npm run lint      # ESLint
npm run typecheck # TypeScript 型チェック
```

## 次のステップ

1. Supabase 接続と `CareDataSource` の本番実装
2. DB マイグレーション / RLS
3. 認証・家族・赤ちゃん CRUD
4. クイック記録の実保存・Realtime

## ライセンス

Private
