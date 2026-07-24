'use client'

import { usePrintFormat, type PrintFormat } from '@/features/printing/print-format-context'

type PrintFormatSectionProps = {
  when: PrintFormat
  children: React.ReactNode
}

export function PrintFormatSection({ when, children }: PrintFormatSectionProps) {
  const format = usePrintFormat()
  if (format !== when) return null
  return children
}
