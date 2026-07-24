'use client'

import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import { useCallback, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import {
  printCompactLabel,
  printWithClearedTitle,
} from '@/features/printing/print-compact-label'
import {
  PrintFormatProvider,
  type PrintFormat,
} from '@/features/printing/print-format-context'

type PrintSlipLayoutProps = {
  title: string
  eventName: string
  /** Center full slip on 100×150 mm label paper (barcode slips only). */
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

function setDocumentStickerPrint(active: boolean) {
  if (active) {
    document.documentElement.dataset.stickerPrint = 'true'
  } else {
    delete document.documentElement.dataset.stickerPrint
  }
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
  const rootRef = useRef<HTMLDivElement>(null)

  const handlePrint = useCallback(
    (format: PrintFormat) => {
      if (onPrint) {
        flushSync(() => setPrintFormat(format))
        onPrint(format)
        return
      }

      flushSync(() => setPrintFormat(format))

      const root = rootRef.current
      const panel = root?.querySelector('.print-slip-panel')
      if (root instanceof HTMLElement) {
        root.dataset.printFormat = format
      }
      setDocumentPrintFormat(format)
      setDocumentLabelPrint(format === 'slip' && labelSizedSlip)
      setDocumentStickerPrint(format === 'sticker' && labelSizedSlip)

      const resetFormat = () => {
        if (root instanceof HTMLElement) {
          root.dataset.printFormat = 'slip'
        }
        setDocumentPrintFormat(null)
        setDocumentLabelPrint(false)
        setDocumentStickerPrint(false)
        setPrintFormat('slip')
        window.removeEventListener('afterprint', resetFormat)
      }

      window.addEventListener('afterprint', resetFormat)

      if (format === 'sticker' && labelSizedSlip && panel instanceof HTMLElement) {
        waitForBarcodeThenPrint(root, () => {
          void printCompactLabel(panel)
            .catch(() => {
              printWithClearedTitle(() => window.print())
            })
            .finally(resetFormat)
        })
        return
      }

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
        ref={rootRef}
        gap={6}
        className={rootClassName}
        data-print-format={printFormat}
      >
        <Stack gap={1} className="no-print">
          <Flex gap={2} wrap="wrap">
            <Button onClick={() => handlePrint('slip')}>Print slip</Button>
            <Button variant="outline" onClick={() => handlePrint('sticker')}>
              Print sticker
            </Button>
          </Flex>
          {labelSizedSlip ? (
            <Text fontSize="xs" color="fg.muted">
              If a URL appears on sticker print, disable Headers and footers in
              the print dialog.
            </Text>
          ) : null}
        </Stack>
        <Box
          borderWidth="1px"
          borderColor="border"
          rounded="lg"
          p={6}
          bg="bg"
          className="print-slip-panel"
          css={{
            '@media screen': {
              maxWidth: printFormat === 'sticker' && labelSizedSlip ? undefined : 'md',
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
