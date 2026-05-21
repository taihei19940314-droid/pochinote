# LINE Webhook 動作確認手順

## 1. LINE Developers での Webhook URL 設定

1. [LINE Developers コンソール](https://developers.line.biz/) にログイン
2. 使用する Messaging API チャネルを選択
3. 「Messaging API 設定」タブを開く
4. 「Webhook URL」欄に以下を入力して「更新」:
   ```
   https://triel-app.vercel.app/api/line/webhook
   ```
5. 「Webhook の利用」を ON にする
6. 「検証」ボタンを押して `200 OK` が返ることを確認

> **「検証」が失敗する場合**
> - Vercel へのデプロイが完了しているか確認
> - サロン設定 (/line/settings) でチャネルシークレットが保存済みか確認
> - Supabase に salons レコード (DEFAULT_SALON_ID) が存在するか確認

---

## 2. /line/settings での接続情報保存

1. アプリを開いて `/line/settings` に移動
2. LINE Developers コンソールから以下をコピーして各フォームに入力:
   - チャネル ID: 「基本設定」タブの「チャネル ID」
   - チャネルシークレット: 「基本設定」タブの「チャネルシークレット」
   - チャネルアクセストークン: 「Messaging API 設定」タブの「チャネルアクセストークン」
3. 「保存」ボタンを押して「✓ 保存しました」が表示されることを確認

---

## 3. 友だち追加テスト(follow イベント)

1. LINE アプリで対象の公式アカウントを友だち追加する
2. Supabase ダッシュボードの SQL Editor で以下を実行して確認:

```sql
SELECT id, name, line_user_id, line_follow_status, line_followed_at
FROM customers
WHERE line_follow_status = 'followed'
ORDER BY created_at DESC
LIMIT 10;
```

**期待結果**:
- `name = '(未特定 LINE ユーザー)'` の新しいレコードが挿入されている
- `line_follow_status = 'followed'`
- `line_followed_at` に追加日時が入っている

---

## 4. ブロック・ブロック解除テスト

ブロック操作:
1. LINE アプリで対象アカウントをブロックする
2. → `line_follow_status = 'unfollowed'` になることを確認

```sql
SELECT id, line_follow_status FROM customers
WHERE line_user_id = '(テスト対象のlineUserId)';
```

ブロック解除:
1. ブロック解除(= 友だちに戻す)
2. → `line_follow_status = 'followed'` に戻ることを確認

> **補足**: LINE の仕様上、ブロック操作は `unfollow` イベントとして送られます。
> ブロック専用の独立イベントは存在しません。

---

## 5. メッセージ受信ログ確認

1. LINE アプリで公式アカウントにメッセージを送信する
2. 以下のクエリで受信ログを確認:

```sql
SELECT id, customer_id, direction, content, line_message_id, sent_at
FROM messages
WHERE direction = 'inbound'
ORDER BY sent_at DESC
LIMIT 10;
```

**期待結果**:
- `direction = 'inbound'`
- `content` にメッセージ本文が入っている
- `customer_id` は現時点では NULL(本人特定は Day 5-6 実装)

---

## 6. よくあるエラーとデバッグ

### 401 Unauthorized が返る

原因: 署名検証の失敗
確認手順:
1. `/line/settings` でチャネルシークレットが正しく保存されているか
2. Supabase の salons テーブルで `line_channel_secret` の値を確認:

```sql
SELECT id, name, line_channel_id,
       left(line_channel_secret, 4) || '...' AS secret_preview
FROM salons
WHERE id = '00000000-0000-0000-0000-000000000001';
```

### Webhook 検証は通るが友だち追加が記録されない

確認手順:
1. Vercel のデプロイログでエラーを確認
2. Supabase の `SUPABASE_SERVICE_ROLE_KEY` が Vercel の環境変数に設定されているか確認

Vercel に必要な環境変数:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### 既存顧客に友だち追加してほしいがレコードが重複する

現状の仕様: 既存 customers に `line_user_id` が未設定の場合、新規ペンディングレコードが作成されます。
本人特定(既存レコードへの紐付け)は Day 5-6 で実装します。

回避策(手動): Supabase ダッシュボードで既存顧客の `line_user_id` を直接更新してから友だち追加:
```sql
UPDATE customers
SET line_user_id = '(友だち追加したユーザーのlineUserId)'
WHERE id = '(既存顧客のid)';
```
