# すくすくログ

夫婦で使える、モバイル向け赤ちゃん育児記録 Web アプリです。

## できること

- 授乳（母乳 / ミルク）、睡眠、おむつ、体温、困り事のクイック記録
- ホームの状況・今日のサマリー・タイムライン
- 記録の詳細表示・削除（確認あり）
- 成長 / 困り事 / 習慣の追加・更新・削除
- グラフ（睡眠・授乳・ミルク・おむつ・体重）を実データから集計
- **サーバー保存**（Supabase）で夫婦の端末間共有・ほぼリアルタイム同期
- 招待コードで家族参加（メール登録なし）

## 夫婦で共有するには（重要）

データは端末内ではなく **Supabase サーバー** に保存します。

詳しい手順: [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

ざっくり:

1. Supabase プロジェクト作成
2. Anonymous 認証を ON
3. `supabase/migrations/001_init.sql` を SQL Editor で実行
4. アプリで Project URL と anon key を入力
5. 片方で家族作成 → 招待コードをもう片方で参加

公開 URL:

https://eternitybios-dot.github.io/baby/home/

## GitHub Pages

`gh-pages` ブランチ、または Actions（`.github/workflows/deploy-pages.yml`）でデプロイできます。

任意で Secrets（公開値のみ）:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

通知・セキュリティ: [docs/PUSH_SETUP.md](docs/PUSH_SETUP.md) / [docs/MANUAL_VERIFICATION.md](docs/MANUAL_VERIFICATION.md)

## ローカル

```bash
npm install
cp .env.example .env.local   # URL / anon key / VAPID 公開鍵を記入
npm run dev
```

```bash
npm run lint
npm run typecheck
npm test
npm run build          # 通常
npm run build:pages    # GitHub Pages 用（basePath=/baby）
```

## 主な画面

| パス | 内容 |
|------|------|
| `/home` | ホーム・タイムライン（記録は中央ボタン） |
| `/calendar` | カレンダー |
| `/charts` | グラフ |
| `/settings` | 招待コード・表示名・赤ちゃん情報 |
| `/growth` `/concerns` `/habits` `/records` | 各詳細 |

## データ方針

- UI は `useAppData()` 経由
- 永続化は Supabase（匿名認証 + RLS）
- Realtime で家族内の変更を同期
- プロフィール画像・メールログイン UI は対象外
