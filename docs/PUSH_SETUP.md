# iPhone 通知セットアップ（かんたん版）

## いちばん簡単（おすすめ）

アプリの **設定** を開くと「通知サーバーセットアップ」があります。

1. https://supabase.com/dashboard/account/tokens で **Generate new token**
2. できた `sbp_...` をアプリに貼る
3. Project Ref を入れる（URL の `https://ここ.supabase.co`）
4. **自動で作成する** を押す

これで Edge Function と VAPID Secrets まで作れます。

その後、両方の iPhone で **通知をオン** し直してください。

## SQL がまだなら

[003_push_subscriptions.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/cursor/sukusuku-log-foundation-814d/supabase/migrations/003_push_subscriptions.sql)
を SQL Editor で実行。

## 開発者向け（CLI）

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx \
SUPABASE_PROJECT_REF=your_ref \
node scripts/deploy-notify-family.mjs
```
