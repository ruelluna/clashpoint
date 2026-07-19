'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Popover,
  Text,
  Tooltip,
} from '@chakra-ui/react'
import { Calendar, LayoutDashboard, LogOutIcon } from 'lucide-react'

import { signOutAction } from '@/features/auth/actions'
import {
  activeEventNavHref,
  dashboardNavItemConfigs,
  filterNavItemsByPermissions,
  isDashboardNavItemActive,
  prependActiveEventNavItem,
  type ActiveEventNavConfig,
} from '@/lib/dashboard/nav'
import {
  dashboardNavIconsByHref,
  type DashboardNavItem,
} from '@/lib/dashboard/nav-icons'

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

function buildNavItems(
  permissionIds: string[],
  activeEvent?: ActiveEventNavConfig | null
): DashboardNavItem[] {
  const filtered = filterNavItemsByPermissions(
    dashboardNavItemConfigs,
    permissionIds
  )
  const withActive = prependActiveEventNavItem(
    filtered,
    activeEvent,
    permissionIds
  )

  return withActive.map((item) => {
    const isActiveEventItem =
      activeEvent != null && item.href === activeEventNavHref(activeEvent.id)

    return {
      ...item,
      icon: isActiveEventItem
        ? Calendar
        : (dashboardNavIconsByHref[item.href] ?? LayoutDashboard),
    }
  })
}

type AppSidebarProps = {
  displayName: string
  avatarUrl?: string | null
  collapsed: boolean
  permissionIds: string[]
  activeEvent?: ActiveEventNavConfig | null
  onNavigate?: () => void
}

function NavItem({
  collapsed,
  label,
  href,
  icon: NavIcon,
  isActive,
  disabled,
  badge,
  onNavigate,
}: {
  collapsed: boolean
  label: string
  href: string
  icon: DashboardNavItem['icon']
  isActive?: boolean
  disabled?: boolean
  badge?: string
  onNavigate?: () => void
}) {
  const button = disabled ? (
    <Button
      variant="ghost"
      width="full"
      justifyContent="flex-start"
      disabled
      px={3}
      opacity={0.5}
    >
      <Icon asChild boxSize={4}>
        <NavIcon />
      </Icon>
      <Text flex="1" textAlign="left">
        {label}
      </Text>
      {badge ? (
        <Badge size="sm" variant="subtle">
          {badge}
        </Badge>
      ) : null}
    </Button>
  ) : (
    <Button
      asChild
      variant={isActive ? 'subtle' : 'ghost'}
      width="full"
      justifyContent="flex-start"
      px={3}
      colorPalette={isActive ? 'blue' : 'gray'}
    >
      <Link href={href} onClick={onNavigate}>
        <Icon asChild boxSize={4}>
          <NavIcon />
        </Icon>
        <Text flex="1" truncate>
          {label}
        </Text>
        {badge ? (
          <Badge size="sm" variant="subtle" colorPalette="blue">
            {badge}
          </Badge>
        ) : null}
      </Link>
    </Button>
  )

  if (collapsed) {
    const iconControl = disabled ? (
      <IconButton
        variant="ghost"
        size="sm"
        disabled
        opacity={0.5}
        aria-label={label}
      >
        <Icon asChild boxSize={4}>
          <NavIcon />
        </Icon>
      </IconButton>
    ) : (
      <IconButton
        asChild
        variant={isActive ? 'subtle' : 'ghost'}
        size="sm"
        colorPalette={isActive ? 'blue' : 'gray'}
        aria-label={label}
      >
        <Link href={href} onClick={onNavigate}>
          <Icon asChild boxSize={4}>
            <NavIcon />
          </Icon>
        </Link>
      </IconButton>
    )

    return (
      <Flex justify="center">
        <Tooltip.Root positioning={{ placement: 'right' }}>
          <Tooltip.Trigger asChild>{iconControl}</Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>{label}</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </Flex>
    )
  }

  return button
}

