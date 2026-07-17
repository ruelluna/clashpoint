export const GRAM_WEIGHT_MAX_DIGITS = 4

export function clampGramWeightDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, GRAM_WEIGHT_MAX_DIGITS)
}
