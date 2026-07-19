'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState } from 'react'

import {
  ButtonGroup,
  FormField,
  LAYOUT_GAP,
  PageHeader,
  PageStack,
  PanelCard,
} from '@/components/dashboard'
import { evaluateRegistrationEligibilityAction } from '@/features/eligibility/actions'
import type { EligibilityActionState } from '@/features/eligibility/actions'
import type { DerbyEligibilityEvaluation } from '@/features/eligibility/types'
import {
  approveRegistrationAction,
  conditionallyApproveRegistrationAction,
  rejectRegistrationAction,
  revokeRegistrationApprovalAction,
  submitRegistrationAction,
  type RegistrationActionState,
} from '@/features/registrations/actions'
import type { RegistrationWithRelations } from '@/features/registrations/types'
import {
  AGE_CLASS_LABELS,
  APPROVAL_STATUS_LABELS,
  COMPETITION_CLASS_LABELS,
  ELIGIBILITY_STATUS_LABELS,
  EXPERIENCE_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  REJECTION_CATEGORY_LABELS,
} from '@/lib/derby/enums'
import type {
  AgeClass,
  CompetitionClass,
  EligibilityStatus,
  ExperienceStatus,
  RejectionCategory,
  RegistrationWorkflowStatus,
  RoosterApprovalStatus,
} from '@/lib/derby/enums'
import { gramsToKg } from '@/lib/derby/enums'
import {
  eligibilityStatusColorPalette,
  registrationWorkflowStatusColorPalette,
} from '@/lib/derby/status-colors'

type RegistrationPermissions = {
  canSubmit: boolean
  canApprove: boolean
  canConditionallyApprove: boolean
  canReject: boolean
  canRevoke: boolean
  canEvaluate: boolean
}

type RegistrationDetailClientProps = {
  eventId: string
  eventName: string
  eventType: string
  registration: RegistrationWithRelations
  permissions: RegistrationPermissions
}

const initialRegistrationState: RegistrationActionState = {}
const initialEligibilityState: EligibilityActionState = {}

function parseEligibilitySnapshot(
  snapshot: Record<string, unknown> | null
): DerbyEligibilityEvaluation | null {
  if (!snapshot || typeof snapshot !== 'object') return null
  if (!Array.isArray(snapshot.checks)) return null
  return snapshot as unknown as DerbyEligibilityEvaluation
}

function checkOutcomeColor(
  outcome: string
): 'green' | 'red' | 'orange' | 'yellow' | 'gray' {
  switch (outcome) {
    case 'pass':
      return 'green'
    case 'fail':
      return 'red'
    case 'approval_required':
      return 'orange'
    case 'pending':
      return 'yellow'
    default:
      return 'gray'
  }
}

function ActionFeedback({ state }: { state: RegistrationActionState | EligibilityActionState }) {
  if (!state.error && !state.success) return null
  return (
    <Text fontSize="sm" color={state.error ? 'red.500' : 'green.600'}>
      {state.error ?? state.success}
    </Text>
  )
}

