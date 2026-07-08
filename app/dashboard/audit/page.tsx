import { Badge, Box, Flex, Text } from '@chakra-ui/react'

import { listAuditLogs } from '@/features/audit/queries'
import { requirePermission } from '@/lib/auth/permissions'

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
    <Box className="space-y-6">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          Audit trail
        </Text>
        <Text color="fg.muted">{count} entries</Text>
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        {logs.length === 0 ? (
          <Box p={4}>
            <Text color="fg.muted">No audit entries found.</Text>
          </Box>
        ) : (
          logs.map((log) => (
            <Flex
              key={log.id}
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor="border"
              direction="column"
              gap={1}
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
            </Flex>
          ))
        )}
      </Box>
    </Box>
  )
}
