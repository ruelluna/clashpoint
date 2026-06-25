'use client'

import { ClientOnly, Icon, IconButton, Skeleton } from '@chakra-ui/react'
import { MoonIcon, SunIcon } from 'lucide-react'

import { useColorMode } from '@/components/ui/color-mode'

export function ColorModeButton() {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <ClientOnly fallback={<Skeleton boxSize="8" rounded="lg" />}>
      <IconButton
        aria-label="Toggle color mode"
        onClick={toggleColorMode}
        variant="ghost"
        size="sm"
      >
        <Icon asChild boxSize={4}>
          {colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Icon>
      </IconButton>
    </ClientOnly>
  )
}
