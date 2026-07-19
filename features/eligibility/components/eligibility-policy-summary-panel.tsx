import { Badge, Box, Flex, Stack, Text } from '@chakra-ui/react'

import { LAYOUT_GAP, PanelCard } from '@/components/dashboard'
import type { EligibilityPolicySummary } from '@/features/eligibility/policy-summary'
import type { PolicyStatus } from '@/lib/derby/enums'
import { policyStatusColorPalette } from '@/lib/derby/status-colors'

type EligibilityPolicySummaryPanelProps = {
  summary: EligibilityPolicySummary
  requireRoosterEntryApproval?: boolean
  classificationMatchingEnabled?: boolean
}

function formatPolicyStatus(status: string | null) {
  if (!status) return null
  return status.replaceAll('_', ' ')
}

export function EligibilityPolicySummaryPanel({
  summary,
  requireRoosterEntryApproval = false,
  classificationMatchingEnabled = false,
}: EligibilityPolicySummaryPanelProps) {
  if (summary.items.length === 0) return null

  return (
    <PanelCard title="Eligibility & registration options">
      <Stack gap={LAYOUT_GAP.form} fontSize="sm">
        <Flex gap={2} wrap="wrap" align="center">
          <Badge colorPalette={summary.enforcementEnabled ? 'green' : 'gray'}>
            {summary.enforcementEnabled ? 'Enforcement on' : 'Enforcement off'}
          </Badge>
          {summary.policyStatus ? (
            <Badge colorPalette={policyStatusColorPalette(summary.policyStatus as PolicyStatus)}>
              Policy: {formatPolicyStatus(summary.policyStatus)}
            </Badge>
          ) : null}
          {requireRoosterEntryApproval ? (
            <Badge colorPalette="orange">Rooster entry approval required</Badge>
          ) : null}
          {classificationMatchingEnabled ? (
            <Badge colorPalette="blue">Classification matching enabled</Badge>
          ) : null}
        </Flex>

        <Text color="fg.muted">{summary.unknownValueHandling}</Text>

        {summary.items.map((item) => (
          <Box
            key={item.field}
            borderWidth="1px"
            borderColor="border"
            borderRadius="md"
            p={4}
          >
            <Text fontWeight="semibold">{item.label}</Text>
            <Text color="fg.muted" mt={1}>
              {item.description}
            </Text>

            <Text fontWeight="medium" mt={3} mb={1}>
              Configured options
            </Text>
            <Stack as="ul" gap={1} pl={4} listStyleType="disc">
              {item.configuredOptions.map((option) => (
                <Box as="li" key={option}>
                  {option}
                </Box>
              ))}
            </Stack>

            <Text fontWeight="medium" mt={3} mb={1}>
              Fields to fill on rooster entry
            </Text>
            <Stack as="ul" gap={1} pl={4} listStyleType="disc">
              {item.entryFieldsToFill.map((field) => (
                <Box as="li" key={field}>
                  {field}
                </Box>
              ))}
            </Stack>
          </Box>
        ))}

        {summary.workflowNotes.length > 0 ? (
          <Box>
            <Text fontWeight="medium" mb={1}>
              Additional workflow requirements
            </Text>
            <Stack as="ul" gap={1} pl={4} listStyleType="disc" color="fg.muted">
              {summary.workflowNotes.map((note) => (
                <Box as="li" key={note}>
                  {note}
                </Box>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Stack>
    </PanelCard>
  )
}
