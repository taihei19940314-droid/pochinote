-- ================================================================
-- Pochinote — customers.line_pending_data カラム追加
-- 作成日: 2026-05-21
-- 説明: LINE 本人特定フロー用の一時データを JSONB で保存する専用カラム
--       customers.notes(自由メモ)との競合を避けるため独立カラムとして追加
--       保存内容例:
--       {
--         "line_pending": {
--           "rawText": "佐藤花子 / こてつ",
--           "parsed": { "ownerName": "佐藤花子", "petName": "こてつ", "confidence": "high" },
--           "candidatesFetchedAt": "2026-05-21T18:30:00Z"
--         }
--       }
-- ================================================================

ALTER TABLE customers
  ADD COLUMN line_pending_data JSONB;
