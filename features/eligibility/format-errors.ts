import type { DerbyEligibilityEvaluation } from '@/features/eligibility/types'

export function formatEligibilityErrors(evaluation: DerbyEligibilityEvaluation): string {
  const failedChecks = evaluation.checks.filter((check) => check.outcome === 'fail')
  if (failedChecks.length === 0) {
    return 'This rooster does not meet the event eligibility rules.'
  }

  return failedChecks.map((check) => check.message).join('\n')
}
