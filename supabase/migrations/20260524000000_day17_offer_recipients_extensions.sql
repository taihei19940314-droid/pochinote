-- ================================================================
-- Day 17: offer_recipients テーブル拡張
--   1. status CHECK に 'skipped' を追加(Day 16 で作成済みだが未適用)
--   2. template_type_used 追加 — 送信時のテンプレ種別を記録
--   3. is_competing 追加 — 同一 offer で複数応募が来た場合に true
-- ================================================================

-- 1. 'skipped' を status CHECK に追加
ALTER TABLE offer_recipients
  DROP CONSTRAINT offer_recipients_status_check;

ALTER TABLE offer_recipients
  ADD CONSTRAINT offer_recipients_status_check
    CHECK (status IN ('pending', 'sent', 'failed', 'booked', 'declined', 'expired', 'skipped'));

-- 2. template_type_used: 送信時に選択されたテンプレ種別(friendly / business / sales)
ALTER TABLE offer_recipients
  ADD COLUMN template_type_used TEXT
    CHECK (template_type_used IN ('friendly', 'business', 'sales') OR template_type_used IS NULL);

-- 3. is_competing: 同一 offer で先着 1 人目以外が応募した場合に true
ALTER TABLE offer_recipients
  ADD COLUMN is_competing BOOLEAN NOT NULL DEFAULT false;
