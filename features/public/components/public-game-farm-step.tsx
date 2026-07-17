'use client'

import {
  Button,
  Flex,
  Input,
  Stack,
  Tabs,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useActionState, useEffect, useState } from 'react'

import { OwnerContactFields } from '@/features/entries/components/owner-contact-fields'
import {
  registerPublicGameFarmAction,
  sendPublicOwnerVerificationAction,
  verifyPublicOwnerVerificationAction,
  type PublicRegistrationActionState,
} from '@/features/public/actions'
import { PublicGameFarmPicker } from '@/features/public/components/public-game-farm-picker'

type PublicGameFarmStepProps = {
  eventId: string
  onComplete: (state: PublicRegistrationActionState) => void
}

const initialState: PublicRegistrationActionState = {}

export function PublicGameFarmStep({ eventId, onComplete }: PublicGameFarmStepProps) {
  const [newState, newAction, newPending] = useActionState(
    registerPublicGameFarmAction,
    initialState
  )
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyPublicOwnerVerificationAction,
    initialState
  )

  const [contact, setContact] = useState({
    contactFullName: '',
    contactDesignation: '',
    contactNumber: '',
    email: '',
  })
  const [selectedFarm, setSelectedFarm] = useState<{ id: string; displayName: string } | null>(
    null
  )
  const [otpCode, setOtpCode] = useState('')
  const [sendState, setSendState] = useState<PublicRegistrationActionState>({})
  const [sendPending, setSendPending] = useState(false)

  useEffect(() => {
    if (newState.step === 'roosters' && newState.success) {
      onComplete(newState)
      return
    }
    if (verifyState.step === 'roosters' && verifyState.success) {
      onComplete(verifyState)
    }
  }, [newState, verifyState, onComplete])

  async function handleSendCode() {
    if (!selectedFarm) return
    setSendPending(true)
    setSendState({})
    const result = await sendPublicOwnerVerificationAction({
      eventId,
      competitorId: selectedFarm.id,
    })
    setSendState(result)
    setSendPending(false)
  }

  return (
    <Stack gap={6} maxW="2xl">
      <Stack gap={1}>
        <Text fontSize="xl" fontWeight="semibold">
          Step 1 — Game farm
        </Text>
        <Text color="fg.muted" fontSize="sm">
          Register a new game farm or choose an existing one from prior events.
        </Text>
      </Stack>

      <Tabs.Root defaultValue="new" variant="enclosed">
        <Tabs.List>
          <Tabs.Trigger value="new">New game farm</Tabs.Trigger>
          <Tabs.Trigger value="existing">Existing game farm</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="new" pt={4}>
          <form action={newAction}>
            <Stack gap={4}>
              <input type="hidden" name="eventId" value={eventId} />
              {newState.error ? (
                <Text color="red.fg" fontSize="sm">
                  {newState.error}
                </Text>
              ) : null}
              <Stack gap={1}>
                <Text fontSize="sm" fontWeight="medium">
                  Game farm name
                </Text>
                <Input name="ownerName" maxLength={200} required />
              </Stack>
              <OwnerContactFields values={contact} onChange={setContact} />
              <Stack gap={1}>
                <Text fontSize="sm" fontWeight="medium">
                  Notes
                </Text>
                <Textarea name="notes" rows={3} maxLength={2000} />
              </Stack>
              <Button type="submit" loading={newPending}>
                Continue to rooster registration
              </Button>
            </Stack>
          </form>
        </Tabs.Content>

        <Tabs.Content value="existing" pt={4}>
          <Stack gap={4}>
            <PublicGameFarmPicker
              selectedId={selectedFarm?.id ?? ''}
              selectedName={selectedFarm?.displayName ?? ''}
              onSelect={setSelectedFarm}
            />

            {sendState.error ? (
              <Text color="red.fg" fontSize="sm">
                {sendState.error}
              </Text>
            ) : null}
            {sendState.success ? (
              <Text color="green.fg" fontSize="sm">
                {sendState.success}
                {sendState.testCode ? ` Test code: ${sendState.testCode}` : ''}
              </Text>
            ) : null}

            <Flex gap={2} wrap="wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSendCode()}
                loading={sendPending}
                disabled={!selectedFarm}
              >
                Send verification code
              </Button>
            </Flex>

            <form action={verifyAction}>
              <Stack gap={4}>
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="competitorId" value={selectedFarm?.id ?? ''} />
                {verifyState.error ? (
                  <Text color="red.fg" fontSize="sm">
                    {verifyState.error}
                  </Text>
                ) : null}
                <Stack gap={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Verification code
                  </Text>
                  <Input
                    name="code"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    required
                  />
                </Stack>
                <Button
                  type="submit"
                  loading={verifyPending}
                  disabled={!selectedFarm || otpCode.trim().length !== 6}
                >
                  Verify and continue
                </Button>
              </Stack>
            </form>
          </Stack>
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  )
}
