import { redirect } from 'next/navigation'

import { LoginPageClient } from '@/features/auth/components/login-page-client'
import { needsBootstrapSetup } from '@/features/auth/queries'
import { getProfileForUser } from '@/lib/auth'
import { isSystemOwnerRole } from '@/lib/auth/permissions'

type LoginPageProps = {
  searchParams: Promise<{ redirectTo?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const profile = await getProfileForUser()

  if (profile && isSystemOwnerRole(profile.role)) {
    redirect('/dashboard')
  }

  const { redirectTo } = await searchParams
  const needsBootstrap = await needsBootstrapSetup()

  return (
    <LoginPageClient needsBootstrap={needsBootstrap} redirectTo={redirectTo} />
  )
}
