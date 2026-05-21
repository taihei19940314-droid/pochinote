-- ================================================================
-- Pochinote — customers.ignored カラム追加
-- 作成日: 2026-05-21
-- 説明: 「無視」アクションで LINE 連携待ち一覧から非表示にするためのフラグ
-- ================================================================

ALTER TABLE customers
  ADD COLUMN ignored BOOLEAN NOT NULL DEFAULT false;

-- ignored=true の行だけ部分インデックス(非表示フィルタを高速化)
CREATE INDEX idx_customers_ignored ON customers(ignored) WHERE ignored = true;
