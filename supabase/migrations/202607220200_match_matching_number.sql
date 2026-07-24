-- Matching Number: random 4-letter prefix + zero-padded fight number (e.g. KQTM-0005)

ALTER TABLE public.matches
  ADD COLUMN matching_number text;

UPDATE public.matches
SET matching_number =
  upper(
    chr(65 + floor(random() * 26)::int) ||
    chr(65 + floor(random() * 26)::int) ||
    chr(65 + floor(random() * 26)::int) ||
    chr(65 + floor(random() * 26)::int)
  ) || '-' || lpad(fight_number::text, 4, '0')
WHERE matching_number IS NULL;

ALTER TABLE public.matches
  ALTER COLUMN matching_number SET NOT NULL;

CREATE UNIQUE INDEX matches_event_matching_number_idx
  ON public.matches (event_id, matching_number);
