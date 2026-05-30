-- ============================================================
-- 20260530_reassign_stray_test_bookings.sql
-- Reassign 2 test bookings (created 2026-05-29) from 佐藤健太郎/鈴木陽子
-- to healthy customers. These were at T03/T06 slots (not T04/T07 from
-- demo seed) so they were missed in the Day 23 Task 4 bulk reassignment.
-- ============================================================

-- 佐藤健太郎 2026-05-29T03:00 → 久保孝彦
UPDATE bookings
  SET customer_id = '6fae38b1-92ba-4873-94a5-a6449464da0a',
      pet_id      = 'cd3474d7-8249-435f-917b-bcfe07735429'
  WHERE id = 'bfd2f1d2-fbb3-4441-8c07-e00c6d778b21';

-- 鈴木陽子 2026-05-29T06:00 → 小川圭介
UPDATE bookings
  SET customer_id = 'f55f2198-5471-4d3f-9871-a14ff475212c',
      pet_id      = 'd7f17346-d668-4c53-980e-f0e40303c75a'
  WHERE id = '1e3466c6-7d72-4395-a27e-d8e1bb653d0c';
