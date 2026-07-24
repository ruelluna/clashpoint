'use client'

import { Box } from '@chakra-ui/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'

import {
  STICKER_BARCODE_HEIGHT_PX,
  STICKER_BARCODE_WIDTH_FRACTION,
} from '@/features/printing/label-sizes'

type BarcodeLabelProps = {
  value: string
  size?: 'default' | 'compact' | 'sticker' | 'micro'
}

const HEIGHT_BY_SIZE = {
  default: 60,
  compact: 48,
  sticker: 56,
  micro: STICKER_BARCODE_HEIGHT_PX,
} as const

function estimateCode128Modules(value: string): number {
  return 35 + value.length * 11
}

export function BarcodeLabel({ value, size = 'default' }: BarcodeLabelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [barWidth, setBarWidth] = useState(2)
  const isMicro = size === 'micro'

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateBarWidth = () => {
      const width = container.clientWidth
      if (width <= 0) return
      const layoutWidth = isMicro ? width * STICKER_BARCODE_WIDTH_FRACTION : width
      const estimatedModules = estimateCode128Modules(value)
      const maxBarWidth = isMicro ? 3 : 2.5
      const minBarWidth = isMicro ? 1.25 : 1
      const nextWidth = Math.min(
        maxBarWidth,
        Math.max(minBarWidth, (layoutWidth - 8) / estimatedModules)
      )
      setBarWidth(Number(nextWidth.toFixed(2)))
    }

    updateBarWidth()
    const observer = new ResizeObserver(updateBarWidth)
    observer.observe(container)
    return () => observer.disconnect()
  }, [value, isMicro])

  useEffect(() => {
    if (!svgRef.current || !value) return
    const displayValue = !isMicro
    JsBarcode(svgRef.current, value, {
      format: 'CODE128',
      displayValue,
      fontSize: size === 'sticker' ? 12 : isMicro ? 7 : 14,
      height: HEIGHT_BY_SIZE[size],
      margin: isMicro ? 1 : size === 'sticker' ? 4 : 8,
      lineColor: '#000000',
      width: barWidth,
    })
  }, [value, size, barWidth, isMicro])

  return (
    <Box
      ref={containerRef}
      width="100%"
      overflow="hidden"
      display="flex"
      justifyContent="center"
      className="barcode-label"
      data-barcode-size={size}
      css={{
        '& svg': {
          display: 'block',
          maxWidth: isMicro ? `${STICKER_BARCODE_WIDTH_FRACTION * 100}%` : '100%',
          width: isMicro ? 'auto' : '100%',
          height: 'auto',
          marginInline: 'auto',
        },
      }}
    >
      <svg ref={svgRef} />
    </Box>
  )
}
