'use client'

import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import { useCallback, useState } from 'react'

import {
  PrintFormatProvider,
  type PrintFormat,
} from '@/features/printing/print-format-context'

type PrintSlipLayoutProps = {
  title: string
  eventName: string
  children: React.ReactNode
  onPrint?: (format: PrintFormat) => void
}

export function PrintSlipLayout({
  title,
  eventName,
  children,
  onPrint,
}: PrintSlipLayoutProps) {
  const [printFormat, setPrintFormat] = useState<PrintFormat>('slip')

  const handlePrint = useCallback(
    (format: PrintFormat) => {
      setPrintFormat(format)

      if (onPrint) {
        onPrint(format)
        return
      }

      const root = document.querySelector('.print-slip-root')
      if (root instanceof HTMLElement) {
        root.dataset.printFormat = format
      }

      const resetFormat = () => {
        if (root instanceof HTMLElement) {
          root.dataset.printFormat = 'slip'
        }
        setPrintFormat('slip')
        window.removeEventListener('afterprint', resetFormat)
      }

      window.addEventListener('afterprint', resetFormat)
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          window.print()
        })
      })
    },
    [onPrint]
  )

  return (
    <PrintFormatProvider format={printFormat}>
      <Stack
        gap={6}
        className="print-slip-root"
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
          maxW="md"
          bg="bg"
          className="print-slip-panel"
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
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-slip-root,
            .print-slip-root * {
              visibility: visible;
            }
            .print-slip-root {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
            .print-slip-only {
              display: block;
            }
            .print-sticker-only {
              display: none;
            }
            .print-slip-root[data-print-format='sticker'] .print-slip-panel {
              width: 50mm;
              max-width: 50mm;
              padding: 2mm;
              border: none;
              border-radius: 0;
            }
            .print-slip-root[data-print-format='sticker'] .print-slip-header,
            .print-slip-root[data-print-format='sticker'] .print-slip-only {
              display: none !important;
            }
            .print-slip-root[data-print-format='sticker'] .print-sticker-only {
              display: block !important;
            }
            .print-slip-root[data-print-format='sticker'] .print-slip-body {
              margin-top: 0;
              gap: 1mm;
            }
            .print-slip-root[data-print-format='sticker'] .print-sticker-line {
              font-size: 8pt;
              line-height: 1.2;
              text-align: center;
            }
            @page {
              size: 50mm 25mm;
              margin: 0;
            }
          }
          @media screen {
            .print-sticker-only {
              display: none;
            }
          }
        `}</style>
      </Stack>
    </PrintFormatProvider>
  )
}
