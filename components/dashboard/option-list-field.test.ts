import { describe, expect, it, vi } from 'vitest'

function normalizeValue(value: string, inputType: 'text' | 'number'): string {
  return inputType === 'number' ? String(Number.parseInt(value, 10)) : value.trim()
}

function addOption(values: string[], rawValue: string, inputType: 'text' | 'number' = 'text') {
  const nextValue = normalizeValue(rawValue, inputType)
  if (!nextValue || nextValue === 'NaN') return values
  if (values.includes(nextValue)) return values
  return [...values, nextValue]
}

describe('OptionListField option handling', () => {
  it('adds a trimmed preset value', () => {
    expect(addOption([], '  stag  ')).toEqual(['stag'])
  })

  it('deduplicates preset values', () => {
    expect(addOption(['stag'], 'stag')).toEqual(['stag'])
  })

  it('parses numeric preset values', () => {
    expect(addOption([], '2026', 'number')).toEqual(['2026'])
  })

  it('ignores invalid numeric preset values', () => {
    expect(addOption([], 'abc', 'number')).toEqual([])
  })
})

describe('parseRegistrationRules', () => {
  it('treats empty rich text as null', async () => {
    const { parseRegistrationRules } = await import('@/features/events/registration-rules')

    const formData = new FormData()
    formData.set('registrationRules', '<p></p>')
    expect(parseRegistrationRules(formData, true)).toBeNull()
  })

  it('keeps formatted rich text html', async () => {
    const { parseRegistrationRules } = await import('@/features/events/registration-rules')

    const formData = new FormData()
    formData.set('registrationRules', '<p><strong>Rule</strong></p>')
    expect(parseRegistrationRules(formData, true)).toBe('<p><strong>Rule</strong></p>')
  })
})
