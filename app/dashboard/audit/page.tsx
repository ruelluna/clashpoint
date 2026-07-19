import { Badge, Box, Flex, Text } from '@chakra-ui/react'

import { PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import { listAuditLogs } from '@/features/audit/queries'
import { requirePermission } from '@/lib/auth/permissions'

function readRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function formatAuditStatusLine(log: {
  old_values: unknown
  new_values: unknown
}): string | null {
  const oldValues = readRecord(log.old_values)
  const newValues = readRecord(log.new_values)
  const oldStatus = oldValues?.status
  const newStatus = newValues?.status

  if (
    typeof oldStatus === 'string' &&
    typeof newStatus === 'string' &&
    oldStatus !== newStatus
  ) {
    return `Status: ${oldStatus} → ${newStatus}`
  }

  return null
}

function formatAuditReasonLine(log: { new_values: unknown }): string | null {
  const newValues = readRecord(log.new_values)
  const reason = newValues?.reason

  if (typeof reason === 'string' && reason.trim()) {
    return `Reason: ${reason}`
  }

  return null
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; action?: string }>
}) {
  await requirePermission('audit.view')
  const params = await searchParams
  const { logs, count } = await listAuditLogs({
    entityType: params.entityType,
    action: params.action,
    limit: 100,
  })

  return (
    <PageStack>
      <PageHeader title="Audit trail" description={`${count} entries`} />

      <PanelCard>
        {logs.length === 0 ? (
          <Text color="fg.muted">No audit entries found.</Text>
        ) : (
          logs.map((log) => {
            const statusLine = formatAuditStatusLine(log)
            const reasonLine = formatAuditReasonLine(log)

            return (
            <Flex
              key={log.id}
              px={0}
              py={3}
              borderBottomWidth="1px"
              borderColor="border"
              direction="column"
              gap={1}
              _last={{ borderBottomWidth: 0 }}
            >
              <Flex justify="space-between" wrap="wrap" gap={2}>
                <Flex gap={2} align="center">
                  <Badge>{log.action}</Badge>
                  <Text fontSize="sm">{log.entity_type}</Text>
                </Flex>
                <Text fontSize="sm" color="fg.muted">
                  {new Date(log.created_at).toLocaleString()}
                </Text>
              </Flex>
              <Text fontSize="xs" color="fg.muted">
                Entity: {log.entity_id}
              </Text>
              {statusLine ? (
                <Text fontSize="sm" color="fg.muted">
                  {statusLine}
                </Text>
              ) : null}
              {reasonLine ? (
                <Text fontSize="sm" color="fg.muted">
                  {reasonLine}
                </Text>
              ) : null}
            </Flex>
            )
          })
        )}
      </PanelCard>
    </PageStack>
  )
}
