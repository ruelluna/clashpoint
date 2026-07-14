'use client'

import { Box } from '@chakra-ui/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'

type BarcodeLabelProps = {
  value: string
  size?: 'default' | 'compact' | 'sticker'
}

const HEIGHT_BY_SIZE = {
  default: 60,
  compact: 48,
  sticker: 28,
} as const

export function BarcodeLabel({ value, size = 'default' }: BarcodeLabelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [barWidth, setBarWidth] = useState(2)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateBarWidth = () => {
      const width = container.clientWidth
      if (width <= 0) return
      const estimatedModules = Math.max(value.length * 11, 60)
      const nextWidth = Math.min(2.5, Math.max(1, (width - 16) / estimatedModules))
      setBarWidth(Number(nextWidth.toFixed(2)))
    }

    updateBarWidth()
    const observer = new ResizeObserver(updateBarWidth)
    observer.observe(container)
    return () => observer.disconnect()
  }, [value])

  useEffect(() => {
    if (!svgRef.current || !value) return
    JsBarcode(svgRef.current, value, {
      format: 'CODE128',
      displayValue: true,
      fontSize: size === 'sticker' ? 10 : 14,
      height: HEIGHT_BY_SIZE[size],
      margin: size === 'sticker' ? 2 : 8,
      width: barWidth,
    })
  }, [value, size, barWidth])

  return (
    <Box
      ref={containerRef}
      width="100%"
      overflow="hidden"
      display="flex"
      justifyContent="center"
      className="barcode-label"
      css={{
        '& svg': {
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          marginInline: 'auto',
        },
      }}
    >
      <svg ref={svgRef} />
    </Box>
  )
}
