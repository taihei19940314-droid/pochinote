-- bookings.pet_id を nullable に(サロンが承認後に手動入力する運用へ)
ALTER TABLE bookings ALTER COLUMN pet_id DROP NOT NULL;

-- offer_recipients.pet_id カラム DROP(Day 20 で追加したが廃止)
ALTER TABLE offer_recipients DROP COLUMN IF EXISTS pet_id;
