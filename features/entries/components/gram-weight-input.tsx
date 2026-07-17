'use client'

import { Input, type InputProps } from '@chakra-ui/react'

import { clampGramWeightDigits } from '@/features/entries/weight-input-utils'

function syncGramWeightInput(event: React.FormEvent<HTMLInputElement>) {
  const input = event.currentTarget
  const clamped = clampGramWeightDigits(input.value)
  if (input.value !== clamped) {
    input.value = clamped
  }
}

export function GramWeightInput(props: InputProps) {
  const { onInput, type: _type, inputMode: _inputMode, ...rest } = props

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={4}
      {...rest}
      onInput={(event) => {
        syncGramWeightInput(event)
        onInput?.(event)
      }}
    />
  )
}
