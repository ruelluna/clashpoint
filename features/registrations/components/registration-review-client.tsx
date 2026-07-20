'use client'

import { Badge, Box, Button, Flex, NativeSelect, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import type { RegistrationListItem } from '@/features/registrations/types'
import {
  APPROVAL_STATUS_LABELS,
  ELIGIBILITY_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
} from '@/lib/derby/enums'
import type {
  EligibilityStatus,
  RegistrationWorkflowStatus,
  RoosterApprovalStatus,
} from '@/lib/derby/enums'
import {
  eligibilityStatusColorPalette,
  registrationWorkflowStatusColorPalette,
} from '@/lib/derby/status-colors'

type RegistrationReviewClientProps = {
  eventId: string
  eventName: string
  registrations: RegistrationListItem[]
}

const statusFilterOptions: Array<{ value: '' | RegistrationWorkflowStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  ...(
    Object.entries(REGISTRATION_STATUS_LABELS) as Array<[RegistrationWorkflowStatus, string]>
  ).map(([value, label]) => ({ value, label })),
]

export function RegistrationReviewClient({
  eventId,
  eventName,
  registrations,
}: RegistrationReviewClientProps) {
  const [statusFilter, setStatusFilter] = useState<'' | RegistrationWorkflowStatus>('')
  const [eligibilityFilter, setEligibilityFilter] = useState<'' | EligibilityStatus>('')

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((registration) => {
      if (statusFilter && registration.registration_status !== statusFilter) return false
      if (eligibilityFilter && registration.eligibility_status !== eligibilityFilter) {
        return false
      }
      return true
    })
  }, [registrations, statusFilter, eligibilityFilter])

  const pendingReviewCount = registrations.filter((row) =>
    ['submitted', 'pending_review'].includes(row.registration_status)
  ).length

  return (
    <PageStack>
      <PageHeader
        title="Registrations"
        description={`${eventName} · ${registrations.length} registration${registrations.length === 1 ? '' : 's'} · ${pendingReviewCount} awaiting review`}
      />

      <Flex gap={4} direction={{ base: 'column', sm: 'row' }} wrap="wrap">
        <Flex align="center" gap={3} maxW="xs">
          <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
            Status
          </Text>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.currentTarget.value as '' | RegistrationWorkflowStatus)
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

        <Flex align="center" gap={3} maxW="xs">
          <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
            Eligibility
          </Text>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              value={eligibilityFilter}
              onChange={(event) =>
                setEligibilityFilter(event.currentTarget.value as '' | EligibilityStatus)
              }
            >
              <option value="">All eligibility</option>
              {(
                Object.entries(ELIGIBILITY_STATUS_LABELS) as Array<[EligibilityStatus, string]>
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Flex>
      </Flex>

      <PanelCard flush>
        <Flex
          px={4}
          py={4}
          borderBottomWidth="1px"
          borderColor="border"
          fontWeight="medium"
          fontSize="sm"
          display={{ base: 'none', lg: 'flex' }}
        >
          <Box flex="0.6">Cock</Box>
          <Box flex="1.2">Entry</Box>
          <Box flex="0.8">Registry</Box>
          <Box flex="0.9">Registration</Box>
          <Box flex="0.8">Approval</Box>
          <Box flex="0.8">Eligibility</Box>
          <Box flex="0.6" textAlign="right">
            Review
          </Box>
        </Flex>

        {filteredRegistrations.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No registrations match these filters.</Text>
          </Box>
        ) : (
          filteredRegistrations.map((registration) => (
            <Box
              key={registration.id}
              px={4}
              py={4}
              borderBottomWidth="1px"
              borderColor="border"
            >
              <Flex
                direction={{ base: 'column', lg: 'row' }}
                gap={3}
                align={{ lg: 'center' }}
              >
                <Box flex="0.6">
                  <Text fontWeight="semibold">#{registration.cock_number}</Text>
                  <Text fontSize="xs" color="fg.muted">
                    {registration.band_number}
                  </Text>
                </Box>
                <Box flex="1.2">
                  <Text fontWeight="medium">
                    #{registration.entry_number} · {registration.entry_name}
                  </Text>
                </Box>
                <Box flex="0.8">
                  <Text fontSize="sm">{registration.rooster_code ?? '—'}</Text>
                </Box>
                <Box flex="0.9">
                  <Badge
                    colorPalette={registrationWorkflowStatusColorPalette(registration.registration_status)}
                    size="sm"
                  >
                    {REGISTRATION_STATUS_LABELS[registration.registration_status]}
                  </Badge>
                </Box>
                <Box flex="0.8">
                  <Text fontSize="sm">
                    {APPROVAL_STATUS_LABELS[registration.approval_status as RoosterApprovalStatus]}
                  </Text>
                </Box>
                <Box flex="0.8">
                  <Badge
                    colorPalette={eligibilityStatusColorPalette(registration.eligibility_status)}
                    size="sm"
                  >
                    {ELIGIBILITY_STATUS_LABELS[registration.eligibility_status]}
                  </Badge>
                </Box>
                <Box flex="0.6">
                  <Flex justify={{ base: 'flex-start', lg: 'flex-end' }}>
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/dashboard/events/${eventId}/roosters?highlight=${registration.id}`}
                      >
                        Open
                      </Link>
                    </Button>
                  </Flex>
                </Box>
              </Flex>
            </Box>
          ))
        )}
      </PanelCard>
    </PageStack>
  )
}
