-- ============================================================
-- 20260530_fix_last_visit_at_for_active_customers.sql
-- Day 23 Task 6: Set last_visit_at for customers who have bookings
-- but showed as NULL (新規). Trigger only fires on status→completed,
-- so direct UPDATE is safe.
--
-- 新規として残す(NULLのまま): 岡田正雄, 村上洋子 (future-only bookings)
-- 橋本花: LINE completed 2026-05-15 があるため新規ではない → 設定
-- ============================================================

-- 渡辺さくら: in_progress 2026-05-30T04:00 UTC (JST 13:00)
UPDATE customers SET last_visit_at = '2026-05-30T04:00:00+00:00'
  WHERE id = '00000000-0000-0000-0004-000000000002';

-- 清水美穂: completed (LINE) 2026-05-22T01:00 UTC
UPDATE customers SET last_visit_at = '2026-05-22T01:00:00+00:00'
  WHERE id = '00000000-0000-0000-0004-000000000009';

-- 佐藤健太郎: in_progress 2026-05-05T12:00 UTC (JST 21:00)
UPDATE customers SET last_visit_at = '2026-05-05T12:00:00+00:00'
  WHERE id = '00000000-0000-0000-0002-000000000002';

-- 鈴木陽子: confirmed 2026-05-05T15:30 UTC (JST 翌 00:30 = 5/6)
UPDATE customers SET last_visit_at = '2026-05-05T15:30:00+00:00'
  WHERE id = '00000000-0000-0000-0002-000000000003';

-- 斉藤花子: confirmed 2026-05-19T08:00 UTC (JST 17:00)
UPDATE customers SET last_visit_at = '2026-05-19T08:00:00+00:00'
  WHERE id = 'fc699187-a6bc-40da-b53d-a324382ed9db';

-- 橋本花: completed (LINE) 2026-05-15T05:00 UTC
UPDATE customers SET last_visit_at = '2026-05-15T05:00:00+00:00'
  WHERE id = '00000000-0000-0000-0004-000000000018';