export function RegistrationDetailClient({
  eventId,
  eventName,
  eventType,
  registration,
  permissions,
}: RegistrationDetailClientProps) {
  const [submitState, submitAction, submitPending] = useActionState(
    submitRegistrationAction,
    initialRegistrationState
  )
  const [approveState, approveAction, approvePending] = useActionState(
    approveRegistrationAction,
    initialRegistrationState
  )
  const [conditionalState, conditionalAction, conditionalPending] = useActionState(
    conditionallyApproveRegistrationAction,
    initialRegistrationState
  )
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectRegistrationAction,
    initialRegistrationState
  )
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeRegistrationApprovalAction,
    initialRegistrationState
  )
  const [evaluateState, evaluateAction, evaluatePending] = useActionState(
    evaluateRegistrationEligibilityAction,
    initialEligibilityState
  )

  const snapshot = parseEligibilitySnapshot(registration.eligibility_snapshot)
  const canSubmit =
    permissions.canSubmit &&
    ['draft', 'pending_documents'].includes(registration.registration_status)
  const canApprove =
    permissions.canApprove &&
    ['submitted', 'pending_review', 'conditionally_approved'].includes(
      registration.registration_status
    )
  const canReject =
    permissions.canReject &&
    !['rejected', 'withdrawn', 'disqualified', 'completed'].includes(
      registration.registration_status
    )
  const canRevoke =
    permissions.canRevoke &&
    ['approved', 'conditionally_approved'].includes(registration.registration_status)

  return (
    <PageStack>
      <PageHeader
        title={`Cock #${registration.cock_number} · ${registration.entry_name}`}
        description={`${eventName} · Band ${registration.band_number}${registration.rooster_code ? ` · ${registration.rooster_code}` : ''}`}
        actions={
          <ButtonGroup>
            <Button asChild size="md" variant="outline">
              <Link href={`/dashboard/events/${eventId}/roosters`}>Back to roosters</Link>
            </Button>
            {eventType === 'derby' ? (
              <Button asChild size="md" variant="outline">
                <Link href={`/dashboard/events/${eventId}/roosters/${registration.id}/print`}>
                  Print slip
                </Link>
              </Button>
            ) : null}
          </ButtonGroup>
        }
      />

      <Flex direction={{ base: 'column', lg: 'row' }} gap={LAYOUT_GAP.section}>
        <Box flex="1">
          <PanelCard title="Registration status">
          <Stack gap={3} fontSize="sm">
            <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
              <Text color="fg.muted">Workflow</Text>
              <Badge
                colorPalette={registrationWorkflowStatusColorPalette(
                  registration.registration_status as RegistrationWorkflowStatus
                )}
              >
                {
                  REGISTRATION_STATUS_LABELS[
                    registration.registration_status as RegistrationWorkflowStatus
                  ]
                }
              </Badge>
            </Flex>
            <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
              <Text color="fg.muted">Approval</Text>
              <Text>
                {APPROVAL_STATUS_LABELS[registration.approval_status as RoosterApprovalStatus]}
              </Text>
            </Flex>
            <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
              <Text color="fg.muted">Eligibility</Text>
              <Badge
                colorPalette={eligibilityStatusColorPalette(
                  registration.eligibility_status as EligibilityStatus
                )}
              >
                {ELIGIBILITY_STATUS_LABELS[registration.eligibility_status as EligibilityStatus]}
              </Badge>
            </Flex>
            <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
              <Text color="fg.muted">Entry</Text>
              <Text>
                #{registration.entry_number} · {registration.owner_name}
              </Text>
            </Flex>
            {registration.official_weight_grams != null ? (
              <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
                <Text color="fg.muted">Official weight</Text>
                <Text>{gramsToKg(registration.official_weight_grams)} kg</Text>
              </Flex>
            ) : null}
          </Stack>
          </PanelCard>
        </Box>

        <Box flex="1">
          <PanelCard title="Rooster profile">
          <Stack gap={3} fontSize="sm">
            {registration.age_class ? (
              <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
                <Text color="fg.muted">Age class</Text>
                <Text>{AGE_CLASS_LABELS[registration.age_class as AgeClass]}</Text>
              </Flex>
            ) : null}
            {registration.competition_class ? (
              <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
                <Text color="fg.muted">Competition class</Text>
                <Text>
                  {COMPETITION_CLASS_LABELS[registration.competition_class as CompetitionClass]}
                </Text>
              </Flex>
            ) : null}
            {registration.calculated_experience_status ? (
              <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
                <Text color="fg.muted">Experience</Text>
                <Text>
                  {
                    EXPERIENCE_STATUS_LABELS[
                      registration.calculated_experience_status as ExperienceStatus
                    ]
                  }
                </Text>
              </Flex>
            ) : null}
            {registration.origin_type ? (
              <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
                <Text color="fg.muted">Origin</Text>
                <Text textTransform="capitalize">
                  {registration.origin_type.replace(/_/g, ' ')}
                </Text>
              </Flex>
            ) : null}
            {registration.registry_rooster_id ? (
              <Button asChild size="sm" variant="outline" alignSelf="flex-start">
                <Link href={`/dashboard/roosters/${registration.registry_rooster_id}`}>
                  View registry rooster
                </Link>
              </Button>
            ) : null}
          </Stack>
          </PanelCard>
        </Box>
      </Flex>

      <PanelCard title="Eligibility checks">
        <Stack gap={LAYOUT_GAP.form}>
          {permissions.canEvaluate ? (
            <form action={evaluateAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="registrationId" value={registration.id} />
              <Button type="submit" size="sm" variant="outline" loading={evaluatePending}>
                Re-evaluate eligibility
              </Button>
              <ActionFeedback state={evaluateState} />
            </form>
          ) : null}

          {!snapshot ? (
            <Text fontSize="sm" color="fg.muted">
              No eligibility evaluation on file. Run re-evaluate to generate checks.
            </Text>
          ) : (
            <Stack gap={2}>
              {snapshot.checks.map((check) => (
                <Flex
                  key={check.check}
                  justify="space-between"
                  gap={4}
                  p={3}
                  borderWidth="1px"
                  borderColor="border"
                  rounded="md"
                  fontSize="sm"
                >
                  <Box>
                    <Text fontWeight="medium" textTransform="capitalize">
                      {check.check.replace(/_/g, ' ')}
                    </Text>
                    <Text color="fg.muted">{check.message}</Text>
                  </Box>
                  <Badge colorPalette={checkOutcomeColor(check.outcome)} size="sm">
                    {check.outcome.replace(/_/g, ' ')}
                  </Badge>
                </Flex>
              ))}
            </Stack>
          )}
        </Stack>
      </PanelCard>

      <PanelCard title="Review actions">
        <Stack gap={LAYOUT_GAP.section}>
          {canSubmit ? (
            <form action={submitAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="registrationId" value={registration.id} />
              <Button type="submit" size="sm" loading={submitPending}>
                Submit for review
              </Button>
              <ActionFeedback state={submitState} />
            </form>
          ) : null}

          {canApprove ? (
            <form action={approveAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="registrationId" value={registration.id} />
              <Stack gap={LAYOUT_GAP.form} maxW="md">
                <FormField label="Approval notes">
                  <Textarea
                    name="approvalNotes"
                    rows={2}
                    maxLength={2000}
                    defaultValue={registration.approval_notes ?? ''}
                  />
                </FormField>
                <Button type="submit" size="sm" colorPalette="green" loading={approvePending}>
                  Approve registration
                </Button>
                <ActionFeedback state={approveState} />
              </Stack>
            </form>
          ) : null}

          {permissions.canConditionallyApprove && canApprove ? (
            <form action={conditionalAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="registrationId" value={registration.id} />
              <Stack gap={LAYOUT_GAP.form} maxW="md">
                <FormField label="Condition" required>
                  <Textarea
                    name="condition"
                    rows={2}
                    maxLength={2000}
                    required
                    defaultValue={registration.conditional_approval_condition ?? ''}
                  />
                </FormField>
                <FormField label="Deadline">
                  <Input
                    name="deadline"
                    type="datetime-local"
                    defaultValue={
                      registration.conditional_approval_deadline
                        ? registration.conditional_approval_deadline.slice(0, 16)
                        : ''
                    }
                  />
                </FormField>
                <Button type="submit" size="sm" variant="outline" loading={conditionalPending}>
                  Conditionally approve
                </Button>
                <ActionFeedback state={conditionalState} />
              </Stack>
            </form>
          ) : null}

          {canReject ? (
            <form action={rejectAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="registrationId" value={registration.id} />
              <Stack gap={LAYOUT_GAP.form} maxW="md">
                <FormField label="Rejection category" required>
                  <NativeSelect.Root>
                    <NativeSelect.Field name="rejectionCategory" defaultValue="">
                      <option value="" disabled>
                        Select category
                      </option>
                      {(
                        Object.entries(REJECTION_CATEGORY_LABELS) as Array<
                          [RejectionCategory, string]
                        >
                      ).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </FormField>
                <FormField label="Rejection reason" required>
                  <Textarea name="rejectionReason" rows={3} maxLength={2000} required />
                </FormField>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  colorPalette="red"
                  loading={rejectPending}
                >
                  Reject registration
                </Button>
                <ActionFeedback state={rejectState} />
              </Stack>
            </form>
          ) : null}

          {canRevoke ? (
            <form action={revokeAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="registrationId" value={registration.id} />
              <Stack gap={LAYOUT_GAP.form} maxW="md">
                <FormField label="Revocation reason" required>
                  <Textarea name="reason" rows={3} maxLength={2000} required />
                </FormField>
                <Button type="submit" size="sm" variant="outline" loading={revokePending}>
                  Revoke approval
                </Button>
                <ActionFeedback state={revokeState} />
              </Stack>
            </form>
          ) : null}

          {!canSubmit && !canApprove && !canReject && !canRevoke ? (
            <Text fontSize="sm" color="fg.muted">
              No review actions available for the current status or your permissions.
            </Text>
          ) : null}
        </Stack>
      </PanelCard>

      <ButtonGroup>
        <Button asChild variant="outline">
          <Link href={`/dashboard/events/${eventId}/registrations`}>
            Back to registrations
          </Link>
        </Button>
      </ButtonGroup>
    </PageStack>
  )
}
