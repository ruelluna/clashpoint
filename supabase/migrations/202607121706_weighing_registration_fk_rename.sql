-- Rename weighings FK column to match application layer after rooster_records rename

alter table public.weighings
  rename column rooster_record_id to rooster_event_registration_id;
