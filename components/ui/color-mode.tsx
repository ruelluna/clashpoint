'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'theme'

type ThemeSetting = 'light' | 'dark' | 'system'
type ColorMode = 'light' | 'dark'

type ColorModeContextValue = {
  colorMode: ColorMode | undefined
  setColorMode: (theme: ThemeSetting | ColorMode) => void
  toggleColorMode: () => void
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null)

function getSystemColorMode(): ColorMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function resolveTheme(theme: ThemeSetting): ColorMode {
  return theme === 'system' ? getSystemColorMode() : theme
}

function applyColorMode(resolved: ColorMode) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  root.style.colorScheme = resolved
}

function readStoredTheme(): ThemeSetting {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    // ignore storage errors
  }
  return 'system'
}

export type ColorModeProviderProps = {
  children: React.ReactNode
}

export function ColorModeProvider({ children }: ColorModeProviderProps) {
  const [colorMode, setColorModeState] = useState<ColorMode | undefined>(
    undefined
  )

  useEffect(() => {
    const stored = readStoredTheme()
    const resolved = resolveTheme(stored)
    applyColorMode(resolved)
    // Sync initial theme from storage/system after mount (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColorModeState(resolved)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (readStoredTheme() === 'system') {
        const next = getSystemColorMode()
        applyColorMode(next)
        setColorModeState(next)
      }
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const setColorMode = useCallback((next: ThemeSetting | ColorMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore storage errors
    }
    const resolved = resolveTheme(next)
    applyColorMode(resolved)
    setColorModeState(resolved)
  }, [])

  const toggleColorMode = useCallback(() => {
    const current = colorMode ?? resolveTheme(readStoredTheme())
    setColorMode(current === 'dark' ? 'light' : 'dark')
  }, [colorMode, setColorMode])

  const value = useMemo(
    () => ({ colorMode, setColorMode, toggleColorMode }),
    [colorMode, setColorMode, toggleColorMode]
  )

  return (
    <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>
  )
}

export function useColorMode() {
  const context = useContext(ColorModeContext)
  if (!context) {
    throw new Error('useColorMode must be used within ColorModeProvider')
  }
  return context
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
