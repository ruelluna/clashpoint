'use client'

import { Box, Grid, Text } from '@chakra-ui/react'

import type { PromoterDashboardStats } from '@/features/promoter-portal/types'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <Text fontSize="3xl" fontWeight="semibold" mt={1}>
        {value}
      </Text>
    </Box>
  )
}

export function PortalDashboardClient({
  stats,
}: {
  stats: PromoterDashboardStats
}) {
  return (
    <Box className="space-y-6">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          Dashboard
        </Text>
        <Text color="fg.muted">
          {stats.promoter_name
            ? `Overview for ${stats.promoter_name}`
            : 'System overview for assigned promoter events'}
        </Text>
      </Box>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
        <StatCard label="Assigned events" value={stats.assigned_events_count} />
        <StatCard label="Upcoming events" value={stats.upcoming_events_count} />
        <StatCard label="Referred entries" value={stats.referred_entries_count} />
        <StatCard label="Pending settlements" value={stats.pending_settlements_count} />
      </Grid>
    </Box>
  )
}
