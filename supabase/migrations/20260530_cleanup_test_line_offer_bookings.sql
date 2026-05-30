-- ============================================================
-- 20260530_cleanup_test_line_offer_bookings.sql
-- Remove 2 test bookings (¥8,800 × 2) manually entered on 2026-05-27
-- that had memo='LINE オファー経由' and inflated the KPI to ¥35,200.
-- After deletion, LINE オファー経由 revenue = ¥17,600 (3 demo seed records).
-- ============================================================

DELETE FROM bookings
  WHERE id IN (
    'abddcd1a-e964-417e-bae6-296ada862487',
    '43a3bf4d-d856-41c2-9708-1fe8c8bffa51'
  );
