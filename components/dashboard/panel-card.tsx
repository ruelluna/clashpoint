import { Card, Text } from '@chakra-ui/react'

import { LAYOUT_GAP } from '@/components/dashboard/spacing'

type PanelCardProps = {
  title?: string
  children: React.ReactNode
}

export function PanelCard({ title, children }: PanelCardProps) {
  return (
    <Card.Root>
      <Card.Body p={LAYOUT_GAP.cardPadding}>
        {title ? (
          <Text fontWeight="medium" mb={LAYOUT_GAP.cardTitle}>
            {title}
          </Text>
        ) : null}
        {children}
      </Card.Body>
    </Card.Root>
  )
}
