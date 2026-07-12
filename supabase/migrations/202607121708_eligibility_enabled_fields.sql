-- Optional eligibility field toggles per derby event policy

alter table public.derby_eligibility_policies
  add column enabled_eligibility_fields text[] not null default array[]::text[];

comment on column public.derby_eligibility_policies.enabled_eligibility_fields is
  'Eligibility dimensions active for this event (age_class, weight, banding, experience, origin, association, inspection, documents, payment). Empty means no optional rules are enforced.';
