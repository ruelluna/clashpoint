'use server'

import { redirect } from 'next/navigation'

import { needsBootstrapSetup } from '@/features/auth/queries'
import { createFirstUserSchema, loginSchema } from '@/features/auth/schema'
import { createFirstAdminUser } from '@/features/auth/service'
import { POST_BOOTSTRAP_REDIRECT, safeRedirectPath } from '@/features/auth/utils'
import { getProfile } from '@/lib/auth/queries'
import { canAccessDashboard } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'

export type SignInState = {
  error?: string
}

export type CreateFirstUserState = {
  error?: string
}

export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  if (await needsBootstrapSetup()) {
    return { error: 'Create the first admin account before signing in.' }
  }

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid credentials' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'Invalid email or password' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Invalid email or password' }
  }

  const profile = await getProfile(user.id)

  if (!profile || !profile.is_active || !canAccessDashboard(profile.role)) {
    await supabase.auth.signOut()
    return { error: 'Access denied. Staff account required.' }
  }

  const redirectTo = safeRedirectPath(formData.get('redirectTo')?.toString())
  redirect(redirectTo)
}

export async function createFirstUserAction(
  _prevState: CreateFirstUserState,
  formData: FormData
): Promise<CreateFirstUserState> {
  const displayName = formData.get('displayName')?.toString().trim()

  const parsed = createFirstUserSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    displayName: displayName || undefined,
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Invalid account details',
    }
  }

  const result = await createFirstAdminUser(parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Account created but sign-in failed. Try signing in.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Account created but sign-in failed. Try signing in.' }
  }

  const profile = await getProfile(user.id)

  if (!profile || !canAccessDashboard(profile.role)) {
    await supabase.auth.signOut()
    return { error: 'Access denied. Staff account required.' }
  }

  redirect(POST_BOOTSTRAP_REDIRECT)
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
