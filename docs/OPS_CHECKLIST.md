# 運用チェックリスト（オーナー作業）

Cloud Agent の GitHub トークンは **Secrets / Environments の変更権限がありません**。
以下はリポジトリオーナー（Settings を触れるアカウント）が実施してください。

## 1. GitHub Pages デプロイ

現状の Pages 設定は **legacy / `gh-pages` ブランチ配信** です。
`deploy-pages.yml` は `gh-pages` へ force-push する方式に合わせ済みです。

確認:

1. Actions の **Deploy GitHub Pages** が `main` push で成功すること
2. https://eternitybios-dot.github.io/baby/home/ が更新されること

（参考）以前の `actions/deploy-pages` 失敗理由:
`github-pages` 環境の Deployment branches が `gh-pages` のみ許可で、`main` からの deploy が拒否されていた。

## 2. VAPID 鍵ローテーション（本番投入前に必須）

過去コミットに秘密鍵が残っています。**新ペアへ切り替え完了まで通知を信頼しないでください。**

```bash
npx web-push generate-vapid-keys
```

同じペアをすべてに設定（古い公開鍵と新しい秘密鍵を混ぜない）:

| Secret | 場所 |
|--------|------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | GitHub Secrets（Pages ビルド） |
| `VAPID_PUBLIC_KEY` | GitHub Secrets + Supabase Edge Secrets |
| `VAPID_PRIVATE_KEY` | GitHub Secrets + Supabase Edge Secrets |
| `VAPID_SUBJECT` | 例: `mailto:you@example.com`（両方） |

その後:

1. Actions **Deploy notify-family** を実行（Edge Function 再デプロイ）
2. `main` を Pages デプロイ（新しい公開鍵を埋め込む）
3. 両端末でアプリを開き直す（だめなら通知オフ→オン）

詳細: [PUSH_SETUP.md](./PUSH_SETUP.md)

## 3. 004 マイグレーション適用確認

SQL Editor で次を実行:

→ [005_verify_security_hardening.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/005_verify_security_hardening.sql)

未適用なら先に:

→ [004_security_hardening.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/004_security_hardening.sql)
