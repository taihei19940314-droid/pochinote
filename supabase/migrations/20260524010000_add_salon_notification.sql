-- ================================================================
-- Day 17 追加: サロンへの予約希望 Push 通知設定
--   notification_line_user_id : 通知先サロンオーナーの個人 LINE user ID
--   notification_registration_pending : 設定 UI でボタンを押した後、
--                                        「管理者登録」受信まで true
-- ================================================================

ALTER TABLE salons
  ADD COLUMN notification_line_user_id       TEXT,
  ADD COLUMN notification_registration_pending BOOLEAN NOT NULL DEFAULT false;
