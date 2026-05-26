-- Add 'approved' and 'declined_by_salon' to offer_recipients status CHECK constraint
ALTER TABLE offer_recipients DROP CONSTRAINT IF EXISTS offer_recipients_status_check;
ALTER TABLE offer_recipients ADD CONSTRAINT offer_recipients_status_check
  CHECK (status IN ('pending', 'sent', 'failed', 'blocked', 'skipped',
                    'booked', 'declined', 'approved', 'declined_by_salon'));
