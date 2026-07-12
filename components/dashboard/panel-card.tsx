import { Card, Text } from '@chakra-ui/react'

import { LAYOUT_GAP } from '@/components/dashboard/spacing'

type PanelCardProps = {
  title?: string
  children: React.ReactNode
  flush?: boolean
}

export function PanelCard({ title, children, flush = false }: PanelCardProps) {
  return (
    <Card.Root overflow={flush ? 'hidden' : undefined}>
      <Card.Body p={flush ? 0 : LAYOUT_GAP.cardPadding}>
        {title ? (
          <Text fontWeight="medium" mb={LAYOUT_GAP.cardTitle} px={flush ? LAYOUT_GAP.cardPadding : 0} pt={flush ? LAYOUT_GAP.cardPadding : 0}>
            {title}
          </Text>
        ) : null}
        {children}
      </Card.Body>
    </Card.Root>
  )
}
