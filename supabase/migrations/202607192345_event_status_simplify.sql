-- Collapse prep/live event statuses into a single in_progress phase.
create type public.event_status_new as enum (
  'draft',
  'open',
  'in_progress',
  'completed',
  'cancelled',
  'archived'
);

alter table public.events
  alter column status drop default;

alter table public.events
  alter column status type public.event_status_new
  using (
    case status::text
      when 'registration_closed' then 'in_progress'
      when 'ready_for_weighing' then 'in_progress'
      when 'ready_for_matching' then 'in_progress'
      when 'ongoing' then 'in_progress'
      else status::text
    end
  )::public.event_status_new;

drop type public.event_status;

alter type public.event_status_new rename to event_status;

alter table public.events
  alter column status set default 'draft';

comment on type public.event_status is
  'Event lifecycle: draft → open → in_progress → completed → archived (cancelled is terminal before archive).';
