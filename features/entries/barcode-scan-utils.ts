const CANONICAL_PREFIXES = ['OWN-', 'COCK-', 'BET-'] as const

const SHORT_OWNER_RE = /^O\d{4}$/
const SHORT_COCK_RE = /^C\d{4}$/
const SHORT_BET_RE = /^B\d{4}[MW]$/

export type ClashPointBarcodeKind = 'owner' | 'cock' | 'bet'

export function normalizeScanInput(value: string): string {
  return value.trim()
}

export function normalizeBarcodeValue(value: string): string {
  return normalizeScanInput(value).toUpperCase()
}

export function detectClashPointBarcodeKind(
  value: string
): ClashPointBarcodeKind | null {
  const upper = normalizeBarcodeValue(value)
  if (!upper) return null

  if (SHORT_OWNER_RE.test(upper)) return 'owner'
  if (SHORT_COCK_RE.test(upper)) return 'cock'
  if (SHORT_BET_RE.test(upper)) return 'bet'

  if (upper.startsWith('OWN-')) return 'owner'
  if (upper.startsWith('COCK-')) return 'cock'
  if (upper.startsWith('BET-')) return 'bet'

  return null
}

export function looksLikeClashPointBarcode(
  value: string,
  minCanonicalLength = 8
): boolean {
  const trimmed = normalizeScanInput(value)
  if (!trimmed) return false

  const upper = normalizeBarcodeValue(trimmed)
  if (
    SHORT_OWNER_RE.test(upper) ||
    SHORT_COCK_RE.test(upper) ||
    SHORT_BET_RE.test(upper)
  ) {
    return true
  }

  if (trimmed.length < minCanonicalLength) return false
  return CANONICAL_PREFIXES.some((prefix) => upper.startsWith(prefix))
}

export function shouldIdleSubmitBarcode(
  value: string,
  minCanonicalLength = 8
): boolean {
  return looksLikeClashPointBarcode(value, minCanonicalLength)
}

export type ScanSubmitOutcome = 'success' | 'error'

export function resolveScanValueFromInput(inputValue: string): string {
  return normalizeScanInput(inputValue)
}
