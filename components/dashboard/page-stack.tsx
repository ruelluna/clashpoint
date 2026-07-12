import { Stack, type StackProps } from '@chakra-ui/react'

import { LAYOUT_GAP } from '@/components/dashboard/spacing'

type PageStackProps = StackProps & {
  children: React.ReactNode
}

export function PageStack({ children, gap = LAYOUT_GAP.page, ...props }: PageStackProps) {
  return (
    <Stack gap={gap} {...props}>
      {children}
    </Stack>
  )
}
