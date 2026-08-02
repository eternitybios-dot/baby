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

**公開鍵と秘密鍵は必ず同じペア。** 混ぜると送信がすべて失敗します。

### 現在の本番ペア（Edge に設定済み・クライアントもこれに合わせる）

- **Public**  
  `BOGThgT-ThjwFpMvvfWN9_pfqLKfZo-f5w9A55bPRYTCaQVnJO9pDwMog1yz_9jYhUPIbeH-USlpYmlMEOnH8zk`
- **Private**  
  `KZAhV4989qRnmm87TVvnlFaD2mAtk_bX-1F-cn2aL3s`
- **Subject**  
  `mailto:eternitybios@gmail.com`

※ 2026-08-02 に別ペアへ回転しようとしましたが、Edge Secrets 更新ができず
クライアントだけ新公開鍵になり **鍵不一致で送信失敗** していました。  
アプリ側は上記の Edge 一致ペアに戻しています。

※ Private は Issue / PR コメントに再投稿しないでください。漏れたら `npx web-push generate-vapid-keys` で作り直す。

### A. GitHub Secrets

リポジトリ → **Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 上記 Public（または空のまま＝アプリ埋め込みを使う） |
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

Project Ref: `rgukivjlxvsddzbkkpyj`

### C. Edge Function 再デプロイ

GitHub Actions → **Deploy notify-family** → Run workflow  
`project_ref` = `rgukivjlxvsddzbkkpyj`

またはローカル:

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx \
SUPABASE_PROJECT_REF=rgukivjlxvsddzbkkpyj \
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
- 「相手への通知を送れませんでした（0/1）」→ 鍵不一致か相手の購読無効。両端末で開き直し＋通知オフ→オン
