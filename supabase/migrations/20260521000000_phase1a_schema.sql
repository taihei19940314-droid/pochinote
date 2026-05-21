-- ================================================================
-- Pochinote — Phase 1A スキーマ拡張
-- 作成日: 2026-05-21
-- 説明: LINE 自動オファー機能(Phase 1A)に必要な DB 変更
--         1. salons: 自動オファー設定カラム追加
--         2. customers: LINE 友だち状態カラム追加
--         3. offers: ターゲット条件カラム追加 + status enum 拡張
--         4. offer_recipients: 新規テーブル(送信先記録)
--         5. message_templates: 新規テーブル(メッセージひな形)
-- ================================================================


-- ================================================================
-- STEP 1: salons テーブルへのカラム追加
-- ================================================================

ALTER TABLE salons
  ADD COLUMN inactive_threshold_days  INT     NOT NULL DEFAULT 60
    CONSTRAINT salons_inactive_threshold_days_positive CHECK (inactive_threshold_days > 0),
  ADD COLUMN auto_offer_enabled       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN min_resend_interval_days INT     NOT NULL DEFAULT 7
    CONSTRAINT salons_min_resend_interval_days_nonneg CHECK (min_resend_interval_days >= 0);


-- ================================================================
-- STEP 2: customers テーブルへのカラム追加
-- ================================================================

ALTER TABLE customers
  ADD COLUMN line_follow_status TEXT
    CONSTRAINT customers_line_follow_status_check
      CHECK (line_follow_status IN ('followed', 'unfollowed', 'blocked') OR line_follow_status IS NULL),
  ADD COLUMN line_followed_at TIMESTAMPTZ;

CREATE INDEX idx_customers_line_follow_status ON customers(line_follow_status);


-- ================================================================
-- STEP 3: offers テーブルへのカラム追加 + status CHECK 拡張
-- ================================================================

-- PostgreSQL は既存 CHECK 制約をインプレース変更できないため、
-- DROP → ADD で差し替える。既存値(draft/sent/filled/expired)は新 enum に含まれる。
ALTER TABLE offers
  DROP CONSTRAINT offers_status_check;

ALTER TABLE offers
  ADD CONSTRAINT offers_status_check
    CHECK (status IN ('draft', 'pending_review', 'sent', 'filled', 'expired', 'cancelled'));

ALTER TABLE offers
  ADD COLUMN target_days_since_visit INT
    CONSTRAINT offers_target_days_positive
      CHECK (target_days_since_visit > 0 OR target_days_since_visit IS NULL),
  ADD COLUMN max_recipients INT NOT NULL DEFAULT 5
    CONSTRAINT offers_max_recipients_range
      CHECK (max_recipients > 0 AND max_recipients <= 100),
  ADD COLUMN is_auto BOOLEAN NOT NULL DEFAULT false;


-- ================================================================
-- STEP 4: offer_recipients テーブル新規作成
-- ================================================================

CREATE TABLE offer_recipients (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id             UUID        NOT NULL REFERENCES salons(id)    ON DELETE CASCADE,
  offer_id             UUID        NOT NULL REFERENCES offers(id)    ON DELETE CASCADE,
  customer_id          UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status               TEXT        NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending', 'sent', 'failed', 'booked', 'declined', 'expired')),
  days_since_last_visit INT,
  sent_at              TIMESTAMPTZ,
  booked_at            TIMESTAMPTZ,
  declined_at          TIMESTAMPTZ,
  error_message        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_offer_recipients_offer_customer UNIQUE (offer_id, customer_id)
);

CREATE INDEX idx_offer_recipients_salon_id          ON offer_recipients(salon_id);
CREATE INDEX idx_offer_recipients_offer_id           ON offer_recipients(offer_id);
CREATE INDEX idx_offer_recipients_customer_id_sent_at ON offer_recipients(customer_id, sent_at DESC);

CREATE TRIGGER offer_recipients_updated_at
  BEFORE UPDATE ON offer_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE offer_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon staff can access own offer_recipients"
  ON offer_recipients FOR ALL
  USING (salon_id = get_my_salon_id());


-- ================================================================
-- STEP 5: message_templates テーブル新規作成
-- ================================================================

CREATE TABLE message_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id      UUID        NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  template_type TEXT        NOT NULL
                              CHECK (template_type IN ('friendly', 'business', 'sales')),
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  is_default    BOOLEAN     NOT NULL DEFAULT false,
  content       TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 各サロン・各タイプにつきデフォルト1件のみ(is_default=true の行だけ対象)
CREATE UNIQUE INDEX uq_message_templates_default
  ON message_templates (salon_id, template_type)
  WHERE is_default = true;

CREATE INDEX idx_message_templates_salon_id ON message_templates(salon_id);

CREATE TRIGGER message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon staff can access own message_templates"
  ON message_templates FOR ALL
  USING (salon_id = get_my_salon_id());
