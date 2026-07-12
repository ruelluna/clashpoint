import type { ExperienceStatus } from '@/lib/derby/enums'

export type FightExperienceInput = {
  totalFights: number
  wins: number
}

export function calculateExperienceFromFights(
  input: FightExperienceInput
): ExperienceStatus {
  const { totalFights, wins } = input

  if (totalFights <= 0) return 'maiden'

  if (wins <= 0) return 'winless'
  if (wins === 1) return 'one_time_winner'
  if (wins === 2) return 'two_time_winner'
  return 'multi_winner'
}

export function resolveEffectiveExperienceStatus(input: {
  calculated: ExperienceStatus
  declaredExternal: ExperienceStatus | null | undefined
  externalVerified: boolean
}): ExperienceStatus {
  if (
    input.declaredExternal &&
    input.declaredExternal !== 'unknown' &&
    input.externalVerified
  ) {
    return input.declaredExternal
  }

  if (input.calculated !== 'unknown') {
    return input.calculated
  }

  return input.declaredExternal ?? 'unknown'
}
