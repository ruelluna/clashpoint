-- Derby eligibility system: classification and workflow enums

create type public.age_class as enum ('stag', 'bullstag', 'cock', 'unknown');
create type public.competition_class as enum ('class_a', 'class_b', 'class_c', 'unclassified');
create type public.experience_status as enum (
  'maiden', 'one_time_winner', 'two_time_winner', 'multi_winner', 'winless', 'unknown'
);
create type public.competitor_level as enum (
  'novice', 'intermediate', 'advanced', 'veteran', 'unrated'
);
create type public.entry_division as enum (
  'division_a', 'division_b', 'division_c', 'open', 'unassigned'
);
create type public.derby_age_type as enum (
  'stag_derby', 'bullstag_derby', 'cock_derby', 'stag_cock_derby',
  'cock_bullstag_derby', 'stag_bullstag_cock_combo', 'open_derby', 'custom'
);
create type public.registration_workflow_status as enum (
  'draft', 'submitted', 'pending_review', 'pending_weighing', 'pending_inspection',
  'pending_documents', 'pending_band_verification', 'conditionally_approved',
  'approved', 'rejected', 'withdrawn', 'disqualified', 'matched', 'completed'
);
create type public.rooster_approval_status as enum (
  'not_submitted', 'pending', 'conditionally_approved', 'approved', 'rejected', 'revoked'
);
create type public.eligibility_status as enum (
  'eligible', 'conditionally_eligible', 'pending_review', 'ineligible'
);
create type public.band_level as enum (
  'national', 'local', 'association', 'personal_farm', 'unbanded', 'other'
);
create type public.band_location as enum ('wing', 'leg', 'other');
create type public.band_verification_status as enum (
  'unverified', 'pending', 'verified', 'rejected'
);
create type public.origin_type as enum ('locally_bred', 'imported', 'unknown');
create type public.breeding_relationship as enum (
  'owner_bred', 'member_bred', 'breeder_produced', 'farm_owned',
  'externally_acquired', 'unknown'
);
create type public.entry_rooster_role as enum (
  'primary', 'reserve', 'substitute', 'joker', 'replacement'
);
create type public.pairing_status as enum ('allowed', 'approval_required', 'prohibited');
create type public.classification_type as enum (
  'rooster_class', 'competitor_level', 'entry_division'
);
create type public.unknown_value_handling as enum ('allow', 'approval_required', 'prohibit');
create type public.policy_status as enum ('draft', 'active', 'locked', 'archived');
create type public.rejection_category as enum (
  'age_ineligible', 'weight_below_minimum', 'weight_above_maximum', 'band_invalid',
  'band_unverified', 'duplicate_band', 'experience_ineligible', 'origin_ineligible',
  'association_requirement_failed', 'inspection_failed', 'missing_documents',
  'payment_incomplete', 'duplicate_registration', 'classification_incomplete',
  'promoter_rejection', 'other'
);
create type public.inspection_status as enum (
  'not_required', 'pending', 'passed', 'failed', 'for_review'
);
create type public.registration_payment_status as enum (
  'not_required', 'unpaid', 'partial', 'paid', 'refunded'
);
create type public.conditionally_approved_match_handling as enum (
  'exclude', 'include_with_warning', 'include_with_approval_required'
);
create type public.compatibility_status as enum (
  'compatible', 'approval_required', 'prohibited'
);
create type public.override_status as enum ('pending', 'approved', 'rejected');
