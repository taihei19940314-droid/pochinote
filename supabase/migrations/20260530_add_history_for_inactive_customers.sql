-- ============================================================
-- 20260530_add_history_for_inactive_customers.sql
-- Day 23 Task 7: Add 1 completed booking per 赤色5名 so their
-- カルテ shows a visit history matching their last_visit_at.
--
-- Trigger note: bookings_update_last_visit_at fires AFTER UPDATE,
-- NOT AFTER INSERT. So INSERTing completed bookings does NOT
-- fire the trigger → last_visit_at values are preserved as-is.
-- ============================================================

INSERT INTO bookings (id, salon_id, customer_id, pet_id, staff_id, scheduled_at, status, services, price, duration_min, memo) VALUES
  -- 山口節子 (0010, pet 0010): 2025-04-25 11:00 JST = T02:00 UTC
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0004-000000000010', '00000000-0000-0000-0005-000000000010',
   NULL, '2025-04-25T02:00:00+00:00', 'completed', ARRAY['full_course'], 9000, 90, NULL),

  -- 林智子 (0008, pet 0008): 2025-12-31 14:00 JST = T05:00 UTC
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0004-000000000008', '00000000-0000-0000-0005-000000000008',
   NULL, '2025-12-31T05:00:00+00:00', 'completed', ARRAY['full_course'], 8500, 90, NULL),

  -- 井上裕子 (0006, pet 0006): 2026-02-19 13:00 JST = T04:00 UTC
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0004-000000000006', '00000000-0000-0000-0005-000000000006',
   NULL, '2026-02-19T04:00:00+00:00', 'completed', ARRAY['partial_cut'], 8800, 90, NULL),

  -- 加藤恵子 (0004, pet 0004): 2026-03-21 10:00 JST = T01:00 UTC
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0005-000000000004',
   NULL, '2026-03-21T01:00:00+00:00', 'completed', ARRAY['full_course'], 7500, 90, NULL),

  -- 松本幸子 (0005, pet 0005): 2026-03-11 15:00 JST = T06:00 UTC
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0004-000000000005', '00000000-0000-0000-0005-000000000005',
   NULL, '2026-03-11T06:00:00+00:00', 'completed', ARRAY['full_course'], 9500, 90, NULL);
