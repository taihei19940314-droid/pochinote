-- ================================================================
-- Pochinote — コアテーブル マイグレーション
-- 作成日: 2026-05-05
-- 説明: MVP Phase 1 で必要な 8 テーブルを定義する
-- ================================================================


-- ================================================================
-- STEP 0: 共通インフラ
-- ================================================================

-- updated_at を自動で現在時刻に更新するトリガー関数（全テーブル共通）
-- 「誰かがレコードを更新したとき、updated_at を自動で書き換える」機能
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TABLE 1: salons（サロン）
-- 役割: 店舗の基本情報。LINE公式アカウントの認証情報もここに持つ。
--       将来の多店舗展開に備えて、全テーブルが salon_id を参照する。
-- ================================================================
CREATE TABLE IF NOT EXISTS salons (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,                    -- 例: ぽちのてトリミング 渋谷店
  address              TEXT,                                    -- 住所
  phone                TEXT,                                    -- 電話番号
  line_channel_id      TEXT,                                    -- LINE Messaging API チャンネルID
  line_channel_secret  TEXT,                                    -- LINE チャンネルシークレット（サーバー側のみ参照）
  line_access_token    TEXT,                                    -- LINE アクセストークン（サーバー側のみ参照）
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER salons_updated_at
  BEFORE UPDATE ON salons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ================================================================
-- TABLE 2: staff（スタッフ）
-- 役割: トリマーなどサロンスタッフの情報。
--       Supabase Auth（ログイン機能）と auth_user_id で紐付ける。
--       role で「オーナー / トリマー / 受付」を区別できる。
-- 繋がり: salons ← salon_id で「どのサロンのスタッフか」を管理
-- ================================================================
CREATE TABLE IF NOT EXISTS staff (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id       UUID        NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  auth_user_id   UUID        UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,  -- Supabase Authと連携
  name           TEXT        NOT NULL,                                              -- 例: 美咲
  role           TEXT        NOT NULL DEFAULT 'trimmer'
                               CHECK (role IN ('owner', 'trimmer', 'receptionist')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_salon_id     ON staff(salon_id);
CREATE INDEX idx_staff_auth_user_id ON staff(auth_user_id);

CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ================================================================
-- TABLE 3: customers（飼い主）
-- 役割: ペットの飼い主（=LINEで連絡を取る相手）の情報。
--       line_user_id で「どのLINEアカウントと紐付いているか」を管理。
--       来店周期の計算やオファー送信の対象として使う。
-- 繋がり: salons ← salon_id
-- ================================================================
CREATE TABLE IF NOT EXISTS customers (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id      UUID        NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,              -- 例: 田中 花子
  phone         TEXT,                              -- 電話番号
  line_user_id  TEXT,                              -- LINE の userId（Webhookで取得）
  notes         TEXT,                              -- 自由メモ
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_salon_id    ON customers(salon_id);
CREATE INDEX idx_customers_line_user_id ON customers(line_user_id);

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ================================================================
-- TABLE 4: pets（ペット）
-- 役割: 個々のペットのカルテ情報。Pochinoteの中核テーブル。
--       flags と allergies は JSONB 型で柔軟に管理する。
-- 繋がり: salons ← salon_id
--         customers ← customer_id（「誰の子か」）
--
-- flags の例:
--   {"nail_sensitive": true, "thunder_scared": true, "shampoo_likes": true}
-- allergies の例:
--   {"chicken": true, "beef": false, "shrimp": true}
-- ================================================================
CREATE TABLE IF NOT EXISTS pets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id      UUID        NOT NULL REFERENCES salons(id)      ON DELETE CASCADE,
  customer_id   UUID        NOT NULL REFERENCES customers(id)   ON DELETE CASCADE,
  name          TEXT        NOT NULL,                           -- 例: モカ
  species       TEXT        NOT NULL DEFAULT '犬',             -- 犬 / 猫 / うさぎ など
  breed         TEXT,                                           -- 例: トイプードル
  gender        TEXT        CHECK (gender IN ('male', 'female', 'unknown')),
  birth_date    DATE,                                           -- 誕生日（年齢・バースデーメッセージに使用）
  weight_kg     NUMERIC(5, 2),                                  -- 最新体重（kg）
  flags         JSONB       NOT NULL DEFAULT '{}',              -- 施術上の注意フラグ
  allergies     JSONB       NOT NULL DEFAULT '{}',              -- アレルギー情報
  notes         TEXT,                                           -- その他自由メモ
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pets_salon_id    ON pets(salon_id);
CREATE INDEX idx_pets_customer_id ON pets(customer_id);

-- JSONB フィールドの説明をDB側にも記録
COMMENT ON COLUMN pets.flags     IS '施術フラグ例: {"nail_sensitive": true, "thunder_scared": true, "shampoo_likes": true}';
COMMENT ON COLUMN pets.allergies IS 'アレルギー例: {"chicken": true, "beef": false}';

CREATE TRIGGER pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ================================================================
-- TABLE 5: bookings（予約）
-- 役割: 施術予約の管理。日時・サービス内容・ステータスを追跡する。
--       ダッシュボードの「本日の予約」一覧はここから取得する。
--       status の流れ: pending → confirmed → in_progress → completed
-- 繋がり: salons ← salon_id
--         pets     ← pet_id（どのペットの予約か）
--         customers ← customer_id（どの飼い主か）
--         staff    ← staff_id（担当トリマー、未定なら NULL）
-- ================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id      UUID        NOT NULL REFERENCES salons(id)    ON DELETE CASCADE,
  pet_id        UUID        NOT NULL REFERENCES pets(id)      ON DELETE RESTRICT,  -- ペット削除で予約は消さない
  customer_id   UUID        NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  staff_id      UUID        REFERENCES staff(id)              ON DELETE SET NULL,  -- 担当未定は NULL
  scheduled_at  TIMESTAMPTZ NOT NULL,                                               -- 予約日時
  duration_min  INT         NOT NULL DEFAULT 90,                                    -- 施術時間（分）
  services      TEXT[]      NOT NULL DEFAULT '{}',                                  -- 例: {"full_course","nail"}
  price         INT,                                                                 -- 料金（円）
  status        TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled')),
  memo          TEXT,                                                                -- 施術メモ
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_salon_id     ON bookings(salon_id);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX idx_bookings_status       ON bookings(status);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ================================================================
-- TABLE 6: photos（ビフォーアフター写真）
-- 役割: 施術写真の管理。before_url / after_url は Supabase Storage の URL。
--       sent_to_customer で「飼い主にLINE送信済みか」を管理する。
--       体重も記録して pets テーブルの体重推移グラフに使う。
-- 繋がり: salons   ← salon_id
--         bookings ← booking_id（どの施術回の写真か）
--         pets     ← pet_id（どのペットの写真か）
-- ================================================================
CREATE TABLE IF NOT EXISTS photos (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id         UUID        NOT NULL REFERENCES salons(id)   ON DELETE CASCADE,
  booking_id       UUID        REFERENCES bookings(id)          ON DELETE SET NULL, -- 予約削除後も写真は残す
  pet_id           UUID        NOT NULL REFERENCES pets(id)     ON DELETE CASCADE,
  before_url       TEXT,                                                             -- ビフォー写真のURL
  after_url        TEXT,                                                             -- アフター写真のURL
  weight_kg        NUMERIC(5, 2),                                                    -- その日の体重
  memo             TEXT,                                                             -- 施術メモ（カルテに表示）
  sent_to_customer BOOLEAN     NOT NULL DEFAULT FALSE,                               -- LINE送信済みか
  sent_at          TIMESTAMPTZ,                                                      -- 送信日時
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_salon_id  ON photos(salon_id);
CREATE INDEX idx_photos_pet_id    ON photos(pet_id);

CREATE TRIGGER photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ================================================================
-- TABLE 7: offers（空き枠オファー）
-- 役割: Pochinote の差別化機能「空き枠自動オファー」の管理テーブル。
--       空き枠の時間帯と割引率を設定すると、候補顧客への LINE 送信が始まる。
--       status で「下書き → 送信済み → 埋まった / 期限切れ」を追跡する。
-- 繋がり: salons ← salon_id
--         messages ← offer_id（このオファーで送ったメッセージ）
-- ================================================================
CREATE TABLE IF NOT EXISTS offers (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id         UUID        NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  available_from   TIMESTAMPTZ NOT NULL,                         -- 空き開始日時
  available_until  TIMESTAMPTZ NOT NULL,                         -- 空き終了日時
  discount_pct     INT         NOT NULL DEFAULT 0
                                 CHECK (discount_pct BETWEEN 0 AND 100), -- 割引率（0〜100%）
  status           TEXT        NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft','sent','filled','expired')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offers_salon_id ON offers(salon_id);
CREATE INDEX idx_offers_status   ON offers(status);

CREATE TRIGGER offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ================================================================
-- TABLE 8: messages（LINEメッセージ履歴）
-- 役割: 飼い主との LINE メッセージの送受信履歴を記録する。
--       direction = 'outbound'（サロンから送信）/ 'inbound'（飼い主から受信）
--       offer_id があるものは空き枠オファーとして送ったメッセージ。
-- 繋がり: salons    ← salon_id
--         customers ← customer_id（誰とのやり取りか）
--         offers    ← offer_id（どのオファーに紐付くか、なければ NULL）
-- ================================================================
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id        UUID        NOT NULL REFERENCES salons(id)    ON DELETE CASCADE,
  customer_id     UUID        REFERENCES customers(id)          ON DELETE SET NULL,
  offer_id        UUID        REFERENCES offers(id)             ON DELETE SET NULL,
  direction       TEXT        NOT NULL
                                CHECK (direction IN ('inbound','outbound')),
  content         TEXT        NOT NULL,                         -- メッセージ本文
  line_message_id TEXT,                                         -- LINE API から返るメッセージID
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),           -- 送受信日時
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_salon_id    ON messages(salon_id);
CREATE INDEX idx_messages_customer_id ON messages(customer_id);

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ================================================================
-- STEP LAST: Row Level Security（行レベルセキュリティ）
--
-- 「あるサロンのスタッフは、そのサロンのデータしか見えない」を強制する。
-- get_my_salon_id() でログイン中スタッフの salon_id を取得し、
-- 各テーブルの salon_id と照合する。
-- ================================================================

-- ログイン中スタッフが所属するサロンのIDを返すヘルパー関数
-- ※ staff テーブルが存在する必要があるため、全テーブル作成後に定義する
CREATE OR REPLACE FUNCTION get_my_salon_id()
RETURNS UUID AS $$
  SELECT salon_id FROM staff WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 全テーブルで RLS を有効化
ALTER TABLE salons    ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff     ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages  ENABLE ROW LEVEL SECURITY;

-- salons: 自分のサロンだけ参照可能
CREATE POLICY "salon staff can view own salon"
  ON salons FOR SELECT
  USING (id = get_my_salon_id());

-- 以下7テーブル: 同じサロンのデータのみ全操作（SELECT/INSERT/UPDATE/DELETE）可能
CREATE POLICY "salon staff can access own staff"
  ON staff FOR ALL
  USING (salon_id = get_my_salon_id());

CREATE POLICY "salon staff can access own customers"
  ON customers FOR ALL
  USING (salon_id = get_my_salon_id());

CREATE POLICY "salon staff can access own pets"
  ON pets FOR ALL
  USING (salon_id = get_my_salon_id());

CREATE POLICY "salon staff can access own bookings"
  ON bookings FOR ALL
  USING (salon_id = get_my_salon_id());

CREATE POLICY "salon staff can access own photos"
  ON photos FOR ALL
  USING (salon_id = get_my_salon_id());

CREATE POLICY "salon staff can access own offers"
  ON offers FOR ALL
  USING (salon_id = get_my_salon_id());

CREATE POLICY "salon staff can access own messages"
  ON messages FOR ALL
  USING (salon_id = get_my_salon_id());
