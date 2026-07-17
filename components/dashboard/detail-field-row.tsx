import { Box, Flex, Text, type FlexProps } from '@chakra-ui/react'

import { LAYOUT_GAP } from '@/components/dashboard/spacing'

type DetailFieldRowProps = FlexProps & {
  label: string
  children: React.ReactNode
}

export function DetailFieldRow({ label, children, ...props }: DetailFieldRowProps) {
  return (
    <Flex
      gap={LAYOUT_GAP.form}
      direction={{ base: 'column', sm: 'row' }}
      align={{ sm: 'flex-start' }}
      fontSize="sm"
      {...props}
    >
      <Text color="fg.muted" flexShrink={0} minW={{ sm: '10rem' }}>
        {label}
      </Text>
      <Box flex="1">{children}</Box>
    </Flex>
  )
}
