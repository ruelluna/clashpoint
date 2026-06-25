'use client'

import { useActionState } from 'react'
import {
  Button,
  Field,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'

import { signInAction, type SignInState } from '@/features/auth/actions'

const initialState: SignInState = {}

type LoginFormProps = {
  redirectTo?: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signInAction, initialState)

  return (
    <form action={formAction}>
      <Stack gap={4}>
        {redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null}

        <Field.Root required>
          <Field.Label htmlFor="email">Email</Field.Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label htmlFor="password">Password</Field.Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
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
          Sign in
        </Button>
      </Stack>
    </form>
  )
}
