'use client'

import { Badge, Box, Button, Flex, NativeSelect, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import { promoterStatusColorPalette } from '@/features/promoters/display-utils'
import {
  COMMISSION_TYPE_LABELS,
  PROMOTER_STATUS_LABELS,
} from '@/features/promoters/schema'
import type { PromoterListItem, PromoterStatus } from '@/features/promoters/types'

const statusFilterOptions: Array<{ value: '' | PromoterStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

function formatCommission(promoter: PromoterListItem): string {
  if (promoter.commission_type === 'none') return 'None'
  if (promoter.commission_type === 'custom') return 'Custom'
  if (promoter.commission_value == null) return '—'
  if (promoter.commission_type === 'percentage') {
    return `${promoter.commission_value}%`
  }
  return promoter.commission_value.toLocaleString()
}

export function PromotersListClient({
  promoters,
}: {
  promoters: PromoterListItem[]
}) {
  const [statusFilter, setStatusFilter] = useState<'' | PromoterStatus>('')

  const filteredPromoters = useMemo(() => {
    if (!statusFilter) return promoters
    return promoters.filter((promoter) => promoter.status === statusFilter)
  }, [promoters, statusFilter])

  return (
    <PageStack>
      <PageHeader
        title="Promoters"
        description="Manage external promoters and commission settings."
        actions={
          <Button asChild alignSelf={{ base: 'flex-start', md: 'auto' }}>
            <Link href="/dashboard/promoters/new">Add promoter</Link>
          </Button>
        }
      />

      <Flex align="center" gap={3} maxW="xs">
        <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
          Filter by status
        </Text>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.currentTarget.value as '' | PromoterStatus)
            }
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Flex>

      <PanelCard flush>
        <Flex
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor="border"
          fontWeight="medium"
          fontSize="sm"
          display={{ base: 'none', lg: 'flex' }}
        >
          <Box flex="2">Promoter</Box>
          <Box flex="1">Status</Box>
          <Box flex="1">Commission</Box>
          <Box flex="1">Login</Box>
        </Flex>
        {filteredPromoters.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No promoters match this filter.</Text>
          </Box>
        ) : (
          filteredPromoters.map((promoter) => (
            <Link key={promoter.id} href={`/dashboard/promoters/${promoter.id}`}>
              <Flex
                px={4}
                py={3}
                borderBottomWidth="1px"
                borderColor="border"
                direction={{ base: 'column', lg: 'row' }}
                gap={2}
                align={{ lg: 'center' }}
                _hover={{ bg: 'bg.subtle' }}
              >
                <Box flex="2">
                  <Text fontWeight="medium">{promoter.name}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {promoter.contact_person ?? promoter.email ?? promoter.phone ?? '—'}
                  </Text>
                </Box>
                <Box flex="1">
                  <Badge colorPalette={promoterStatusColorPalette(promoter.status)}>
                    {PROMOTER_STATUS_LABELS[promoter.status]}
                  </Badge>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">
                    {COMMISSION_TYPE_LABELS[promoter.commission_type]} ·{' '}
                    {formatCommission(promoter)}
                  </Text>
                </Box>
                <Box flex="1">
                  <Badge colorPalette={promoter.user_id ? 'green' : 'gray'}>
                    {promoter.user_id ? 'Has login' : 'No login'}
                  </Badge>
                </Box>
              </Flex>
            </Link>
          ))
        )}
      </PanelCard>
    </PageStack>
  )
}
