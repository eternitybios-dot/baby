# すくすくログ

夫婦で使える、モバイル向け赤ちゃん育児記録 Web アプリです。

## できること（完成版・認証なし）

- 授乳（母乳 / ミルク）、睡眠、おむつ、体温、困り事のクイック記録
- ホームの状況・今日のサマリー・タイムライン
- 記録の詳細表示・削除（確認あり）
- 成長 / 困り事 / 習慣の追加・更新・削除
- グラフ（睡眠・授乳・ミルク・おむつ・体重）を実データから集計
- 記録者の切替（ママ / パパ）
- 赤ちゃん情報の編集

データはこの端末の **localStorage** に保存されます（ログイン不要）。

## 動かしかた

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます（`/home` へ移動します）。

## 主な画面

| パス | 内容 |
|------|------|
| `/home` | ホーム・クイック入力・タイムライン |
| `/calendar` | カレンダー |
| `/charts` | グラフ |
| `/settings` | 記録者切替・赤ちゃん情報・各機能への導線 |
| `/growth` `/concerns` `/habits` `/records` | 各詳細 |

中央の **記録** ボタン、またはホームのクイック入力から保存できます。

## データ方針

- UI は `useAppData()`（`components/providers/AppDataProvider.tsx`）経由
- 永続化は `lib/data/app-state.ts` の localStorage
- 認証・プロフィール画像・Supabase 連携は **対象外**（今回の完成版）

## スクリプト

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

## 補足

- 端末を変えるとデータは共有されません（端末内保存のため）
- 設定の「初期データに戻す」でサンプルデータへリセットできます
