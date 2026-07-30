# Supabase セットアップ（夫婦で共有するため必須）

すくすくログは **Supabase** にデータを保存し、Realtime でほぼ同時に同期します。
メール登録は不要です（匿名認証 + 招待コード）。

## 1. プロジェクト作成

1. https://supabase.com でプロジェクトを作成
2. **Project Settings → API** で次を控える
   - Project URL（例: `https://xxxx.supabase.co`）
   - `anon` `public` key

## 2. 匿名認証を ON

**Authentication → Providers → Anonymous** を **Enable**

## 3. SQL を実行

**SQL Editor** でリポジトリの次のファイルを全文実行:

`supabase/migrations/001_init.sql`

成功すると家族・記録テーブルと RLS、Realtime が入ります。

## 4. アプリ側の接続

どちらか一方で OK です。

### A. アプリ画面で入力（おすすめ・再ビルド不要）

1. 公開サイトを開く
2. 「サーバー設定」で URL と anon key を入力して接続
3. 片方の端末で「家族を作る」→ 招待コードをコピー
4. もう一方の端末で同じ URL/key を入れたあと「コードで参加」

※ URL/key は各端末のブラウザに保存されます（service_role key は絶対に入れない）

### B. ビルド時に埋め込む（GitHub Actions）

リポジトリ Secrets に:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

を設定すると、Pages ビルド時に埋め込まれ、初回の設定画面をスキップできます。

## 5. 使い方の流れ

| 端末 | 操作 |
|------|------|
| ママ（例） | サーバー接続 → 家族を作る → 招待コードを共有 |
| パパ（例） | 同じサーバー接続 → 招待コードで参加 |

以降、記録はサーバーに保存され、相手の画面にもほぼリアルタイムで反映されます。

## トラブルシュート

- `Anonymous sign-ins are disabled` → Providers の Anonymous を ON
- `invalid invite code` → 大文字6桁を再確認
- データが見えない → 同じ Project URL / anon key か確認
- Realtime が遅い → Wi-Fi / モバイル回線を確認。画面を開き直せば再取得します
