'use client'

import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'

import { PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import type { RoosterListItem } from '@/features/roosters/types'
import {
  AGE_CLASS_LABELS,
  COMPETITION_CLASS_LABELS,
  EXPERIENCE_STATUS_LABELS,
} from '@/lib/derby/enums'
import type { AgeClass, CompetitionClass, ExperienceStatus } from '@/lib/derby/enums'

type RoostersListClientProps = {
  roosters: RoosterListItem[]
  canCreate: boolean
}

function formatOrigin(originType: string) {
  return originType.replace(/_/g, ' ')
}

export function RoostersListClient({ roosters, canCreate }: RoostersListClientProps) {
  return (
    <PageStack>
      <PageHeader
        title="Rooster registry"
        description={`${roosters.length} permanent rooster${roosters.length === 1 ? '' : 's'} in the registry. Link registry roosters to event registrations for eligibility tracking.`}
        actions={
          canCreate ? (
            <Button asChild alignSelf={{ base: 'flex-start', sm: 'auto' }}>
              <Link href="/dashboard/roosters/new">New rooster</Link>
            </Button>
          ) : undefined
        }
      />

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
          <Box flex="1">Code</Box>
          <Box flex="1.2">Name</Box>
          <Box flex="0.8">Age</Box>
          <Box flex="0.8">Class</Box>
          <Box flex="1">Experience</Box>
          <Box flex="0.8">Origin</Box>
        </Flex>

        {roosters.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No roosters in the registry yet.</Text>
            {canCreate ? (
              <Button asChild mt={4} size="sm">
                <Link href="/dashboard/roosters/new">Register first rooster</Link>
              </Button>
            ) : null}
          </Box>
        ) : (
          roosters.map((rooster) => (
            <Link key={rooster.id} href={`/dashboard/roosters/${rooster.id}`}>
              <Flex
                px={4}
                py={4}
                borderBottomWidth="1px"
                borderColor="border"
                direction={{ base: 'column', lg: 'row' }}
                gap={3}
                align={{ lg: 'center' }}
                _hover={{ bg: 'bg.subtle' }}
              >
                <Box flex="1">
                  <Text fontWeight="semibold">{rooster.rooster_code}</Text>
                </Box>
                <Box flex="1.2">
                  <Text fontWeight="medium">{rooster.name ?? '—'}</Text>
                </Box>
                <Box flex="0.8">
                  <Badge variant="subtle" size="sm">
                    {AGE_CLASS_LABELS[rooster.age_class as AgeClass]}
                  </Badge>
                </Box>
                <Box flex="0.8">
                  <Text fontSize="sm">
                    {COMPETITION_CLASS_LABELS[rooster.competition_class as CompetitionClass]}
                  </Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">
                    {
                      EXPERIENCE_STATUS_LABELS[
                        rooster.calculated_experience_status as ExperienceStatus
                      ]
                    }
                  </Text>
                </Box>
                <Box flex="0.8">
                  <Text fontSize="sm" color="fg.muted" textTransform="capitalize">
                    {formatOrigin(rooster.origin_type)}
                  </Text>
                </Box>
              </Flex>
            </Link>
          ))
        )}
      </PanelCard>
    </PageStack>
  )
}
