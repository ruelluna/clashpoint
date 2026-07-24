-- Short scan codes for sticker print / USB scan (canonical OWN-/COCK-/BET- kept for audit)

alter table public.entries
  add column if not exists owner_scan_code text;

alter table public.rooster_event_registrations
  add column if not exists cock_scan_code text;

alter table public.match_bets
  add column if not exists scan_code text;

-- Backfill owner scan codes from OWN-{8}-{####}
update public.entries
set owner_scan_code = 'O' || right(owner_barcode, 4)
where owner_barcode is not null
  and owner_scan_code is null
  and owner_barcode ~ '^OWN-[A-Z0-9]{8}-\d{4}$';

-- Backfill cock scan codes from COCK-{8}-{####}
update public.rooster_event_registrations
set cock_scan_code = 'C' || right(cock_entry_barcode, 4)
where cock_entry_barcode is not null
  and cock_scan_code is null
  and cock_entry_barcode ~ '^COCK-[A-Z0-9]{8}-\d{4}$';

-- Backfill bet scan codes from BET-{8}-{####}-{M|W}
update public.match_bets
set scan_code = 'B' || substr(barcode, length(barcode) - 5, 4) || right(barcode, 1)
where barcode is not null
  and scan_code is null
  and barcode ~ '^BET-[A-Z0-9]{8}-\d{4}-[MW]$';

create unique index if not exists entries_event_owner_scan_code_unique
  on public.entries (event_id, owner_scan_code)
  where owner_scan_code is not null and deleted_at is null;

create unique index if not exists rooster_regs_event_cock_scan_code_unique
  on public.rooster_event_registrations (event_id, cock_scan_code)
  where cock_scan_code is not null;

create unique index if not exists match_bets_event_scan_code_unique
  on public.match_bets (event_id, scan_code)
  where scan_code is not null;
