import { redirect } from 'next/navigation'

import { LoginPageClient } from '@/features/auth/components/login-page-client'
import { getProfileForUser } from '@/lib/auth'

type LoginPageProps = {
  searchParams: Promise<{ redirectTo?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const profile = await getProfileForUser()

  if (profile?.role === 'admin') {
    redirect('/dashboard')
  }

  const { redirectTo } = await searchParams

  return <LoginPageClient redirectTo={redirectTo} />
}
