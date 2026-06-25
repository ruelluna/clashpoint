'use client'

import { ChakraProvider, defaultSystem } from '@chakra-ui/react'

import { ColorModeProvider } from '@/components/ui/color-mode'

type ChakraAppProviderProps = {
  children: React.ReactNode
}

export function ChakraAppProvider({ children }: ChakraAppProviderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider>{children}</ColorModeProvider>
    </ChakraProvider>
  )
}
