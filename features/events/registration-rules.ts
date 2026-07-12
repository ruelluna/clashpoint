export function parseRegistrationRules(
  formData: FormData,
  isDerby: boolean
): string | null {
  if (!isDerby) return null

  const raw = formData.get('registrationRules')?.toString() ?? ''
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '<p></p>') return null

  return trimmed
}
