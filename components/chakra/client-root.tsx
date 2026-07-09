'use client'

import { useEffect, useState } from 'react'

import { ChakraAppProvider } from '@/components/chakra/provider'

type ChakraClientRootProps = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ChakraClientRoot({
  children,
  fallback = null,
}: ChakraClientRootProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Mount guard to avoid SSR/client hydration mismatch for Chakra.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{fallback}</>
  }

  return <ChakraAppProvider>{children}</ChakraAppProvider>
}
