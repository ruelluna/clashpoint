import 'server-only'

import type { CreateFirstUserInput } from '@/features/auth/schema'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createFirstAdminUser(
  input: CreateFirstUserInput
): Promise<{ error?: string; userId?: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error:
        'Initial setup is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your environment.',
    }
  }

  const supabase = createAdminClient()
  const { data: needsBootstrap, error: bootstrapError } =
    await supabase.rpc('needs_bootstrap')

  if (bootstrapError) {
    return {
      error:
        'Unable to verify setup state. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are from the same project (run supabase status for local keys).',
    }
  }

  if (!needsBootstrap) {
    return { error: 'An admin account already exists. Sign in instead.' }
  }

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: input.displayName
        ? { display_name: input.displayName }
        : undefined,
    })

  if (createError || !created.user) {
    if (createError?.message?.includes('already been registered')) {
      return {
        error:
          'That email is already in Supabase Auth from a previous setup attempt. Remove it in Supabase Studio (Authentication → Users) or run supabase db reset locally, then try again.',
      }
    }

    return { error: createError?.message ?? 'Failed to create admin account.' }
  }

  return { userId: created.user.id }
}
