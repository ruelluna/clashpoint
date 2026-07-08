'use client'

import { useActionState } from 'react'
import {
  Button,
  Field,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'

import {
  createFirstUserAction,
  type CreateFirstUserState,
} from '@/features/auth/actions'

const initialState: CreateFirstUserState = {}

export function FirstUserForm() {
  const [state, formAction, pending] = useActionState(
    createFirstUserAction,
    initialState
  )

  return (
    <form action={formAction}>
      <Stack gap={4}>
        <Field.Root required>
          <Field.Label htmlFor="email">Email</Field.Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
          />
        </Field.Root>

        <Field.Root>
          <Field.Label htmlFor="displayName">Display name</Field.Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label htmlFor="password">Password</Field.Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label htmlFor="confirmPassword">Confirm password</Field.Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
          />
        </Field.Root>

        {state.error ? (
          <Text color="fg.error" fontSize="sm" role="alert">
            {state.error}
          </Text>
        ) : null}

        <Button
          type="submit"
          width="full"
          loading={pending}
          colorPalette="blue"
        >
          Create admin account
        </Button>
      </Stack>
    </form>
  )
}
