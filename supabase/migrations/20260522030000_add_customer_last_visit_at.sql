-- ================================================================
-- Pochinote — customers テーブルに last_visit_at カラムを追加
-- 作成日: 2026-05-22
-- 説明: 離脱顧客検出に使用する最終来店日。
--       bookings.status が completed に変更された時にトリガーで自動更新。
--
-- 実行方法(手動):
--   Supabase ダッシュボードの SQL Editor で貼り付けて実行
--
-- GRANT 追加不要:
--   20260505000001_grant_permissions.sql で
--   "GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, authenticated"
--   が設定済みのため、既存テーブルへの ADD COLUMN には追加 GRANT 不要。
-- ================================================================

-- Step 1: カラム追加
ALTER TABLE customers
  ADD COLUMN last_visit_at TIMESTAMPTZ;

-- Step 2: トリガー関数の作成
-- bookings.status が completed になった時に customers.last_visit_at を更新する
-- 注: bookings status の completed→cancelled 逆遷移時は last_visit_at を更新しない。
--     稀なケースのため Phase 1A では許容、必要になれば Phase 2 で対応
CREATE OR REPLACE FUNCTION update_customer_last_visit_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE customers
      SET last_visit_at = NEW.scheduled_at
      WHERE id = NEW.customer_id
        AND (last_visit_at IS NULL OR last_visit_at < NEW.scheduled_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: トリガーの作成
CREATE TRIGGER bookings_update_last_visit_at
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_customer_last_visit_at();

-- Step 4: 既存の completed bookings から last_visit_at を遡及 UPDATE(1回限り)
UPDATE customers c
  SET last_visit_at = sub.max_at
  FROM (
    SELECT customer_id, MAX(scheduled_at) AS max_at
    FROM bookings
    WHERE status = 'completed'
    GROUP BY customer_id
  ) sub
  WHERE c.id = sub.customer_id;
