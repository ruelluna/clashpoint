'use server'

import { redirect } from 'next/navigation'

import { loginSchema } from '@/features/auth/schema'
import { safeRedirectPath } from '@/features/auth/utils'
import { createClient } from '@/lib/supabase/server'

export type SignInState = {
  error?: string
}

export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
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

  const redirectTo = safeRedirectPath(formData.get('redirectTo')?.toString())
  redirect(redirectTo)
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
