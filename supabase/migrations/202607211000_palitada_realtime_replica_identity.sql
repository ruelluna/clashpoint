-- Ensure DELETE payloads include full old row for Supabase Realtime
ALTER TABLE public.match_palitada_contributions REPLICA IDENTITY FULL;
