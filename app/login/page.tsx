import { redirect } from 'next/navigation'

import { LoginForm } from '@/features/auth/components/login-form'
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

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <main className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            ClashPoint
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use the credentials provided by your organization.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </main>
    </div>
  )
}
