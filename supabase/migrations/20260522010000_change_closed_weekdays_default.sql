-- ================================================================
-- Pochinote — closed_weekdays のデフォルトを空配列に変更
-- 作成日: 2026-05-22
-- 説明: 定休日の初期値を日曜固定({0})から全なし({})に変更する。
--       既存レコードで {0} のままになっている行も明示的に更新する。
--
-- 実行方法(手動):
--   Supabase ダッシュボードの SQL Editor で貼り付けて実行
-- ================================================================

-- カラムのデフォルト値を空配列に変更
ALTER TABLE salons
  ALTER COLUMN closed_weekdays SET DEFAULT '{}';

-- 既存レコードの closed_weekdays が {0} のものを空配列にリセット
UPDATE salons
  SET closed_weekdays = '{}'
  WHERE closed_weekdays = '{0}';