export function AppSidebar({
  displayName,
  avatarUrl,
  collapsed,
  permissionIds,
  activeEvent = null,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname()
  const initials = getInitials(displayName)
  const navItems = buildNavItems(permissionIds, activeEvent)
  const activeEventHref = activeEvent
    ? activeEventNavHref(activeEvent.id)
    : null

  return (
    <Flex direction="column" height="full" bg="bg.subtle">
      <Box
        px={collapsed ? 2 : 3}
        py={3}
        borderBottomWidth="1px"
        borderColor="border"
      >
        {collapsed ? (
          <Flex justify="center">
            <Link href="/dashboard" aria-label="ClashPoint dashboard" onClick={onNavigate}>
              <Flex
                align="center"
                justify="center"
                boxSize={8}
                rounded="lg"
                bg="blue.solid"
                color="blue.contrast"
              >
                <Text fontSize="xs" fontWeight="semibold">
                  CP
                </Text>
              </Flex>
            </Link>
          </Flex>
        ) : (
          <Button
            asChild
            variant="ghost"
            width="full"
            justifyContent="flex-start"
            height="auto"
            py={2}
            px={3}
          >
            <Link href="/dashboard" onClick={onNavigate}>
              <Flex
                align="center"
                justify="center"
                boxSize={8}
                rounded="lg"
                bg="blue.solid"
                color="blue.contrast"
                flexShrink={0}
              >
                <Text fontSize="xs" fontWeight="semibold">
                  CP
                </Text>
              </Flex>
              <Box textAlign="left">
                <Text fontWeight="semibold" fontSize="sm">
                  ClashPoint
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  Admin
                </Text>
              </Box>
            </Link>
          </Button>
        )}
      </Box>

      <Box flex="1" overflowY="auto" px={collapsed ? 1 : 2} py={2}>
        {!collapsed ? (
          <Text
            px={3}
            py={1}
            fontSize="xs"
            fontWeight="medium"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            Navigation
          </Text>
        ) : null}
        <Flex direction="column" gap={1} mt={collapsed ? 0 : 1}>
          {navItems.map((item) => {
            const isActive =
              !item.disabled &&
              isDashboardNavItemActive(pathname, item.href, activeEventHref)

            return (
              <NavItem
                key={item.href}
                collapsed={collapsed}
                label={item.label}
                href={item.href}
                icon={item.icon}
                isActive={isActive}
                disabled={item.disabled}
                badge={item.badge}
                onNavigate={onNavigate}
              />
            )
          })}
        </Flex>
      </Box>

      <Box
        px={collapsed ? 2 : 2}
        py={3}
        borderTopWidth="1px"
        borderColor="border"
      >
        <Popover.Root positioning={{ placement: 'top-start' }}>
          <Popover.Trigger asChild>
            {collapsed ? (
              <Flex justify="center">
                <IconButton variant="ghost" size="sm" aria-label="Account menu">
                  <Avatar.Root size="sm" shape="rounded">
                    {avatarUrl ? (
                      <Avatar.Image src={avatarUrl} alt={displayName} />
                    ) : null}
                    <Avatar.Fallback>{initials}</Avatar.Fallback>
                  </Avatar.Root>
                </IconButton>
              </Flex>
            ) : (
              <Button
                variant="ghost"
                width="full"
                justifyContent="flex-start"
                height="auto"
                py={2}
                px={3}
              >
                <Avatar.Root size="sm" shape="rounded">
                  {avatarUrl ? (
                    <Avatar.Image src={avatarUrl} alt={displayName} />
                  ) : null}
                  <Avatar.Fallback>{initials}</Avatar.Fallback>
                </Avatar.Root>
                <Box textAlign="left" flex="1">
                  <Text fontSize="sm" fontWeight="medium" truncate>
                    {displayName}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    Admin
                  </Text>
                </Box>
              </Button>
            )}
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content width="14rem" p={2}>
              <Flex align="center" gap={2} px={1} py={1}>
                <Avatar.Root size="sm" shape="rounded">
                  {avatarUrl ? (
                    <Avatar.Image src={avatarUrl} alt={displayName} />
                  ) : null}
                  <Avatar.Fallback>{initials}</Avatar.Fallback>
                </Avatar.Root>
                <Box>
                  <Text fontSize="sm" fontWeight="medium">
                    {displayName}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    Admin
                  </Text>
                </Box>
              </Flex>
              <Box borderTopWidth="1px" borderColor="border" my={2} />
              <Button
                variant="ghost"
                width="full"
                justifyContent="flex-start"
                color="fg.error"
                size="sm"
                onClick={() => {
                  void signOutAction()
                }}
              >
                <Icon asChild boxSize={4}>
                  <LogOutIcon />
                </Icon>
                Sign out
              </Button>
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>
      </Box>
    </Flex>
  )
}
