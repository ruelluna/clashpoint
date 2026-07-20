'use client'

import { ChakraAppProvider } from '@/components/chakra/provider'
import { Toaster } from '@/components/ui/toaster'

type ChakraAppRootProps = {
  children: React.ReactNode
}

export function ChakraAppRoot({ children }: ChakraAppRootProps) {
  return (
    <ChakraAppProvider>
      {children}
      <Toaster />
    </ChakraAppProvider>
  )
}
