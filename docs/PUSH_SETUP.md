# iPhone 通知セットアップ

## 状態は2つあります

| 状態 | 意味 |
|------|------|
| 端末の通知許可 | iOS がこのアプリに通知表示を許可した |
| 相手への Push 設定済み | Push 購読が Supabase に保存され、相手の入力を受け取れる |

設定画面で **「通知オン」** と出るのは、**両方できているときだけ**です。
「端末通知は許可されましたが、相手からの通知設定は未完了です」と出た場合は、SQL / VAPID / ホーム画面起動を確認してください。

## 夫婦どちらもやること

1. ホーム画面の「すくすくログ」を削除
2. Safari で https://eternitybios-dot.github.io/baby/home/ を開く
3. 共有 → **ホーム画面に追加**
4. **そのアイコンから**開く（Safariのタブではない）
5. 設定 → **通知をオン** → 許可
   - 「通知がオンになりました」のテスト通知が来るか確認
6. もう一方の端末でも同じ

## あなた（セットアップ担当）だけ

### SQL（main ブランチ）

1. [003_push_subscriptions.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/003_push_subscriptions.sql)
2. [004_security_hardening.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/004_security_hardening.sql)

### 鍵の置き場所（混同しないこと）

| 値 | 置き場所 | 備考 |
|----|----------|------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | **GitHub Secrets**（Pages / CI ビルド用） | 公開鍵のみ。フロントに埋め込まれる |
| `VAPID_PUBLIC_KEY` | **Supabase Secrets**（Edge Function）と **GitHub Secrets**（deploy-notify-family 用） | 公開鍵 |
| `VAPID_PRIVATE_KEY` | **Supabase Secrets** と **GitHub Secrets**（deploy 用のみ） | **秘密鍵。ブラウザ・NEXT_PUBLIC_ 禁止** |
| `VAPID_SUBJECT` | 同上 | 例: `mailto:you@example.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase / サーバーのみ | **ブラウザに絶対入力しない** |
| `SUPABASE_ACCESS_TOKEN` | GitHub Secrets（Management API 用） | 個人用トークン。ログに出さない |

### VAPID 鍵の生成（ローカルで）

```bash
npx web-push generate-vapid-keys
```

出力された **Public Key** と **Private Key** を、上表の場所へ登録してください。
**リポジトリや Issue に貼らないでください。**

### ローテーション（必ず Edge とクライアントを同時に）

過去のコミットに VAPID 秘密鍵が含まれています（ブランチ上の削除だけでは不十分）。
手順の要約とオーナー作業一覧は [OPS_CHECKLIST.md](./OPS_CHECKLIST.md) を参照。

1. 新しい VAPID 鍵ペアを生成する（`npx web-push generate-vapid-keys`）
2. **先に** Supabase Secrets の `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` を新ペアに更新
3. Edge Function を再デプロイ（Actions `Deploy notify-family` または `npm run deploy:notify-family`）
4. GitHub Secrets の `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` を同じペアに更新
5. `main` を Pages デプロイ（新しい公開鍵を埋め込む）
6. 両方の端末でアプリを開き直す（起動時に購読を再保存）。だめなら通知をオフ→オン
7. （推奨）Git 履歴からの秘密情報削除は、GitHub の公式手順に従い別途実施

**クライアントだけ公開鍵を先に変えないでください。**  
Edge 秘密鍵が古いと「相手への通知が送れませんでした」になります。

### 004 適用確認

→ [005_verify_security_hardening.sql](../supabase/migrations/005_verify_security_hardening.sql)

## 確認ポイント

| 症状 | 見方 |
|------|------|
| テスト通知も来ない | ホーム画面から開いていない / 通知許可オフ / 入れ直し不足 |
| 「相手からの通知設定は未完了」 | SQL 003/004 未実行 / 公開鍵未設定 / Push 購読保存失敗 |
| テストは来るが相手の入力が来ない | 相手が通知オフ / Edge Function 未デプロイ / VAPID 不一致 |
| Safari タブでは来るがアイコンだと… | 必ずホーム画面アイコンから開く |
