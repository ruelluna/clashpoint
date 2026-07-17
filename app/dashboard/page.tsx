import { Flex, SimpleGrid, Text } from '@chakra-ui/react'

import { LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import { listAuditLogs } from '@/features/audit/queries'
import { getUserCount } from '@/features/users/queries'
import { requireDashboardAccess } from '@/lib/auth'

async function getEventCount(): Promise<number> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
    return count ?? 0
  } catch {
    return 0
  }
}

export default async function DashboardPage() {
  const profile = await requireDashboardAccess()
  const [userCount, eventCount, auditResult] = await Promise.all([
    getUserCount().catch(() => 0),
    getEventCount(),
    listAuditLogs({ limit: 5 }).catch(() => ({ logs: [], count: 0 })),
  ])

  const cards = [
    { label: 'Users', value: userCount },
    { label: 'Events', value: eventCount },
    { label: 'Audit entries', value: auditResult.count },
  ]

  return (
    <PageStack>
      <PageHeader
        title="Dashboard"
        description={`Signed in as ${profile.display_name ?? profile.role}.`}
      />

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={LAYOUT_GAP.form}>
        {cards.map((card) => (
          <PanelCard key={card.label}>
            <Text fontSize="sm" color="fg.muted">
              {card.label}
            </Text>
            <Text fontSize="3xl" fontWeight="bold">
              {card.value}
            </Text>
          </PanelCard>
        ))}
      </SimpleGrid>

      <PanelCard title="Recent activity">
        {auditResult.logs.length === 0 ? (
          <Text color="fg.muted" fontSize="sm">
            No audit entries yet.
          </Text>
        ) : (
          <Flex direction="column" gap={2}>
            {auditResult.logs.map((log) => (
              <Flex
                key={log.id}
                justify="space-between"
                direction={{ base: 'column', sm: 'row' }}
                gap={{ base: 1, sm: 0 }}
                fontSize="sm"
                borderBottomWidth="1px"
                borderColor="border"
                pb={2}
              >
                <Text>
                  {log.action} · {log.entity_type}
                </Text>
                <Text color="fg.muted">
                  {new Date(log.created_at).toLocaleString()}
                </Text>
              </Flex>
            ))}
          </Flex>
        )}
      </PanelCard>
    </PageStack>
  )
}
