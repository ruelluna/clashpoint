'use client'

import { ChakraAppProvider } from '@/components/chakra/provider'

type ChakraAppRootProps = {
  children: React.ReactNode
}

export function ChakraAppRoot({ children }: ChakraAppRootProps) {
  return <ChakraAppProvider>{children}</ChakraAppProvider>
}
