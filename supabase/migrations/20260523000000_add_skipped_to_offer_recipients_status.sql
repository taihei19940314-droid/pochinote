-- ================================================================
-- offer_recipients.status の CHECK 制約に 'skipped' を追加
-- 再送禁止期間内の送信をスキップした記録を保持するために使用
-- ================================================================

ALTER TABLE offer_recipients
  DROP CONSTRAINT offer_recipients_status_check,
  ADD CONSTRAINT offer_recipients_status_check
    CHECK (status IN ('pending', 'sent', 'failed', 'booked', 'declined', 'expired', 'skipped'));
