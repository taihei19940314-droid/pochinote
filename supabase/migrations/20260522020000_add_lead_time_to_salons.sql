-- ================================================================
-- Pochinote — salons テーブルに min_lead_time_minutes カラムを追加
-- 作成日: 2026-05-22
-- 説明: 空き枠検出時に「現在時刻 + リードタイム」未満の枠を除外する設定
--       例: 120 分 → 今から2時間以内に始まる枠は検出しない
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
  ADD COLUMN min_lead_time_minutes INTEGER NOT NULL DEFAULT 120
    CONSTRAINT salons_min_lead_time_minutes_range
      CHECK (min_lead_time_minutes BETWEEN 0 AND 1440);
