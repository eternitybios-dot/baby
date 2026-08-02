# 運用チェックリスト（オーナー作業）

Cloud Agent の GitHub トークンは **Secrets 変更権限がありません**。
通知が動かないときは、下の **2. VAPID** を必ず完了してください。

## 症状と原因

| 画面のメッセージ | 意味 |
|------------------|------|
| 通知用の公開鍵が設定されていません | Pages ビルドに公開鍵が入っていない（または古いキャッシュ） |
| 相手からの通知設定は未完了 | Push 購読をサーバーに保存できていない |
| 相手への通知が送れませんでした | Edge Function の秘密鍵未設定 / 鍵不一致 / 相手が購読未完了 |

## 1. GitHub Pages デプロイ

`main` push で Actions **Deploy GitHub Pages** が成功し、  
https://eternitybios-dot.github.io/baby/home/ が更新されること。

## 2. VAPID 鍵（通知を動かすために必須）

公開鍵はアプリ側にフォールバック埋め込み済みです。  
**秘密鍵は Supabase（と GitHub）にだけ**置いてください。混ぜないこと。

### 今回の鍵ペア（2026-08-02 生成）

- **Public**  
  `BGKEzBYqf0jTJPjqLSwhbldauPEKJo84WflF6c4bxtPpyCaTZbFRUjRZR6NF6MKMvQWxk8dmL87Pa9J8KtpK9zA`
- **Private**  
  `MrjT_n_3-Aq7o83qoeDGmOEihlBzei-KRaBLubOrkmQ`
- **Subject**  
  `mailto:eternitybios@gmail.com`

※ Private は Issue / PR コメントに再投稿しないでください。漏れたら `npx web-push generate-vapid-keys` で作り直す。

### A. GitHub Secrets

リポジトリ → **Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 上記 Public |
| `VAPID_PUBLIC_KEY` | 上記 Public |
| `VAPID_PRIVATE_KEY` | 上記 Private |
| `VAPID_SUBJECT` | `mailto:eternitybios@gmail.com` |

（Pages 用に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` も入れておくと初回設定が楽）

### B. Supabase Edge Secrets

Dashboard → Project → **Edge Functions → Secrets**（または Project Settings → Edge Functions）

| Name | Value |
|------|-------|
| `VAPID_PUBLIC_KEY` | 上記 Public |
| `VAPID_PRIVATE_KEY` | 上記 Private |
| `VAPID_SUBJECT` | `mailto:eternitybios@gmail.com` |

### C. Edge Function 再デプロイ

GitHub Actions → **Deploy notify-family** → Run workflow  
（`project_ref` は `https://＜これ＞.supabase.co` の真ん中）

またはローカル:

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx \
SUPABASE_PROJECT_REF=xxxx \
VAPID_PUBLIC_KEY='（Public）' \
VAPID_PRIVATE_KEY='（Private）' \
VAPID_SUBJECT='mailto:eternitybios@gmail.com' \
npm run deploy:notify-family
```

### D. Pages 再デプロイ＆両端末

1. `main` をデプロイ（この PR マージで自動）
2. **夫婦どちらも**ホーム画面アイコンからアプリを開き直す
3. 設定 → いったん通知オフ → **通知をオン**（テスト通知が来る）
4. 片方で記録 → もう片方に Push が届く

## 3. SQL（未実行なら）

1. [003_push_subscriptions.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/003_push_subscriptions.sql)
2. [004_security_hardening.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/004_security_hardening.sql)
3. 確認: [005_verify_security_hardening.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/005_verify_security_hardening.sql)

## 4. よくあるつまずき

- Safari のタブから開いている → 必ずホーム画面アイコンから
- 公開鍵だけ新しくして秘密鍵が古い → 必ず同じペア
- 003 未実行 → 購読保存に失敗する
- 片方だけ通知オン → オンにした側にしか届かない
