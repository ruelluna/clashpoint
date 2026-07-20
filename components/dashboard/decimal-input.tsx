'use client'

import { Input, type InputProps } from '@chakra-ui/react'

export function DecimalInput(props: InputProps) {
  const { type: _type, inputMode: _inputMode, min, step, ...rest } = props

  return (
    <Input
      type="number"
      inputMode="decimal"
      min={min ?? '0'}
      step={step ?? '0.01'}
      {...rest}
    />
  )
}
