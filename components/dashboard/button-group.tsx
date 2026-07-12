import { Flex, type FlexProps } from '@chakra-ui/react'

import { LAYOUT_GAP } from '@/components/dashboard/spacing'

type ButtonGroupProps = FlexProps & {
  children: React.ReactNode
}

export function ButtonGroup({ children, gap = LAYOUT_GAP.buttons, ...props }: ButtonGroupProps) {
  return (
    <Flex gap={gap} wrap="wrap" {...props}>
      {children}
    </Flex>
  )
}
