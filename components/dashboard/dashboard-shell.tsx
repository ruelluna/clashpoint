'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Drawer,
  Flex,
  Icon,
  IconButton,
  Separator,
  Text,
} from '@chakra-ui/react'
import { PanelLeftIcon } from 'lucide-react'

import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { ColorModeButton } from '@/components/ui/color-mode-button'
import { useIsMobile } from '@/hooks/use-mobile'

const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_COLLAPSED = '4rem'

type DashboardShellProps = {
  displayName: string
  avatarUrl?: string | null
  permissionIds: string[]
  children: React.ReactNode
}

export function DashboardShell({
  displayName,
  avatarUrl,
  permissionIds,
  children,
}: DashboardShellProps) {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('dashboard-sidebar-collapsed')
    if (stored === 'true') {
      // Restore persisted preference from localStorage after mount (SSR-safe).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(true)
    }
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('dashboard-sidebar-collapsed', String(next))
      return next
    })
  }

  const sidebar = (
    <AppSidebar
      displayName={displayName}
      avatarUrl={avatarUrl}
      collapsed={isMobile ? false : collapsed}
      permissionIds={permissionIds}
    />
  )

  return (
    <Flex minH="100vh" bg="bg">
      {!isMobile ? (
        <Box
          as="aside"
          width={collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH}
          flexShrink={0}
          borderRightWidth="1px"
          borderColor="border"
          transition="width 0.2s"
          overflowX="hidden"
          overflowY="auto"
        >
          {sidebar}
        </Box>
      ) : (
        <Drawer.Root
          open={mobileOpen}
          onOpenChange={(details) => setMobileOpen(details.open)}
          placement="start"
          size="xs"
        >
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content p={0} maxW={SIDEBAR_WIDTH}>
              <Drawer.Body p={0}>{sidebar}</Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Drawer.Root>
      )}

      <Flex direction="column" flex="1" minW={0}>
        <Flex
          as="header"
          align="center"
          gap={2}
          height="3.5rem"
          px={4}
          borderBottomWidth="1px"
          borderColor="border"
          flexShrink={0}
        >
          <IconButton
            aria-label="Toggle sidebar"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isMobile) {
                setMobileOpen(true)
              } else {
                toggleCollapsed()
              }
            }}
          >
            <Icon asChild boxSize={4}>
              <PanelLeftIcon />
            </Icon>
          </IconButton>
          <Separator orientation="vertical" height={4} />
          <Text fontSize="sm" fontWeight="medium" color="fg.muted">
            Dashboard
          </Text>
          <Box ml="auto">
            <ColorModeButton />
          </Box>
        </Flex>

        <Box as="main" flex="1" p={6}>
          {children}
        </Box>
      </Flex>
    </Flex>
  )
}
