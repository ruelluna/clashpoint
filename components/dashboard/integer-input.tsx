'use client'

import { Input, type InputProps } from '@chakra-ui/react'

export function IntegerInput(props: InputProps) {
  const { type: _type, inputMode: _inputMode, pattern: _pattern, ...rest } = props

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      {...rest}
    />
  )
}
