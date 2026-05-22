-- ================================================================
-- Pochinote — salons テーブルに営業設定カラムを追加
-- 作成日: 2026-05-22
-- 説明: 空き枠検出(Day 9)で使用する営業時間・定休日・1枠長さの設定
--
-- 実行方法(手動):
--   Supabase ダッシュボードの SQL Editor で貼り付けて実行
--
-- GRANT 追加不要:
--   20260505000001_grant_permissions.sql で
--   "GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, authenticated"
--   が設定済みのため、既存テーブルへの ADD COLUMN には追加 GRANT 不要。
-- ================================================================

ALTER TABLE salons
  ADD COLUMN business_hours_start  TIME      NOT NULL DEFAULT '09:00',
  ADD COLUMN business_hours_end    TIME      NOT NULL DEFAULT '18:00',
  ADD COLUMN closed_weekdays       INTEGER[] NOT NULL DEFAULT '{0}',
  ADD COLUMN default_slot_minutes  INTEGER   NOT NULL DEFAULT 90
    CONSTRAINT salons_default_slot_minutes_range
      CHECK (default_slot_minutes BETWEEN 30 AND 240);
