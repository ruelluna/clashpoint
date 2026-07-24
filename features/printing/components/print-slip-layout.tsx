'use client'

import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import { useCallback, useState } from 'react'
import { flushSync } from 'react-dom'

import {
  PrintFormatProvider,
  type PrintFormat,
} from '@/features/printing/print-format-context'

type PrintSlipLayoutProps = {
  title: string
  eventName: string
  /** Center full slip on 100×150 mm label paper, landscape (barcode slips only). */
  labelSizedSlip?: boolean
  children: React.ReactNode
  onPrint?: (format: PrintFormat) => void
}

function setDocumentPrintFormat(format: PrintFormat | null) {
  if (format) {
    document.documentElement.dataset.printFormat = format
  } else {
    delete document.documentElement.dataset.printFormat
  }
}

function setDocumentLabelPrint(active: boolean) {
  if (active) {
    document.documentElement.dataset.labelPrint = 'true'
  } else {
    delete document.documentElement.dataset.labelPrint
  }
}

function usesLabelPrint(format: PrintFormat, labelSizedSlip: boolean) {
  return format === 'sticker' || (format === 'slip' && labelSizedSlip)
}

function waitForBarcodeThenPrint(root: Element | null, print: () => void) {
  let attempts = 0
  const maxAttempts = 60

  const tryPrint = () => {
    attempts += 1
    const svgs = root?.querySelectorAll('.barcode-label svg') ?? []
    const barcodesReady =
      svgs.length === 0 ||
      [...svgs].every((svg) => svg.childElementCount > 0)

    if (barcodesReady || attempts >= maxAttempts) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(print)
      })
      return
    }

    window.requestAnimationFrame(tryPrint)
  }

  window.requestAnimationFrame(tryPrint)
}

export function PrintSlipLayout({
  title,
  eventName,
  labelSizedSlip = false,
  children,
  onPrint,
}: PrintSlipLayoutProps) {
  const [printFormat, setPrintFormat] = useState<PrintFormat>('slip')

  const handlePrint = useCallback(
    (format: PrintFormat) => {
      if (onPrint) {
        flushSync(() => setPrintFormat(format))
        onPrint(format)
        return
      }

      flushSync(() => setPrintFormat(format))

      const root = document.querySelector('.print-slip-root')
      if (root instanceof HTMLElement) {
        root.dataset.printFormat = format
      }
      setDocumentPrintFormat(format)
      setDocumentLabelPrint(usesLabelPrint(format, labelSizedSlip))

      const resetFormat = () => {
        if (root instanceof HTMLElement) {
          root.dataset.printFormat = 'slip'
        }
        setDocumentPrintFormat(null)
        setDocumentLabelPrint(false)
        setPrintFormat('slip')
        window.removeEventListener('afterprint', resetFormat)
      }

      window.addEventListener('afterprint', resetFormat)

      waitForBarcodeThenPrint(root, () => {
        window.print()
      })
    },
    [onPrint, labelSizedSlip]
  )

  const rootClassName = labelSizedSlip
    ? 'print-slip-root print-slip-label-sized'
    : 'print-slip-root'

  return (
    <PrintFormatProvider format={printFormat}>
      <Stack
        gap={6}
        className={rootClassName}
        data-print-format={printFormat}
      >
        <Flex gap={2} className="no-print" wrap="wrap">
          <Button onClick={() => handlePrint('slip')}>Print slip</Button>
          <Button variant="outline" onClick={() => handlePrint('sticker')}>
            Print sticker
          </Button>
        </Flex>
        <Box
          borderWidth="1px"
          borderColor="border"
          rounded="lg"
          p={6}
          bg="bg"
          className="print-slip-panel"
          css={{
            '@media screen': {
              maxWidth: 'md',
            },
          }}
        >
          <Box className="print-slip-header">
            <Text
              fontSize="xs"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              {title}
            </Text>
            <Text fontWeight="semibold" mt={1}>
              {eventName}
            </Text>
          </Box>
          <Stack gap={4} mt={4} className="print-slip-body">
            {children}
          </Stack>
        </Box>
      </Stack>
    </PrintFormatProvider>
  )
}
