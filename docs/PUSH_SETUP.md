# iPhone 通知（ホーム画面アプリ）セットアップ

Safari の「ホーム画面に追加」アプリでは、普通の通知 API が使えません。
**Service Worker + Web Push** が必要です。

## A. いますぐ必要なこと（両方の iPhone）

1. ホーム画面のアイコンからアプリを開く（Safari タブではない）
2. **設定 → 入力の通知 → 通知をオンにする**
3. 「許可」をタップ（テスト通知が届けば OK）
4. もう一方の端末でも同じ操作

## B. バックグラウンド通知用（PCで1回）

アプリを閉じているときも届けるために、Supabase 側の設定が必要です。

### 1. SQL を実行

[003_push_subscriptions.sql](https://raw.githubusercontent.com/eternitybios-dot/baby/cursor/sukusuku-log-foundation-814d/supabase/migrations/003_push_subscriptions.sql)

を SQL Editor で実行。

### 2. Edge Function を作成

1. Supabase Dashboard → **Edge Functions**
2. `notify-family` という名前で作成
3. リポジトリの `supabase/functions/notify-family/index.ts` の内容を貼り付けて Deploy

### 3. Secrets を設定

Edge Functions → Secrets に次を追加:

| Name | Value |
|------|--------|
| `VAPID_PUBLIC_KEY` | `BOGThgT-ThjwFpMvvfWN9_pfqLKfZo-f5w9A55bPRYTCaQVnJO9pDwMog1yz_9jYhUPIbeH-USlpYmlMEOnH8zk` |
| `VAPID_PRIVATE_KEY` | `KZAhV4989qRnmm87TVvnlFaD2mAtk_bX-1F-cn2aL3s` |
| `VAPID_SUBJECT` | `mailto:you@example.com`（自分のメールで可） |

### 4. もう一度「通知をオン」

両方の端末で設定から通知をオンにし直す（Push 購読がサーバーに保存されます）。

## うまくいかないとき

- Safari のタブで開いている → ホーム画面アイコンから開く
- iOS が 16.3 以前 → 16.4 以降に更新
- テスト通知も来ない → iPhone の「設定 → 通知」でアプリが許可されているか確認
- 相手の入力だけ来ない → 上記 B の Edge Function / Secrets / SQL が未完了の可能性
