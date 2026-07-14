'use client'

import { createContext, useContext } from 'react'

export type PrintFormat = 'slip' | 'sticker'

const PrintFormatContext = createContext<PrintFormat>('slip')

export function PrintFormatProvider({
  format,
  children,
}: {
  format: PrintFormat
  children: React.ReactNode
}) {
  return (
    <PrintFormatContext.Provider value={format}>{children}</PrintFormatContext.Provider>
  )
}

export function usePrintFormat(): PrintFormat {
  return useContext(PrintFormatContext)
}
