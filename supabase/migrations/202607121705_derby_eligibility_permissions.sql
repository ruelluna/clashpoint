-- Derby eligibility: granular permissions and staff modules

insert into public.permissions (id, description) values
  ('rooster.view', 'View permanent rooster registry'),
  ('rooster.create', 'Create rooster registry records'),
  ('rooster.update', 'Update rooster registry records'),
  ('rooster_event_registration.view', 'View rooster event registrations'),
  ('rooster_event_registration.create', 'Create rooster event registrations'),
  ('rooster_event_registration.submit', 'Submit rooster event registrations'),
  ('rooster_event_registration.review', 'Review submitted registrations'),
  ('rooster_event_registration.approve', 'Approve rooster event registrations'),
  ('rooster_event_registration.conditionally_approve', 'Conditionally approve registrations'),
  ('rooster_event_registration.reject', 'Reject rooster event registrations'),
  ('rooster_event_registration.revoke_approval', 'Revoke registration approval'),
  ('rooster_event_registration.withdraw', 'Withdraw rooster registrations'),
  ('rooster_event_registration.disqualify', 'Disqualify rooster registrations'),
  ('derby_eligibility.view', 'View derby eligibility policies'),
  ('derby_eligibility.manage', 'Manage derby eligibility policies'),
  ('derby_eligibility.activate_policy', 'Activate eligibility policies'),
  ('derby_eligibility.override', 'Approve eligibility overrides'),
  ('classification.view', 'View competitive classifications'),
  ('classification.assign_rooster_class', 'Assign rooster competitive class'),
  ('classification.assign_competitor_level', 'Assign competitor level'),
  ('classification.assign_entry_division', 'Assign entry division'),
  ('classification.manage_pairing_rules', 'Manage event pairing matrices'),
  ('classification.approve_exception', 'Approve matchup exceptions'),
  ('classification.view_history', 'View classification history'),
  ('banding.view', 'View rooster banding records'),
  ('banding.create', 'Create rooster band records'),
  ('banding.verify', 'Verify rooster bands'),
  ('banding.reject', 'Reject rooster band verification'),
  ('weighing.record', 'Record official weights'),
  ('weighing.verify', 'Verify weighings'),
  ('weighing.void', 'Void weighing records'),
  ('inspection.record', 'Record physical inspections'),
  ('inspection.approve', 'Approve physical inspections'),
  ('inspection.reject', 'Reject physical inspections')
on conflict (id) do nothing;

-- Grant new permissions to event_organizer preset
insert into public.role_permissions (role, permission_id)
select 'event_organizer'::public.app_role, p.id
from public.permissions p
where p.id in (
  'rooster.view', 'rooster.create', 'rooster.update',
  'rooster_event_registration.view', 'rooster_event_registration.create',
  'rooster_event_registration.submit', 'rooster_event_registration.review',
  'rooster_event_registration.approve', 'rooster_event_registration.conditionally_approve',
  'rooster_event_registration.reject', 'rooster_event_registration.revoke_approval',
  'rooster_event_registration.withdraw', 'rooster_event_registration.disqualify',
  'derby_eligibility.view', 'derby_eligibility.manage', 'derby_eligibility.activate_policy',
  'derby_eligibility.override',
  'classification.view', 'classification.assign_rooster_class',
  'classification.assign_competitor_level', 'classification.assign_entry_division',
  'classification.manage_pairing_rules', 'classification.approve_exception',
  'classification.view_history',
  'banding.view', 'banding.create', 'banding.verify', 'banding.reject',
  'weighing.record', 'weighing.verify', 'weighing.void',
  'inspection.record', 'inspection.approve', 'inspection.reject'
)
on conflict do nothing;
