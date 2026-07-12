'use client'

import { Badge, Box, Button, Flex, Input, NativeSelect, Text } from '@chakra-ui/react'
import { useState } from 'react'

import type { EligibilityOptionPreset } from '@/lib/derby/eligibility-fields'

type OptionListFieldProps = {
  name: string
  label: string
  helpText?: string
  values: string[]
  onChange: (values: string[]) => void
  presets?: EligibilityOptionPreset[]
  placeholder?: string
  inputType?: 'text' | 'number'
}

function normalizeValue(value: string, inputType: 'text' | 'number'): string {
  return inputType === 'number' ? String(Number.parseInt(value, 10)) : value.trim()
}

export function OptionListField({
  name,
  label,
  helpText,
  values,
  onChange,
  presets = [],
  placeholder = 'Add option',
  inputType = 'text',
}: OptionListFieldProps) {
  const [draft, setDraft] = useState('')
  const [presetResetKey, setPresetResetKey] = useState(0)

  function addValue(rawValue: string) {
    const nextValue = normalizeValue(rawValue, inputType)
    if (!nextValue || nextValue === 'NaN') return
    if (values.includes(nextValue)) return
    onChange([...values, nextValue])
    setDraft('')
  }

  function removeValue(value: string) {
    onChange(values.filter((item) => item !== value))
  }

  const presetLabelByValue = new Map(presets.map((preset) => [preset.value, preset.label]))

  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" mb={1}>
        {label}
      </Text>
      {helpText ? (
        <Text fontSize="xs" color="fg.muted" mb={2}>
          {helpText}
        </Text>
      ) : null}

      {values.map((value) => (
        <input key={`${name}-${value}`} type="hidden" name={name} value={value} />
      ))}

      <Flex gap={2} wrap="wrap" mb={2}>
        {values.map((value) => (
          <Badge key={value} display="inline-flex" alignItems="center" gap={1}>
            {presetLabelByValue.get(value) ?? value}
            <Button
              type="button"
              size="2xs"
              variant="ghost"
              aria-label={`Remove ${value}`}
              onClick={() => removeValue(value)}
            >
              ×
            </Button>
          </Badge>
        ))}
        {values.length === 0 ? (
          <Text fontSize="xs" color="fg.muted">
            No options added yet.
          </Text>
        ) : null}
      </Flex>

      <Flex gap={2} wrap="wrap" align="center">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          type={inputType}
          maxW="xs"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addValue(draft)
            }
          }}
        />
        <Button type="button" size="sm" variant="outline" onClick={() => addValue(draft)}>
          Add
        </Button>
        {presets.length > 0 ? (
          <NativeSelect.Root maxW="xs" key={`${name}-preset-${presetResetKey}`}>
            <NativeSelect.Field
              defaultValue=""
              onChange={(event) => {
                const value = event.currentTarget.value
                if (!value) return
                addValue(value)
                setPresetResetKey((current) => current + 1)
              }}
            >
              <option value="">Add preset…</option>
              {presets
                .filter((preset) => !values.includes(preset.value))
                .map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        ) : null}
      </Flex>
    </Box>
  )
}
