'use client'

import { Badge, Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'

import { ButtonGroup, LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import { RoosterFormClient } from '@/features/roosters/components/rooster-form-client'
import type { RoosterParticipationItem, RoosterWithBands } from '@/features/roosters/types'
import {
  AGE_CLASS_LABELS,
  APPROVAL_STATUS_LABELS,
  COMPETITION_CLASS_LABELS,
  ELIGIBILITY_STATUS_LABELS,
  EXPERIENCE_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
} from '@/lib/derby/enums'
import type {
  AgeClass,
  CompetitionClass,
  EligibilityStatus,
  ExperienceStatus,
  RegistrationWorkflowStatus,
  RoosterApprovalStatus,
} from '@/lib/derby/enums'

type RoosterProfileClientProps = {
  rooster: RoosterWithBands
  participations: RoosterParticipationItem[]
  fightStats: { totalFights: number; wins: number }
  canUpdate: boolean
}

function eligibilityColor(
  status: string
): 'green' | 'orange' | 'yellow' | 'red' | 'gray' {
  switch (status) {
    case 'eligible':
      return 'green'
    case 'conditionally_eligible':
      return 'orange'
    case 'pending_review':
      return 'yellow'
    case 'ineligible':
      return 'red'
    default:
      return 'gray'
  }
}

export function RoosterProfileClient({
  rooster,
  participations,
  fightStats,
  canUpdate,
}: RoosterProfileClientProps) {
  return (
    <PageStack>
      <PageHeader
        title={rooster.name ?? rooster.rooster_code}
        description={`Registry rooster ${rooster.rooster_code} · ${fightStats.totalFights} fight${fightStats.totalFights === 1 ? '' : 's'} · ${fightStats.wins} win${fightStats.wins === 1 ? '' : 's'}`}
        actions={
          canUpdate ? (
            <Button asChild alignSelf={{ base: 'flex-start', sm: 'auto' }} variant="outline">
              <Link href="#edit-rooster">Edit profile</Link>
            </Button>
          ) : undefined
        }
      />

      <Flex direction={{ base: 'column', lg: 'row' }} gap={LAYOUT_GAP.section}>
        <Box flex="1">
          <PanelCard title="Profile">
          <Stack gap={3} fontSize="sm">
            <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
              <Text color="fg.muted">Age class</Text>
              <Badge variant="subtle">
                {AGE_CLASS_LABELS[rooster.age_class as AgeClass]}
              </Badge>
            </Flex>
            <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
              <Text color="fg.muted">Competition class</Text>
              <Text>
                {COMPETITION_CLASS_LABELS[rooster.competition_class as CompetitionClass]}
              </Text>
            </Flex>
            <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
              <Text color="fg.muted">Experience</Text>
              <Text>
                {
                  EXPERIENCE_STATUS_LABELS[
                    rooster.calculated_experience_status as ExperienceStatus
                  ]
                }
              </Text>
            </Flex>
            <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
              <Text color="fg.muted">Origin</Text>
              <Text textTransform="capitalize">{rooster.origin_type.replace(/_/g, ' ')}</Text>
            </Flex>
            {rooster.breed ? (
              <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
                <Text color="fg.muted">Breed</Text>
                <Text>{rooster.breed}</Text>
              </Flex>
            ) : null}
            {rooster.bloodline ? (
              <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
                <Text color="fg.muted">Bloodline</Text>
                <Text>{rooster.bloodline}</Text>
              </Flex>
            ) : null}
            {rooster.hatch_date ? (
              <Flex justify="space-between" gap={4} direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }}>
                <Text color="fg.muted">Hatch date</Text>
                <Text>
                  {rooster.hatch_date}
                  {rooster.hatch_date_is_estimated ? ' (est.)' : ''}
                </Text>
              </Flex>
            ) : null}
          </Stack>
          </PanelCard>
        </Box>

        <Box flex="1">
          <PanelCard title="Bands">
          {rooster.bands.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              No bands recorded.
            </Text>
          ) : (
            <Stack gap={3}>
              {rooster.bands.map((band) => (
                <Box
                  key={band.id}
                  p={3}
                  borderWidth="1px"
                  borderColor="border"
                  rounded="md"
                  fontSize="sm"
                >
                  <Text fontWeight="medium">{band.band_number}</Text>
                  <Text color="fg.muted">
                    {band.band_level.replace(/_/g, ' ')} · {band.verification_status}
                  </Text>
                </Box>
              ))}
            </Stack>
          )}
          </PanelCard>
        </Box>
      </Flex>

      <PanelCard flush title="Event participation">
        <Flex
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor="border"
          fontWeight="medium"
          fontSize="sm"
          display={{ base: 'none', md: 'flex' }}
        >
          <Box flex="1.2">Event</Box>
          <Box flex="1">Entry</Box>
          <Box flex="0.6">Cock</Box>
          <Box flex="0.8">Registration</Box>
          <Box flex="0.8">Eligibility</Box>
        </Flex>

        {participations.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No event registrations linked to this rooster yet.</Text>
          </Box>
        ) : (
          participations.map((participation) => (
            <Link
              key={participation.id}
              href={`/dashboard/events/${participation.event_id}/roosters?highlight=${participation.id}`}
            >
              <Flex
                px={4}
                py={3}
                borderBottomWidth="1px"
                borderColor="border"
                direction={{ base: 'column', md: 'row' }}
                gap={2}
                align={{ md: 'center' }}
                _hover={{ bg: 'bg.subtle' }}
              >
                <Box flex="1.2">
                  <Text fontWeight="medium">{participation.event_name}</Text>
                  <Text fontSize="xs" color="fg.muted">
                    Band {participation.band_number}
                  </Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">
                    #{participation.entry_number} · {participation.entry_name}
                  </Text>
                </Box>
                <Box flex="0.6">
                  <Text fontSize="sm">#{participation.cock_number}</Text>
                </Box>
                <Box flex="0.8">
                  <Badge variant="subtle" size="sm">
                    {
                      REGISTRATION_STATUS_LABELS[
                        participation.registration_status as RegistrationWorkflowStatus
                      ]
                    }
                  </Badge>
                  <Text fontSize="xs" color="fg.muted" mt={1}>
                    {
                      APPROVAL_STATUS_LABELS[
                        participation.approval_status as RoosterApprovalStatus
                      ]
                    }
                  </Text>
                </Box>
                <Box flex="0.8">
                  <Badge
                    colorPalette={eligibilityColor(participation.eligibility_status)}
                    size="sm"
                  >
                    {
                      ELIGIBILITY_STATUS_LABELS[
                        participation.eligibility_status as EligibilityStatus
                      ]
                    }
                  </Badge>
                </Box>
              </Flex>
            </Link>
          ))
        )}
      </PanelCard>

      {canUpdate ? (
        <Box id="edit-rooster">
          <RoosterFormClient mode="edit" rooster={rooster} />
        </Box>
      ) : null}

      <ButtonGroup>
        <Button asChild variant="outline">
          <Link href="/dashboard/roosters">Back to registry</Link>
        </Button>
      </ButtonGroup>
    </PageStack>
  )
}
