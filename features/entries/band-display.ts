export function resolveRegistrationBandNumber(input: {
  bandNumber?: string | null
  entryId: string
  cockNumber: number
}): string {
  const trimmed = input.bandNumber?.trim() ?? ''
  if (trimmed) return trimmed

  const entryToken = input.entryId.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `NB-${entryToken}-${input.cockNumber}`
}

export function isInternalRegistrationBand(bandNumber: string | null | undefined): boolean {
  return Boolean(bandNumber?.trim().startsWith('NB-'))
}

export function formatBandNumberForDisplay(bandNumber: string | null | undefined): string {
  if (!bandNumber?.trim()) return '—'
  if (isInternalRegistrationBand(bandNumber)) return '—'
  return bandNumber
}
