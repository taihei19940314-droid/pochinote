alter table offer_recipients
  add column if not exists pet_id uuid references pets(id) on delete set null;
