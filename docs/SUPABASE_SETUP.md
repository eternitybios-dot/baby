# Supabase セットアップ（夫婦で共有するため必須）

すくすくログは **Supabase** にデータを保存し、Realtime でほぼ同時に同期します。
メール登録は不要です（匿名認証 + 招待コード）。

## 1. プロジェクト作成

1. https://supabase.com でプロジェクトを作成
2. **Project Settings → API** で次を控える
   - Project URL（例: `https://xxxx.supabase.co`）
   - `anon` `public` key

**`service_role` key はブラウザ・アプリ画面・GitHub Pages に絶対に入れないでください。**

## 2. 匿名認証を ON

**Authentication → Providers → Anonymous** を **Enable**

## 3. SQL を実行（ここが一番わかりにくい）

やることは **「SQLの文章をコピーして、Supabaseに貼って実行」** だけです。

### 手順（PC推奨）

1. まず SQL 全文を開く（下のリンク）
   → [001_init.sql（生テキスト）](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/001_init.sql)
2. 画面の文字を **全部選択**（`Ctrl+A` / Macは `Cmd+A`）して **コピー**
3. [Supabase Dashboard](https://supabase.com/dashboard) を開き、自分のプロジェクトに入る
4. 左メニューの **SQL Editor** をタップ／クリック
5. **New query**（新しいクエリ）を押す
6. 白い入力欄に **貼り付け**（`Ctrl+V` / `Cmd+V`）
7. 右下（または右上）の **Run**（実行）を押す

成功すると下に `Success` と出ます。これでテーブル作成は完了です。

スマホの場合も同じですが、文字が多くてコピーしづらいので **PCの方が楽** です。

すでに 001 を実行済みで、削除時に RLS エラーが出る場合は追加でこちらも実行してください。

→ [002_fix_delete_rls.sql（生テキスト）](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/002_fix_delete_rls.sql)

iPhone の通知（ホーム画面アプリ）を使う場合は追加で:

→ [003_push_subscriptions.sql（生テキスト）](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/003_push_subscriptions.sql)

セキュリティ強化（Push SELECT 制限・所属キー改変防止）:

→ [004_security_hardening.sql（生テキスト）](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/004_security_hardening.sql)

適用できているかは確認用 SQL で検査できます:

→ [005_verify_security_hardening.sql（生テキスト）](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/005_verify_security_hardening.sql)

家族名を作成者以外も変更・消去できるようにする場合:

→ [006_families_update_members.sql（生テキスト）](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/006_families_update_members.sql)

詳しい通知手順: [docs/PUSH_SETUP.md](./PUSH_SETUP.md) / 運用一覧: [docs/OPS_CHECKLIST.md](./OPS_CHECKLIST.md)

## 4. アプリ側の接続

どちらか一方で OK です。

### A. アプリ画面で入力（おすすめ・再ビルド不要）

1. 公開サイトを開く
2. 「サーバー設定」で URL と **anon key** を入力して接続
3. 片方の端末で「家族を作る」→ 招待コードをコピー
4. もう一方の端末で同じ URL/key を入れたあと「コードで参加」

※ URL/anon key は各端末のブラウザに保存されます
※ **Service Role Key は絶対に入力しない**

### B. ビルド時に埋め込む（GitHub Actions）

リポジトリ Secrets（**公開してよい値のみ**）:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`（通知を使う場合）

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
- 接続失敗 → URL / anon key の打ち間違いが多い
- 通知が「未完了」 → [PUSH_SETUP.md](./PUSH_SETUP.md) を参照
