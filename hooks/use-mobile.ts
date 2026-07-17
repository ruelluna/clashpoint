import * as React from 'react'

/** Drawer shell below lg (992px); persistent sidebar at lg+. */
export const COMPACT_SHELL_BREAKPOINT = 992

export function useCompactShell() {
  const [isCompact, setIsCompact] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${COMPACT_SHELL_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsCompact(window.innerWidth < COMPACT_SHELL_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCompact(window.innerWidth < COMPACT_SHELL_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isCompact
}

/** @deprecated Use useCompactShell */
export function useIsMobile() {
  return useCompactShell()
}
