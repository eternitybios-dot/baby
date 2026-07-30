# すくすくログ

夫婦がそれぞれのスマートフォンから赤ちゃんの育児情報を素早く記録し、ほぼリアルタイムで共有できる Web アプリです。

## 現状（このコミット）

- Next.js（App Router）+ TypeScript strict + Tailwind CSS v4 + shadcn/ui の初期構築
- デザインシステム（くすみピンク / ミント / イエロー / アイボリー）
- 推奨フォルダ構成の骨格
- 主要画面 UI・Supabase 接続・認証は **未実装**（次フェーズ）

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

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと、初期構築確認用のプレースホルダーが表示されます。

## 環境変数

| 変数 | 公開範囲 | 説明 |
|------|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | クライアント可 | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | クライアント可 | anon / public key（RLS 前提） |
| `SUPABASE_SERVICE_ROLE_KEY` | **サーバーのみ** | サービスロール（フロントに置かない） |
| `NEXT_PUBLIC_APP_URL` | クライアント可 | Auth リダイレクト用アプリ URL |

`.env.example` をコピーして値を設定してください。初期構築時点では未設定でも起動できます。

## スクリプト

```bash
npm run dev       # 開発サーバー
npm run build     # 本番ビルド
npm run start     # 本番サーバー
npm run lint      # ESLint
npm run typecheck # TypeScript 型チェック
```

## 次のステップ

1. Supabase プロジェクト作成とクライアント接続
2. データベースマイグレーション / RLS
3. 認証・家族・赤ちゃん登録
4. ホーム / クイック入力などの主要画面 UI

## ライセンス

Private
