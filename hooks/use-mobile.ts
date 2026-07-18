import * as React from 'react'

/** Drawer shell below lg (992px); persistent sidebar at lg+. */
export const COMPACT_SHELL_BREAKPOINT = 992

/**
 * Prefer Chakra responsive props (`display={{ base: 'none', lg: 'block' }}`) over
 * this hook for layout structure — JS viewport branching causes hydration mismatches.
 */
export function useCompactShell() {
  const [isCompact, setIsCompact] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${COMPACT_SHELL_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsCompact(window.innerWidth < COMPACT_SHELL_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    onChange()
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isCompact
}

/** @deprecated Use useCompactShell */
export function useIsMobile() {
  return useCompactShell()
}
