-- Drop salon notification columns (no longer used after Day 18 cleanup)
ALTER TABLE salons DROP COLUMN IF EXISTS notification_line_user_id;
ALTER TABLE salons DROP COLUMN IF EXISTS notification_registration_pending;
