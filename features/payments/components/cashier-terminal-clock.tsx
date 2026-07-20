'use client'

import { Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

import { formatEventDateTimeNow } from '@/lib/format/datetime'

type CashierTerminalClockProps = {
  label?: string
}

export function CashierTerminalClock({ label = 'Philippines time' }: CashierTerminalClockProps) {
  const [now, setNow] = useState(() => formatEventDateTimeNow())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(formatEventDateTimeNow())
    }, 30_000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <Text fontSize="sm" color="fg.muted" data-testid="cashier-terminal-clock">
      {label}: {now}
    </Text>
  )
}
