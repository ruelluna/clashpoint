export function LoginLayoutFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <main className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-4 w-24 rounded bg-muted" />
          <div className="mx-auto h-8 w-32 rounded bg-muted" />
          <div className="mx-auto h-4 w-64 rounded bg-muted" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-4">
            <div className="h-16 rounded bg-muted" />
            <div className="h-16 rounded bg-muted" />
            <div className="h-9 rounded bg-muted" />
          </div>
        </div>
      </main>
    </div>
  )
}
