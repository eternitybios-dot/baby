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
**秘密鍵は Git / Issue / チャットに書かない。** Dashboard の Secrets だけに置く。

公開鍵（アプリ埋め込みと揃える）:

`BOGThgT-ThjwFpMvvfWN9_pfqLKfZo-f5w9A55bPRYTCaQVnJO9pDwMog1yz_9jYhUPIbeH-USlpYmlMEOnH8zk`

Subject: `mailto:eternitybios@gmail.com`

漏れたら `npx web-push generate-vapid-keys` で作り直し、Edge と GitHub Secrets を**同じペア**に更新する。

### A. GitHub Secrets

リポジトリ → **Settings → Secrets and variables → Actions**

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 上記 Public（または空のまま＝アプリ埋め込み） |
| `VAPID_PUBLIC_KEY` | 上記 Public |
| `VAPID_PRIVATE_KEY` | Dashboard の Private（リポジトリに書かない） |
| `VAPID_SUBJECT` | `mailto:eternitybios@gmail.com` |

### B. Supabase Edge Secrets

Dashboard → Project → **Edge Functions → Secrets**

| Name | Value |
|------|-------|
| `VAPID_PUBLIC_KEY` | 上記 Public |
| `VAPID_PRIVATE_KEY` | Private |
| `VAPID_SUBJECT` | `mailto:eternitybios@gmail.com` |

Project Ref: `rgukivjlxvsddzbkkpyj`

### C. Edge Function 再デプロイ

GitHub Actions → **Deploy notify-family** → Run workflow  
`project_ref` = `rgukivjlxvsddzbkkpyj`

### D. 両端末

1. 夫婦どちらもホーム画面アイコンからアプリを開き直す
2. 設定 → いったん通知オフ → **通知をオン**
3. 片方で記録 → もう片方に Push が届く

## 3. SQL（未実行なら）

貼り付け先: https://supabase.com/dashboard/project/rgukivjlxvsddzbkkpyj/sql/new

1. [004_security_hardening.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/004_security_hardening.sql)
2. 確認: [005_verify_security_hardening.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/005_verify_security_hardening.sql)
3. 家族名を全員が消せる: [006_families_update_members.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/006_families_update_members.sql)
4. 招待コード強化・退出: [007_invite_and_leave.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/main/supabase/migrations/007_invite_and_leave.sql)

## 4. よくあるつまずき

- Safari のタブから開いている → 必ずホーム画面アイコンから
- 公開鍵だけ新しくして秘密鍵が古い → 必ず同じペア
- 003 未実行 → 購読保存に失敗する
- 片方だけ通知オン → オンにした側にしか届かない
- 007 未実行 → 招待コード再発行・家族退出が失敗する
