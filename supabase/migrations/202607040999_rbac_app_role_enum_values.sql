-- Enum values must be committed before use in functions/policies (Postgres 55P04).
alter type public.app_role add value if not exists 'system_owner';
alter type public.app_role add value if not exists 'event_organizer';
alter type public.app_role add value if not exists 'registration_staff';
alter type public.app_role add value if not exists 'finance_staff';
alter type public.app_role add value if not exists 'weighing_staff';
alter type public.app_role add value if not exists 'matchmaker';
alter type public.app_role add value if not exists 'result_recorder';
alter type public.app_role add value if not exists 'promoter';
alter type public.app_role add value if not exists 'public_viewer';
