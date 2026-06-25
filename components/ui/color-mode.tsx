'use client'

import type { ThemeProviderProps } from 'next-themes'
import { ThemeProvider, useTheme } from 'next-themes'

export type ColorModeProviderProps = ThemeProviderProps

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      disableTransitionOnChange
      defaultTheme="system"
      enableSystem
      {...props}
    />
  )
}

export function useColorMode() {
  const { resolvedTheme, setTheme } = useTheme()

  const toggleColorMode = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return {
    colorMode: resolvedTheme,
    setColorMode: setTheme,
    toggleColorMode,
  }
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode()
  return colorMode === 'dark' ? dark : light
}

export function LightMode(props: React.ComponentProps<'div'>) {
  return (
    <div className="light" style={{ colorScheme: 'light' }} {...props} />
  )
}

export function DarkMode(props: React.ComponentProps<'div'>) {
  return (
    <div className="dark" style={{ colorScheme: 'dark' }} {...props} />
  )
}
