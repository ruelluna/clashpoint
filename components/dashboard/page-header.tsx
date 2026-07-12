import { Box, Flex, Text } from '@chakra-ui/react'

import { LAYOUT_GAP } from '@/components/dashboard/spacing'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Flex
      justify="space-between"
      align={{ base: 'stretch', sm: 'center' }}
      direction={{ base: 'column', sm: 'row' }}
      gap={LAYOUT_GAP.buttons}
    >
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          {title}
        </Text>
        {description ? <Text color="fg.muted">{description}</Text> : null}
      </Box>
      {actions}
    </Flex>
  )
}
