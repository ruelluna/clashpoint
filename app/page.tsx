function getSupabaseEnvStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return { configured: false as const, connected: false as const }
  }

  return { configured: true as const, url }
}

export default function Home() {
  const envStatus = getSupabaseEnvStatus()

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <main className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            ClashPoint
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Event fights, scoring, and leaderboards
          </h1>
          <p className="text-muted-foreground">
            Next.js App Router with Supabase SSR is ready for local development.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/events"
            className="inline-flex items-center rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Browse public events
          </a>
          <a
            href="/portal"
            className="inline-flex items-center rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Promoter portal
          </a>
        </div>

        <dl className="rounded-xl border bg-card p-6 text-left text-sm">
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Supabase env</dt>
              <dd className="font-medium">
                {envStatus.configured ? 'Configured' : 'Missing'}
              </dd>
            </div>
            {envStatus.configured ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Supabase URL</dt>
                <dd className="truncate font-mono text-xs">{envStatus.url}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Supabase API</dt>
              <dd className="font-medium">
                {envStatus.configured ? 'Ready' : 'Not configured'}
              </dd>
            </div>
          </div>
        </dl>
      </main>
    </div>
  )
}
