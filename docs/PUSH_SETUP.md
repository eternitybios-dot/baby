# iPhone 通知が届かないとき

## 結論（妻側）

**以前ホーム画面に追加済みでも、一度消して入れ直すのが確実**です。  
Service Worker（通知の土台）が古い状態のまま残ることがあります。

## 夫婦どちらもやること

1. ホーム画面の「すくすくログ」を削除
2. Safari で https://eternitybios-dot.github.io/baby/home/ を開く
3. 共有 → **ホーム画面に追加**
4. **そのアイコンから**開く（Safariのタブではない）
5. 設定 → **通知をオン** → 許可  
   - 「通知がオンになりました」のテスト通知が来るか確認
6. もう一方の端末でも同じ

## あなた（セットアップ担当）だけ

SQL をまだなら実行（これを忘れると相手に届きません）:

https://raw.githubusercontent.com/eternitybios-dot/baby/cursor/sukusuku-log-foundation-814d/supabase/migrations/003_push_subscriptions.sql

## 確認ポイント

| 症状 | 見方 |
|------|------|
| テスト通知も来ない | ホーム画面から開いていない / 通知許可オフ / 入れ直し不足 |
| テストは来るが相手の入力が来ない | 相手が通知オフ / SQL 003 未実行 / 相手も入れ直しが必要 |
| Safari タブでは来るがアイコンだと… | 必ずホーム画面アイコンから開く |
